const http = require('http');

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
  console.log('--- Step 1: Login as customer ---');
  const loginRes = await post('/api/auth/login', {
    email: 'customer@gmail.com',
    password: 'password123'
  });
  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log('Login successful. Customer role:', loginRes.body.user.role);

  console.log('\n--- Step 2: Fetch products ---');
  const prodsRes = await get('/api/products', token);
  const product = prodsRes.body[0];
  console.log('Found product:', product.name, '(', product.id, ')');

  console.log('\n--- Step 3: Add to cart ---');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 15);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 2);

  const cartRes = await post('/api/cart', {
    productId: product.id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    quantity: 1
  }, token);
  console.log('Cart add status:', cartRes.status);

  console.log('\n--- Step 4: Checkout with client-tampered paymentStatus: "PAID" ---');
  const checkoutRes = await post('/api/orders/checkout', {
    deliveryAddress: '123 Fake Street, Delhi',
    deliveryDetails: 'Tampered order test',
    paymentMethod: 'COD',
    paymentStatus: 'PAID' // TAMPERED ATTEMPT!
  }, token);

  console.log('Checkout response status:', checkoutRes.status);
  const createdOrder = checkoutRes.body.order;
  if (createdOrder) {
    console.log('Created order ID:', createdOrder.id);
    console.log('Created order Number:', createdOrder.orderNumber);
    console.log('Created order paymentStatus in DB:', createdOrder.paymentStatus);
    
    if (createdOrder.paymentStatus === 'PAID') {
      console.log('🚨 VULNERABILITY CONFIRMED: Client forced paymentStatus to "PAID" during checkout!');
    } else {
      console.log('✅ SECURE: Server ignored client paymentStatus, saved as:', createdOrder.paymentStatus);
    }

    console.log('\n--- Step 4b: Checkout with valid UTR (12 digits) for UPI_QR ---');
    // Add another item to cart with unique dates
    const utrStartDate = new Date();
    utrStartDate.setDate(utrStartDate.getDate() + 60);
    const utrEndDate = new Date(utrStartDate);
    utrEndDate.setDate(utrStartDate.getDate() + 2);

    await post('/api/cart', {
      productId: product.id,
      startDate: utrStartDate.toISOString(),
      endDate: utrEndDate.toISOString(),
      quantity: 1
    }, token);

    const utrCheckoutRes = await post('/api/orders/checkout', {
      deliveryAddress: '123 Fake Street, Delhi',
      deliveryDetails: 'UTR order test',
      paymentMethod: 'UPI_QR',
      utrNumber: '123456789012',
      paymentStatus: 'PAID' // Client still tries tampering
    }, token);
    const utrOrder = utrCheckoutRes.body.order;
    console.log('UTR Order paymentStatus in DB:', utrOrder.paymentStatus);
    if (utrOrder.paymentStatus === 'VERIFICATION') {
      console.log('✅ VERIFIED: Order with UTR assigned VERIFICATION (not PAID)!');
    } else {
      console.log('❌ Unexpected status:', utrOrder.paymentStatus);
    }

    console.log('\n--- Step 5: Test non-admin calling PATCH /api/orders/:id/payment ---');
    const patchRes = await patch(`/api/orders/${createdOrder.id}/payment`, {
      paymentStatus: 'PAID'
    }, token);
    console.log('Non-admin PATCH status:', patchRes.status, '(Expected 403 Forbidden)');
  } else {
    console.error('Checkout failed:', checkoutRes.body);
  }
}

run().catch(console.error);
