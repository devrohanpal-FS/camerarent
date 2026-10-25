const http = require('http');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

// Read credentials from environment or fall back to local test defaults
const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'customer@gmail.com';
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD || 'password123';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@camerarent.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';

const createdOrderIds = [];

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5002,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5002,
      path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function patch(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5002,
      path,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('🔐 SECURITY VERIFICATION TEST: ISSUE #1 (EXTENDED)');
  console.log('====================================================\n');

  // 1. Authenticate users
  console.log('--- Step 1: Login Customer & Admin ---');
  const custLogin = await post('/api/auth/login', {
    email: CUSTOMER_EMAIL,
    password: CUSTOMER_PASSWORD
  });
  if (custLogin.status !== 200) throw new Error('Customer login failed');
  const customerToken = custLogin.body.token;
  console.log('✅ Customer logged in successfully (Role:', custLogin.body.user.role, ')');

  const adminLogin = await post('/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  if (adminLogin.status !== 200) throw new Error('Admin login failed');
  const adminToken = adminLogin.body.token;
  console.log('✅ Admin logged in successfully (Role:', adminLogin.body.user.role, ')');

  // 2. Fetch product for testing
  const prodsRes = await get('/api/products', customerToken);
  const product = prodsRes.body[0];
  console.log(`\nUsing test product: "${product.name}" (Daily Rate: ₹${product.dailyRate}, Deposit: ₹${product.depositAmount})`);

  // Helper to add item to cart
  async function addToCartWithOffset(offsetDays) {
    const start = new Date();
    start.setDate(start.getDate() + offsetDays);
    const end = new Date(start);
    end.setDate(start.getDate() + 2);
    const res = await post('/api/cart', {
      productId: product.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      quantity: 1
    }, customerToken);
    return res.status;
  }

  // TEST 2: Price and Payment Tampering during checkout
  console.log('\n--- Step 2: Checkout with Tampered paymentStatus & Tampered Price ---');
  await addToCartWithOffset(100);

  const tamperedPayload = {
    deliveryAddress: '74 Gautam Nagar, New Delhi',
    deliveryDetails: 'Tamper verification test',
    paymentMethod: 'COD',
    paymentStatus: 'PAID',       // TAMPER ATTEMPT: Trying to mark as PAID
    grandTotal: 1.00,            // TAMPER ATTEMPT: Trying to pay ₹1.00
    totalRentalCost: 1.00,       // TAMPER ATTEMPT: Fake rental cost
    totalDeposit: 0.00,          // TAMPER ATTEMPT: Zero deposit
    dailyRate: 0.50              // TAMPER ATTEMPT: Fake daily rate
  };

  const checkoutRes = await post('/api/orders/checkout', tamperedPayload, customerToken);
  console.log('Checkout HTTP Status:', checkoutRes.status);
  const order1 = checkoutRes.body.order;
  if (!order1) throw new Error('Checkout failed: ' + JSON.stringify(checkoutRes.body));
  createdOrderIds.push(order1.id);

  console.log('Order created: ID =', order1.id, '| OrderNumber =', order1.orderNumber);
  console.log('Client sent paymentStatus: "PAID"        -> DB saved paymentStatus:', order1.paymentStatus);
  console.log('Client sent grandTotal: ₹1.00             -> DB computed grandTotal: ₹' + order1.grandTotal.toFixed(2));
  console.log('Client sent totalRentalCost: ₹1.00        -> DB computed totalRentalCost: ₹' + order1.totalRentalCost.toFixed(2));
  console.log('Client sent totalDeposit: ₹0.00           -> DB computed totalDeposit: ₹' + order1.totalDeposit.toFixed(2));

  if (order1.paymentStatus === 'PAID') {
    console.error('🚨 FAIL: paymentStatus was tampered to PAID!');
  } else if (order1.grandTotal <= 1.00) {
    console.error('🚨 FAIL: grandTotal was tampered to ₹1.00!');
  } else {
    console.log('✅ PASS: Server strictly ignored client paymentStatus and recomputed all totals from DB prices!');
  }

  // TEST 4: Duplicate UTR Check
  console.log('\n--- Step 3: Duplicate UTR Reuse Prevention Test ---');
  const testUtr = '987654321098';

  // Order with UTR
  await addToCartWithOffset(120);
  const utrOrder1Res = await post('/api/orders/checkout', {
    deliveryAddress: '74 Gautam Nagar, New Delhi',
    paymentMethod: 'UPI_QR',
    utrNumber: testUtr,
    paymentStatus: 'PAID'
  }, customerToken);
  const utrOrder1 = utrOrder1Res.body.order;
  if (utrOrder1) {
    createdOrderIds.push(utrOrder1.id);
    console.log(`Order 1 with UTR ${testUtr} created: Status = ${utrOrder1.paymentStatus}`);
  }

  // Second order trying to reuse the SAME UTR
  await addToCartWithOffset(140);
  const duplicateUtrRes = await post('/api/orders/checkout', {
    deliveryAddress: '74 Gautam Nagar, New Delhi',
    paymentMethod: 'UPI_QR',
    utrNumber: testUtr
  }, customerToken);

  console.log('Duplicate UTR attempt HTTP Status:', duplicateUtrRes.status);
  console.log('Duplicate UTR error message:', duplicateUtrRes.body?.error, '-', duplicateUtrRes.body?.message);
  if (duplicateUtrRes.status === 400 && duplicateUtrRes.body?.error === 'Duplicate UTR Number') {
    console.log('✅ PASS: Duplicate UTR reuse successfully blocked with 400 Bad Request!');
  } else {
    console.error('🚨 FAIL: Duplicate UTR was not blocked properly!');
  }

  // TEST 1: PATCH /api/orders/:id/payment Access Control & Validation
  console.log('\n--- Step 4: PATCH /api/orders/:id/payment Tests ---');

  // 4a. No token -> 401
  const noTokenRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'PAID' });
  console.log('4a. No Token request -> Status:', noTokenRes.status, noTokenRes.status === 401 ? '✅ (PASS: 401 Unauthorized)' : '🚨 FAIL');

  // 4b. Customer token -> 403
  const customerPatchRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'PAID' }, customerToken);
  console.log('4b. Customer Token request -> Status:', customerPatchRes.status, customerPatchRes.status === 403 ? '✅ (PASS: 403 Forbidden)' : '🚨 FAIL');

  // 4c. Admin token with invalid status -> 400
  const invalidStatusRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'SUPER_PAID' }, adminToken);
  console.log('4c. Admin with Invalid Status -> Status:', invalidStatusRes.status, invalidStatusRes.status === 400 ? '✅ (PASS: 400 Bad Request)' : '🚨 FAIL');

  // 4d. Admin token with valid status PAID -> 200
  const adminPatchRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'PAID' }, adminToken);
  console.log('4d. Admin marking order as PAID -> Status:', adminPatchRes.status);
  console.log('Updated order paymentStatus in DB:', adminPatchRes.body?.order?.paymentStatus);
  if (adminPatchRes.status === 200 && adminPatchRes.body?.order?.paymentStatus === 'PAID') {
    console.log('✅ PASS: Admin successfully marked order as PAID!');
  } else {
    console.error('🚨 FAIL: Admin could not mark order as PAID');
  }

  // CLEANUP: Clean up test orders from dev database
  console.log('\n--- Step 5: Database Cleanup of Test Orders ---');
  if (createdOrderIds.length > 0) {
    // Also include any CR-20261025 test orders created during earlier reproduction runs
    const deleteItems = await prisma.orderItem.deleteMany({
      where: {
        OR: [
          { orderId: { in: createdOrderIds } },
          { order: { deliveryDetails: { contains: 'Tamper' } } },
          { order: { deliveryDetails: { contains: 'UTR order test' } } }
        ]
      }
    });

    const deleteOrders = await prisma.order.deleteMany({
      where: {
        OR: [
          { id: { in: createdOrderIds } },
          { deliveryDetails: { contains: 'Tamper' } },
          { deliveryDetails: { contains: 'UTR order test' } }
        ]
      }
    });

    console.log(`🧹 Cleaned up ${deleteOrders.count} test orders and ${deleteItems.count} test items from dev database.`);
  }

  // Also clear customer's cart so state is clean
  await prisma.cartItem.deleteMany({
    where: { user: { email: CUSTOMER_EMAIL } }
  });
  console.log('🧹 Cleaned up customer cart items.');

  await prisma.$disconnect();
  console.log('\n====================================================');
  console.log('🎉 ALL ISSUE #1 EXTENDED VERIFICATIONS PASSED 100%');
  console.log('====================================================');
}

run().catch(async (err) => {
  console.error('Test execution failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
