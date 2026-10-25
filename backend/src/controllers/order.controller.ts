import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { checkProductAvailability } from '../services/availability.service';
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import { createNotification, notifyAdmins } from '../utils/notification';

const router = Router();

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// Helper to generate order numbers
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `CR-${year}${month}${day}-${rand}`;
}

// 1. Checkout Endpoint
router.post('/checkout', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    deliveryAddress,
    deliveryDetails,
    paymentId,
    paymentMethod,
    utrNumber,
    paymentProofUrl,
  } = req.body;

  if (!deliveryAddress) {
    return res.status(400).json({ error: 'Delivery address is required' });
  }

  // Validate UTR if provided (must be 12 digits when present for UPI_QR)
  const cleanUtr = utrNumber ? String(utrNumber).trim() : '';
  if (cleanUtr && !/^\d{12}$/.test(cleanUtr)) {
    return res.status(400).json({ error: 'Invalid UTR number. Must be exactly 12 digits.' });
  }

  const normalizedPaymentMethod =
    paymentMethod === 'UPI_QR' || paymentMethod === 'QR'
      ? 'UPI_QR'
      : 'COD';

  // Server determines initial payment status:
  // Client-submitted paymentStatus is ignored to prevent tampering.
  // If UTR (or payment proof) is provided for UPI_QR, status is VERIFICATION, otherwise PENDING.
  // Transition to PAID is strictly reserved for Admin via PATCH /api/orders/:id/payment.
  const normalizedPaymentStatus =
    normalizedPaymentMethod === 'UPI_QR' && (cleanUtr || paymentProofUrl)
      ? 'VERIFICATION'
      : 'PENDING';

  try {
    const isKycApproved = req.user!.kycStatus === 'APPROVED';
    const initialOrderStatus = isKycApproved ? 'PLACED' : 'PENDING_APPROVAL';

    // Fetch user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // Validate all cart items for data integrity & business rules before checkout
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    for (const item of cartItems) {
      // 1. Strict quantity check (integer 1..10)
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return res.status(400).json({
          error: 'Corrupted or Invalid Cart Item',
          message: `Item "${item.product?.name || item.productId}" has an invalid quantity (${item.quantity}). Quantity must be an integer between 1 and 10.`,
        });
      }

      // 2. Strict dates check
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Corrupted or Invalid Cart Item',
          message: `Item "${item.product?.name}" contains invalid date values.`,
        });
      }

      if (start < todayMidnight) {
        return res.status(400).json({
          error: 'Corrupted or Invalid Cart Item',
          message: `Rental start date for "${item.product?.name}" is in the past. Please update your cart dates.`,
        });
      }

      if (end < start) {
        return res.status(400).json({
          error: 'Corrupted or Invalid Cart Item',
          message: `Rental end date for "${item.product?.name}" is before the start date.`,
        });
      }

      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 30) {
        return res.status(400).json({
          error: 'Corrupted or Invalid Cart Item',
          message: `Rental duration for "${item.product?.name}" (${diffDays} days) exceeds maximum allowable 30 days.`,
        });
      }

      // 3. Stock limit check
      if (item.quantity > item.product.totalStock) {
        return res.status(400).json({
          error: 'Stock Limit Exceeded',
          message: `Requested quantity for "${item.product.name}" (${item.quantity}) exceeds warehouse stock (${item.product.totalStock}).`,
        });
      }

      // 4. Verify availability for all items in a transaction-safe way
      const check = await checkProductAvailability(item.productId, item.startDate, item.endDate, item.quantity);
      if (!check.available) {
        return res.status(400).json({ 
          error: `Unavailable Product: ${item.product.name}`, 
          message: check.reason 
        });
      }
    }

    // Calculate totals
    let totalRentalCost = 0;
    let totalDeposit = 0;

    const orderItemsData = cartItems.map((item) => {
      // Calculate rental duration in days
      const diffTime = item.endDate.getTime() - item.startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Price calculation with daily/weekly rates
      let totalCost = 0;
      if (diffDays >= 7) {
        const weeks = Math.floor(diffDays / 7);
        const extraDays = diffDays % 7;
        totalCost = (weeks * item.product.weeklyRate) + (extraDays * item.product.dailyRate);
      } else {
        totalCost = diffDays * item.product.dailyRate;
      }

      const itemRentalCost = totalCost * item.quantity;
      const itemDeposit = item.product.depositAmount * item.quantity;

      totalRentalCost += itemRentalCost;
      totalDeposit += itemDeposit;

      return {
        productId: item.productId,
        quantity: item.quantity,
        startDate: item.startDate,
        endDate: item.endDate,
        dailyRate: item.product.dailyRate,
        weeklyRate: item.product.weeklyRate,
        depositAmount: item.product.depositAmount,
        totalCost: itemRentalCost,
      };
    });

    // Check if user is placing their first order
    const priorOrdersCount = await prisma.order.count({
      where: { userId },
    });
    const isFirstOrder = priorOrdersCount === 0;

    let discountAmount = 0;
    if (isFirstOrder) {
      discountAmount = totalRentalCost * 0.10;
    }

    const finalRentalCost = totalRentalCost - discountAmount;
    const totalTax = finalRentalCost * 0.18; // 18% GST/VAT
    const grandTotal = finalRentalCost + totalDeposit + totalTax;

    const orderNumber = generateOrderNumber();

    const formattedDetails = [
      deliveryDetails || '',
      `[Payment Method: ${normalizedPaymentMethod}]`,
      cleanUtr ? `[UTR: ${cleanUtr}]` : paymentId ? `[Ref/Txn: ${paymentId}]` : '',
    ].filter(Boolean).join(' - ');

    // Perform database writes in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 0. Enforce duplicate UTR uniqueness inside the write transaction
      if (cleanUtr) {
        const existingUtrOrder = await tx.order.findFirst({
          where: {
            utrNumber: cleanUtr,
            status: { not: 'CANCELLED' },
          },
        });

        if (existingUtrOrder) {
          const duplicateError: any = new Error('Duplicate UTR Number');
          duplicateError.code = 'DUPLICATE_UTR';
          throw duplicateError;
        }
      }

      // 1. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: initialOrderStatus,
          totalRentalCost: finalRentalCost,
          totalDeposit,
          totalTax,
          grandTotal,
          deliveryAddress,
          deliveryDetails: formattedDetails,
          paymentId: paymentId || (normalizedPaymentMethod === 'UPI_QR' ? (cleanUtr || 'UPI_QR_PENDING') : 'COD'),
          paymentMethod: normalizedPaymentMethod,
          paymentStatus: normalizedPaymentStatus,
          utrNumber: cleanUtr || null,
          paymentProofUrl: paymentProofUrl ? String(paymentProofUrl) : null,
          kycDocUrl: req.user!.kycDocUrl, // Snapshot the KYC doc link
        },
      });

      // 2. Create order items
      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          ...item,
          orderId: order.id,
        })),
      });

      // 3. Clear customer cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return order;
    });

    // Send WhatsApp notification
    const customerPhone = req.user!.phone;
    const waMsg = `Hello ${req.user!.name}, your CameraRent order #${orderNumber} for total ₹${grandTotal.toFixed(2)} ${isFirstOrder ? '(including a 10% first-time discount!) ' : ''}has been placed successfully! We will coordinate the verification shortly. Thank you!`;
    if (customerPhone) {
      await sendWhatsAppMessage(customerPhone, waMsg);
    } else {
      console.log(`[WhatsApp API Automated Send] To N/A: "${waMsg}" (Customer has no phone number)`);
    }

    // Send notifications
    await createNotification(userId, 'Order Placed Successfully', `Your order #${orderNumber} has been placed successfully and is pending verification.`, 'ORDER_PLACED');
    await notifyAdmins('New Order Placed', `Order #${orderNumber} was placed by user ${req.user!.name || req.user!.email}.`, 'ORDER_PLACED');

    res.status(201).json({
      message: 'Order placed successfully',
      order: result,
      whatsappSimulated: !customerPhone,
    });
  } catch (error: any) {
    if (error?.code === 'DUPLICATE_UTR' || error?.message === 'Duplicate UTR Number') {
      return res.status(400).json({
        error: 'Duplicate UTR Number',
        message: 'This UTR number has already been submitted for another order. Please provide a unique bank transaction reference.',
      });
    }
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed due to server error' });
  }
});

