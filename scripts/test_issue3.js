const http = require('http');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

const TARGET_HOST = process.env.TEST_HOST || 'localhost';
const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;

if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD) {
  throw new Error(
    'Missing required test credentials in environment.\n' +
    'Please export TEST_CUSTOMER_EMAIL and TEST_CUSTOMER_PASSWORD.'
  );
}

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
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
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

async function run() {
  console.log('================================================================');
  console.log('🛡️ CART QUANTITY & DATE VALIDATION VERIFICATION (ISSUE #3)');
  console.log('================================================================\n');

  let allPassed = true;

  const loginRes = await post('/api/auth/login', {
    email: CUSTOMER_EMAIL,
    password: CUSTOMER_PASSWORD
  });
  if (loginRes.status !== 200) throw new Error('Customer login failed');
  const token = loginRes.body.token;

  await prisma.cartItem.deleteMany({ where: { user: { email: CUSTOMER_EMAIL } } });

  const prods = await get('/api/products', token);
  const product = prods.body.find(p => p.totalStock >= 12) || prods.body[0];
  console.log(`Using product: "${product.name}" (Stock: ${product.totalStock})\n`);

  const validStart = new Date();
  validStart.setDate(validStart.getDate() + 40);
  const validEnd = new Date(validStart);
  validEnd.setDate(validStart.getDate() + 2);

  console.log('--- Test 1: Invalid Quantity Values (Must all be 400) ---');
  const badQuantities = [
    { val: -3, label: 'Negative integer (-3)' },
    { val: 0, label: 'Zero (0)' },
    { val: 1.5, label: 'Fraction (1.5)' },
    { val: 'abc', label: 'Alphabetic string ("abc")' },
    { val: '2abc', label: 'Alphanumeric string ("2abc")' },
    { val: '1e1', label: 'Exponential string ("1e1")' },
    { val: '0x10', label: 'Hexadecimal string ("0x10")' },
    { val: ' 2 ', label: 'String with whitespace (" 2 ")' },
    { val: '', label: 'Empty string ("")' },
    { val: null, label: 'Null' },
    { val: true, label: 'Boolean true' },
    { val: false, label: 'Boolean false' },
    { val: [], label: 'Array ([])' },
    { val: {}, label: 'Object ({})' },
    { val: 'NaN', label: 'String "NaN"' },
    { val: 'Infinity', label: 'String "Infinity"' },
    { val: 11, label: 'Exceeding limit of 10 (11)' }
  ];

  for (const tc of badQuantities) {
    const res = await post('/api/cart', {
      productId: product.id,
      startDate: validStart.toISOString(),
      endDate: validEnd.toISOString(),
      quantity: tc.val
    }, token);

    if (res.status === 400) {
      console.log(`  ✅ PASS: [${tc.label}] rejected with 400 Bad Request`);
    } else {
      console.error(`  🚨 FAIL: [${tc.label}] returned unexpected status ${res.status}!`);
      allPassed = false;
    }
  }

  console.log('\n--- Test 2: Valid Quantity (2) ---');
  const validRes = await post('/api/cart', {
    productId: product.id,
    startDate: validStart.toISOString(),
    endDate: validEnd.toISOString(),
    quantity: 2
  }, token);

  console.log('Status:', validRes.status, '| Stored Quantity:', validRes.body?.cartItem?.quantity);
  if (validRes.status === 201 && validRes.body?.cartItem?.quantity === 2) {
    console.log('✅ PASS: Valid quantity 2 accepted and stored correctly!');
  } else {
    console.error('🚨 FAIL: Valid quantity 2 was rejected or stored incorrectly!');
    allPassed = false;
  }

  console.log('\n--- Test 3: Cart Quantity Merge & 10 Cap Limit ---');
  await prisma.cartItem.deleteMany({ where: { user: { email: CUSTOMER_EMAIL } } });

  const add6 = await post('/api/cart', {
    productId: product.id,
    startDate: validStart.toISOString(),
    endDate: validEnd.toISOString(),
    quantity: 6
  }, token);
  console.log('Add 6 units -> Status:', add6.status);

  const add5 = await post('/api/cart', {
    productId: product.id,
    startDate: validStart.toISOString(),
    endDate: validEnd.toISOString(),
    quantity: 5
  }, token);
  console.log('Add 5 more units (total 11 > 10) -> Status:', add5.status, '| Error:', add5.body?.error);
  if (add5.status === 400 && add5.body?.error === 'Quantity Limit Exceeded') {
    console.log('✅ PASS: Exceeding 10 units via merge strictly rejected with 400!');
  } else {
    console.error('🚨 FAIL: Merge exceeding 10 units was not rejected properly!');
    allPassed = false;
  }

  console.log('\n--- Test 4: Date Validation Checks ---');
  const endBeforeStartRes = await post('/api/cart', {
    productId: product.id,
    startDate: validEnd.toISOString(),
    endDate: validStart.toISOString(),
    quantity: 1
  }, token);
  console.log('4a. End < Start -> Status:', endBeforeStartRes.status, '| Error:', endBeforeStartRes.body?.error);
  if (endBeforeStartRes.status === 400) {
    console.log('  ✅ PASS: End before start rejected with 400');
  } else {
    console.error('  🚨 FAIL: End before start was not rejected!');
    allPassed = false;
  }

  const pastRes = await post('/api/cart', {
    productId: product.id,
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: '2020-01-05T00:00:00.000Z',
    quantity: 1
  }, token);
  console.log('4b. Past date -> Status:', pastRes.status, '| Error:', pastRes.body?.error);
  if (pastRes.status === 400 && pastRes.body?.error?.includes('past')) {
    console.log('  ✅ PASS: Past start date rejected with 400');
  } else {
    console.error('  🚨 FAIL: Past start date was not rejected!');
    allPassed = false;
  }

  const longStart = new Date(validStart);
  const longEnd = new Date(validStart);
  longEnd.setDate(longStart.getDate() + 35);
  const longRes = await post('/api/cart', {
    productId: product.id,
    startDate: longStart.toISOString(),
    endDate: longEnd.toISOString(),
    quantity: 1
  }, token);
  console.log('4c. Duration > 30 days -> Status:', longRes.status, '| Error:', longRes.body?.error);
  if (longRes.status === 400 && longRes.body?.error?.includes('30 days')) {
    console.log('  ✅ PASS: Duration > 30 days rejected with 400');
  } else {
    console.error('  🚨 FAIL: Duration > 30 days was not rejected!');
    allPassed = false;
  }

  console.log('\n--- Test 5: Checkout Defense Against Bad Cart Invariants ---');
  await prisma.cartItem.deleteMany({ where: { user: { email: CUSTOMER_EMAIL } } });

  const user = await prisma.user.findUnique({ where: { email: CUSTOMER_EMAIL } });
  await prisma.cartItem.create({
    data: {
      userId: user.id,
      productId: product.id,
      startDate: validStart,
      endDate: validEnd,
      quantity: -5
    }
  });

  const badCheckoutRes = await post('/api/orders/checkout', {
    deliveryAddress: '74 Gautam Nagar, New Delhi',
    paymentMethod: 'COD'
  }, token);

  console.log('Corrupted cart checkout HTTP Status:', badCheckoutRes.status);
  console.log('Corrupted cart error message:', badCheckoutRes.body?.error);
  if (badCheckoutRes.status === 400 && badCheckoutRes.body?.error === 'Corrupted or Invalid Cart Item') {
    console.log('✅ PASS: Checkout strictly rejected corrupted/negative cart item with 400 Bad Request!');
  } else {
    console.error('🚨 FAIL: Checkout allowed corrupted cart item!');
    allPassed = false;
  }

  await prisma.cartItem.deleteMany({ where: { user: { email: CUSTOMER_EMAIL } } });
  await prisma.$disconnect();

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL CART & QUANTITY VALIDATION TESTS PASSED (100%)');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('================================================================');
}

run().catch(async (err) => {
  console.error('Test execution failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
