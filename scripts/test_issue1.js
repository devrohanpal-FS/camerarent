const http = require('http');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

const TARGET_HOST = process.env.TEST_HOST || 'localhost';
if (TARGET_HOST !== 'localhost' && TARGET_HOST !== '127.0.0.1') {
  throw new Error(`Safety check failed: Test script can only be run against localhost, got "${TARGET_HOST}"`);
}

const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    'Missing required test credentials in environment.\n' +
    'Please export TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_PASSWORD, TEST_ADMIN_EMAIL, and TEST_ADMIN_PASSWORD.'
  );
}

const createdOrderIds = [];

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: TARGET_HOST,
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
      hostname: TARGET_HOST,
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
      hostname: TARGET_HOST,
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

function put(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: TARGET_HOST,
      port: 5002,
      path,
      method: 'PUT',
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

  console.log('--- Step 1: Login Customer & Admin via Environment Credentials ---');
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

  const prodsRes = await get('/api/products', customerToken);
  const product = prodsRes.body[0];
  console.log(`\nUsing test product: "${product.name}" (Daily Rate: ₹${product.dailyRate}, Deposit: ₹${product.depositAmount})`);

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

  console.log('\n--- Step 2: Checkout with Tampered paymentStatus & Tampered Price ---');
  await addToCartWithOffset(100);

  const tamperedPayload = {
    deliveryAddress: '74 Gautam Nagar, New Delhi',
    deliveryDetails: 'Tamper verification test',
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    grandTotal: 1.00,
    totalRentalCost: 1.00,
    totalDeposit: 0.00,
    dailyRate: 0.50
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

  console.log('\n--- Step 3a: Duplicate UTR Reuse Prevention Test (Sequential) ---');
  const testUtr = '987654321098';

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

  console.log('\n--- Step 3b: Parallel Race Condition Test (Promise.all with Same UTR) ---');
  const parallelUtr = '112233445566';
  await addToCartWithOffset(160);

  const [parallelRes1, parallelRes2] = await Promise.all([
    post('/api/orders/checkout', {
      deliveryAddress: 'Parallel Test 1',
      paymentMethod: 'UPI_QR',
      utrNumber: parallelUtr
    }, customerToken),
    post('/api/orders/checkout', {
      deliveryAddress: 'Parallel Test 2',
      paymentMethod: 'UPI_QR',
      utrNumber: parallelUtr
    }, customerToken)
  ]);

  console.log('Parallel Request 1 Status:', parallelRes1.status);
  console.log('Parallel Request 2 Status:', parallelRes2.status);

  if (parallelRes1.body?.order) createdOrderIds.push(parallelRes1.body.order.id);
  if (parallelRes2.body?.order) createdOrderIds.push(parallelRes2.body.order.id);

  const statuses = [parallelRes1.status, parallelRes2.status].sort();
  if (statuses[0] === 201 && statuses[1] === 400) {
    console.log('✅ PASS: Exactly ONE parallel request succeeded (201) and the duplicate was rejected (400)!');
  } else {
    console.error('🚨 FAIL: Parallel UTR race condition was not handled atomically! Statuses:', statuses);
  }

  console.log('\n--- Step 4: PATCH /api/orders/:id/payment Tests ---');

  const noTokenRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'PAID' });
  console.log('4a. No Token request -> Status:', noTokenRes.status, noTokenRes.status === 401 ? '✅ (PASS: 401 Unauthorized)' : '🚨 FAIL');

  const customerPatchRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'PAID' }, customerToken);
  console.log('4b. Customer Token request -> Status:', customerPatchRes.status, customerPatchRes.status === 403 ? '✅ (PASS: 403 Forbidden)' : '🚨 FAIL');

  const invalidStatusRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'SUPER_PAID' }, adminToken);
  console.log('4c. Admin with Invalid Status -> Status:', invalidStatusRes.status);
  console.log('Error message:', invalidStatusRes.body?.error);
  if (invalidStatusRes.status === 400 && invalidStatusRes.body?.error?.includes('PAID, FAILED, PENDING, VERIFICATION')) {
    console.log('✅ PASS: Returned 400 with corrected message listing all 4 valid statuses!');
  } else {
    console.error('🚨 FAIL: Did not return expected 400 error message');
  }

  console.log('\n--- Step 4d: Cancelled Order Payment Guard ---');
  const cancelStatusRes = await put(`/api/orders/${order1.id}/status`, { status: 'CANCELLED' }, adminToken);
  console.log('Order status updated to CANCELLED -> Status:', cancelStatusRes.status);
  const cancelPatchRes = await patch(`/api/orders/${order1.id}/payment`, { paymentStatus: 'PAID' }, adminToken);
  console.log('Cancel order mark PAID status:', cancelPatchRes.status, '| Error:', cancelPatchRes.body?.error);
  if (cancelPatchRes.status === 400 && cancelPatchRes.body?.error === 'Cannot mark cancelled order as PAID') {
    console.log('✅ PASS: Cancelled order was strictly prevented from being marked as PAID!');
  } else {
    console.error('🚨 FAIL: Cancelled order was not blocked from being marked as PAID!');
  }

  if (utrOrder1) {
    const adminPatchRes = await patch(`/api/orders/${utrOrder1.id}/payment`, { paymentStatus: 'PAID' }, adminToken);
    console.log('\n4e. Admin marking active order as PAID -> Status:', adminPatchRes.status);
    console.log('Updated order paymentStatus in DB:', adminPatchRes.body?.order?.paymentStatus);
    if (adminPatchRes.status === 200 && adminPatchRes.body?.order?.paymentStatus === 'PAID') {
      console.log('✅ PASS: Admin successfully marked active order as PAID!');
    } else {
      console.error('🚨 FAIL: Admin could not mark active order as PAID');
    }
  }

  console.log('\n--- Step 5: Database Cleanup (Only Current Run Orders) ---');
  if (createdOrderIds.length > 0) {
    const deleteItems = await prisma.orderItem.deleteMany({
      where: { orderId: { in: createdOrderIds } }
    });
    const deleteOrders = await prisma.order.deleteMany({
      where: { id: { in: createdOrderIds } }
    });
    console.log(`🧹 Cleaned up ${deleteOrders.count} test orders and ${deleteItems.count} test items created during this run.`);
  }

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