// 2. Retrieve Orders List
router.get('/', async (req: Request, res: Response) => {
  const { role, id: userId, vendorProfile } = req.user!;

  try {
    let orders;

    if (role === 'ADMIN') {
      orders = await prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'VENDOR') {
      if (!vendorProfile) {
        return res.status(403).json({ error: 'Active vendor profile is required' });
      }
      
      // Get orders that contain at least one product belonging to this vendor
      orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { vendorId: vendorProfile.id },
            },
          },
        },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: { 
            where: { product: { vendorId: vendorProfile.id } }, // Filter down items visible to vendor
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // CUSTOMER
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: { include: { product: true } },
          cancellation: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// 3. Admin dashboard KPIs
router.get('/admin/dashboard', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const totalOrdersCount = await prisma.order.count();
    
    const pendingApprovalsCount = await prisma.order.count({
      where: { status: 'PLACED' },
    });

    const activeRentalsCount = await prisma.order.count({
      where: { status: 'ACTIVE' },
    });

    // Check overdue returns: active orders where the maximum endDate is in the past
    // For simplicity, we can search orders with status = ACTIVE that have an order item with endDate < now
    const now = new Date();
    const overdueRentals = await prisma.order.findMany({
      where: {
        status: 'ACTIVE',
        items: {
          some: {
            endDate: { lt: now },
          },
        },
      },
      include: {
        user: { select: { name: true } },
      },
    });

    const pendingCancellationsCount = await prisma.cancellationRequest.count({
      where: { status: 'PENDING' },
    });

    const completedOrders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { totalRentalCost: true },
    });
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalRentalCost, 0);

    // Group sales data by date for chart (last 7 completed orders or summary)
    const salesSummary = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        totalRentalCost: true,
        orderNumber: true,
        status: true,
      },
    });

    res.json({
      stats: {
        totalOrdersCount,
        pendingApprovalsCount,
        activeRentalsCount,
        overdueReturnsCount: overdueRentals.length,
        pendingCancellationsCount,
        totalRevenue,
      },
      overdueRentals,
      recentSales: salesSummary,
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 4. Retrieve Single Order Detail
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, id: userId, vendorProfile } = req.user!;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        cancellation: true,
        items: {
          include: {
            product: {
              include: { vendor: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access check
    if (role === 'CUSTOMER' && order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (role === 'VENDOR') {
      // Vendor can only view if order contains their product
      const hasVendorItem = order.items.some((item) => item.product.vendorId === vendorProfile?.id);
      if (!hasVendorItem) {
        return res.status(403).json({ error: 'Access denied. Order does not contain your products.' });
      }
      
      // Filter out other vendors' items from details for privacy
      order.items = order.items.filter((item) => item.product.vendorId === vendorProfile?.id);
    }

    res.json(order);
  } catch (error) {
    console.error('Fetch order detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

// 5. Update Order Status (ADMIN/VENDOR approval and flow)
router.put('/:id/status', requireRole(['ADMIN', 'VENDOR']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // PLACED, APPROVED, DISPATCHED, ACTIVE, RETURNED, COMPLETED, CANCELLED

  const validStatuses = ['PLACED', 'APPROVED', 'DISPATCHED', 'ACTIVE', 'RETURNED', 'COMPLETED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Vendor verification: can only advance status if it's their gear
    if (req.user!.role === 'VENDOR') {
      const ownsAllGear = order.items.every((item) => item.product.vendorId === req.user!.vendorProfile?.id);
      if (!ownsAllGear) {
        return res.status(403).json({ error: 'Forbidden. You do not own all products in this order. Super Admin must update.' });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Retrieve customer user details for automated WhatsApp dispatch
    const customer = await prisma.user.findUnique({
      where: { id: order.userId }
    });
    if (customer) {
      const itemsList = order.items?.map((item: any) => `• ${item.product?.name || 'Equipment'} (Qty: ${item.quantity})`).join('\n') || '• Equipment Package (Qty: 1)';
      const waMsg = `Hello ${customer.name}, your CameraRent booking #${order.orderNumber} has been updated to status: ${status}.\n\nItems:\n${itemsList}\n\nRefundable deposit holds will be updated on handback. Thank you!`;
      if (customer.phone) {
        await sendWhatsAppMessage(customer.phone, waMsg);
      } else {
        console.log(`[WhatsApp API Automated Send] To N/A: "${waMsg}" (Customer has no phone number)`);
      }
    }

    await createNotification(order.userId, 'Order Status Updated', `Your order #${order.orderNumber} status is updated to ${status}.`, 'ORDER_STATUS');
    await notifyAdmins('Order Status Changed', `Order #${order.orderNumber} status was changed to ${status}.`, 'ORDER_STATUS');

    res.json({
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 5b. Update Order Payment Status (ADMIN only: PAID / FAILED)
router.patch('/:id/payment', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body; // PAID, FAILED, PENDING, VERIFICATION

  const validPaymentStatuses = ['PAID', 'FAILED', 'PENDING', 'VERIFICATION'];
  if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({
      error: 'Invalid or missing paymentStatus (must be one of: PAID, FAILED, PENDING, VERIFICATION)',
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent cancelled orders from being marked as PAID
    if (order.status === 'CANCELLED' && paymentStatus === 'PAID') {
      return res.status(400).json({
        error: 'Cannot mark cancelled order as PAID',
        message: 'This order has already been cancelled. Cancelled orders cannot be updated to PAID status.',
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });

    await createNotification(
      order.userId,
      `Payment ${paymentStatus === 'PAID' ? 'Confirmed' : 'Status Updated'}`,
      `Payment status for your order #${order.orderNumber} is now ${paymentStatus}.`,
      'ORDER_STATUS'
    );
    await notifyAdmins(
      'Order Payment Updated',
      `Order #${order.orderNumber} payment status changed to ${paymentStatus}.`,
      'ORDER_STATUS'
    );

    res.json({
      message: `Order payment status updated to ${paymentStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update order payment status' });
  }
});

// 6. Request Cancellation (Customer)
router.post('/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user!.id;

  if (!reason) {
    return res.status(400).json({ error: 'Reason for cancellation is required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cancellation rule: cancellation request can only be submitted within 12 hours of order confirmation/creation
    const orderCreatedAt = new Date(order.createdAt).getTime();
    const elapsedHours = (Date.now() - orderCreatedAt) / (1000 * 60 * 60);

    if (elapsedHours > 12) {
      return res.status(400).json({
        error: 'Cancellation Window Expired',
        message: 'Cancellation requests are only allowed within 12 hours of order confirmation. The 12-hour cancellation window for this order has expired.',
      });
    }

    // Cancellation rule: cannot cancel if order is already dispatched/active/returned/completed
    const disallowedCancelStates = ['DISPATCHED', 'ACTIVE', 'RETURNED', 'COMPLETED', 'CANCELLED'];
    if (disallowedCancelStates.includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cancellation Denied', 
        message: `Cannot request cancellation because the order is currently ${order.status.toLowerCase()}.` 
      });
    }

    // Check if cancellation already requested
    const existing = await prisma.cancellationRequest.findUnique({
      where: { orderId: id },
    });

    if (existing) {
      return res.status(400).json({ error: 'A cancellation request is already pending review for this order' });
    }

    const request = await prisma.cancellationRequest.create({
      data: {
        orderId: id,
        reason,
        status: 'PENDING',
      },
    });

    await createNotification(order.userId, 'Cancellation Requested', `Cancellation request submitted for order #${order.orderNumber}.`, 'CANCELLATION');
    await notifyAdmins('New Cancellation Request', `Cancellation request submitted for order #${order.orderNumber}.`, 'CANCELLATION');

    res.status(201).json({
      message: 'Cancellation requested. Awaiting administrative review.',
      request,
    });
  } catch (error) {
    console.error('Request cancellation error:', error);
    res.status(500).json({ error: 'Failed to request cancellation' });
  }
});

// 7. Get Pending Cancellations (Admin)
router.get('/admin/cancellations', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const requests = await prisma.cancellationRequest.findMany({
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('Fetch cancellation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch cancellation requests' });
  }
});

// 8. Resolve Cancellation Request (Admin)
router.put('/admin/cancellations/:requestId', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { action } = req.body; // "APPROVE" or "REJECT"

  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
  }

  try {
    const request = await prisma.cancellationRequest.findUnique({
      where: { id: requestId },
      include: { order: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Cancellation request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request has already been resolved' });
    }

    const statusValue = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.cancellationRequest.update({
        where: { id: requestId },
        data: {
          status: statusValue,
          resolvedByUserId: req.user!.id,
          resolvedAt: new Date(),
        },
      });

      // If approved, update order status to CANCELLED
      if (action === 'APPROVE') {
        await tx.order.update({
          where: { id: request.orderId },
          data: { status: 'CANCELLED' },
        });
      }

      return updatedRequest;
    });

    const customer = await prisma.user.findUnique({
      where: { id: request.order.userId }
    });
    if (customer) {
      const waMsg = `Hello ${customer.name}, your cancellation request for order #${request.order.orderNumber} has been ${statusValue.toLowerCase()}. Thank you!`;
      if (customer.phone) {
        await sendWhatsAppMessage(customer.phone, waMsg);
      } else {
        console.log(`[WhatsApp API Automated Send] To N/A: "${waMsg}" (Customer has no phone number)`);
      }
    }

    await createNotification(request.order.userId, 'Cancellation Resolved', `Your cancellation request for order #${request.order.orderNumber} has been ${statusValue.toLowerCase()}.`, 'CANCELLATION');
    await notifyAdmins('Cancellation Resolved', `Cancellation request for order #${request.order.orderNumber} resolved as ${statusValue.toLowerCase()}.`, 'CANCELLATION');

    res.json({
      message: `Cancellation request successfully ${action.toLowerCase()}d`,
      request: result,
    });
  } catch (error) {
    console.error('Resolve cancellation error:', error);
    res.status(500).json({ error: 'Failed to resolve cancellation request' });
  }
});

// 10. Trigger First-Time Discount WhatsApp Inquiry
router.post('/first-discount-inquiry', async (req: Request, res: Response) => {
  const customerPhone = req.user!.phone;
  const waMsg = `Hello camerarent, I’m renting for the first time. How can I avail the 10% off?`;
  
  if (customerPhone) {
    try {
      const result = await sendWhatsAppMessage(customerPhone, waMsg);
      return res.json({ success: true, message: 'Message sent successfully', result });
    } catch (err: any) {
      return res.status(550).json({ error: err.message || 'Failed to send WhatsApp message' });
    }
  } else {
    console.log(`[WhatsApp API Simulated Send] To N/A: "${waMsg}"`);
    return res.json({ success: true, message: 'Message simulated (User has no phone number)' });
  }
});

export default router;
