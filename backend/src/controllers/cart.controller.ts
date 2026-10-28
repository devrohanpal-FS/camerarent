import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProductAvailability } from '../services/availability.service';
import {
  addToCartSchema,
  updateCartSchema,
  validateRentalDates,
} from '../utils/cart-validator';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const itemsWithAvailability = await Promise.all(
      items.map(async (item) => {
        const check = await checkProductAvailability(item.productId, item.startDate, item.endDate, item.quantity);
        
        const diffTime = Math.max(0, item.endDate.getTime() - item.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        let totalCost = 0;
        
        if (diffDays >= 7) {
          const weeks = Math.floor(diffDays / 7);
          const extraDays = diffDays % 7;
          totalCost = (weeks * item.product.weeklyRate) + (extraDays * item.product.dailyRate);
        } else {
          totalCost = diffDays * item.product.dailyRate;
        }

        const depositCost = item.product.depositAmount * item.quantity;
        const rentalCost = totalCost * item.quantity;

        return {
          ...item,
          rentalDays: diffDays,
          rentalCost,
          depositCost,
          totalItemCost: rentalCost + depositCost,
          isAvailable: check.available,
          availabilityReason: check.available ? undefined : check.reason,
        };
      })
    );

    res.json(itemsWithAvailability);
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const parseResult = addToCartSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return res.status(400).json({
      error: firstIssue?.message || 'Invalid cart payload',
      field: firstIssue?.path?.join('.'),
    });
  }

  const { productId, startDate, endDate, quantity } = parseResult.data;

  const dateCheck = validateRentalDates(startDate, endDate);
  if (!dateCheck.valid || !dateCheck.startDate || !dateCheck.endDate) {
    return res.status(400).json({ error: dateCheck.error || 'Invalid rental dates' });
  }

  const start = dateCheck.startDate;
  const end = dateCheck.endDate;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.totalStock <= 0) {
      return res.status(400).json({ error: 'Product is currently out of stock' });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        startDate: start,
        endDate: end,
      },
    });

    const combinedQty = existingItem ? existingItem.quantity + quantity : quantity;

    if (combinedQty > 10) {
      return res.status(400).json({
        error: 'Quantity Limit Exceeded',
        message: existingItem
          ? `Adding ${quantity} units would bring your cart total to ${combinedQty}, which exceeds the maximum allowable limit of 10 units per item.`
          : 'Quantity cannot exceed 10 units per item.',
      });
    }

    if (combinedQty > product.totalStock) {
      return res.status(400).json({
        error: 'Stock Limit Exceeded',
        message: `Requested quantity (${combinedQty}) exceeds total available warehouse stock (${product.totalStock}).`,
      });
    }

    const check = await checkProductAvailability(productId, start, end, combinedQty);
    if (!check.available) {
      return res.status(400).json({ error: check.reason });
    }

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: combinedQty },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          startDate: start,
          endDate: end,
          quantity,
        },
      });
    }

    res.status(201).json({ message: 'Added to cart successfully', cartItem });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const parseResult = updateCartSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return res.status(400).json({
      error: firstIssue?.message || 'Invalid cart update payload',
      field: firstIssue?.path?.join('.'),
    });
  }

  const { startDate, endDate, quantity } = parseResult.data;

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!cartItem || cartItem.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const startInput = startDate || cartItem.startDate;
    const endInput = endDate || cartItem.endDate;

    const dateCheck = validateRentalDates(startInput, endInput);
    if (!dateCheck.valid || !dateCheck.startDate || !dateCheck.endDate) {
      return res.status(400).json({ error: dateCheck.error || 'Invalid rental dates' });
    }

    const start = dateCheck.startDate;
    const end = dateCheck.endDate;
    const qty = quantity !== undefined ? quantity : cartItem.quantity;

    if (qty > cartItem.product.totalStock) {
      return res.status(400).json({
        error: 'Stock Limit Exceeded',
        message: `Quantity (${qty}) exceeds available warehouse stock (${cartItem.product.totalStock}).`,
      });
    }

    const check = await checkProductAvailability(cartItem.productId, start, end, qty);
    if (!check.available) {
      return res.status(400).json({ error: check.reason });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: {
        startDate: start,
        endDate: end,
        quantity: qty,
      },
    });

    res.json({ message: 'Cart item updated successfully', cartItem: updated });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });

    if (!cartItem || cartItem.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id } });
    res.json({ message: 'Cart item removed successfully' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    await prisma.cartItem.deleteMany({ where: { userId } });
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
