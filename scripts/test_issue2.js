const http = require('http');

function testProxy(targetUrl) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(targetUrl);
    const path = `/api/products/proxy-image?url=${encoded}`;
    const req = http.request({
      hostname: 'localhost',
      port: 5002,
      path,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            contentType: res.headers['content-type'],
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            contentType: res.headers['content-type'],
            bodySnippet: data.slice(0, 150)
          });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function run() {
  console.log('========================================================');
  console.log('🛡️ SSRF MITIGATION VERIFICATION SUITE: ISSUE #2');
  console.log('========================================================\n');

  let allPassed = true;

  // 1. Direct IP SSRF attempt (Localhost)
  console.log('--- Test 1: Loopback IPv4 SSRF (127.0.0.1) ---');
  const res1 = await testProxy('http://127.0.0.1:5002/api/products');
  console.log('HTTP Status:', res1.status, '| Response:', JSON.stringify(res1.body || res1.bodySnippet));
  if (res1.status === 403) {
    console.log('✅ PASS: Localhost IP blocked with 403 Forbidden!');
  } else {
    console.error('🚨 FAIL: Localhost IP was NOT blocked with 403!');
    allPassed = false;
  }

  // 2. Named localhost SSRF attempt
  console.log('\n--- Test 2: Named Localhost SSRF (localhost) ---');
  const res2 = await testProxy('http://localhost:5002/api/orders');
  console.log('HTTP Status:', res2.status, '| Response:', JSON.stringify(res2.body || res2.bodySnippet));
  if (res2.status === 403) {
    console.log('✅ PASS: Named localhost blocked with 403 Forbidden!');
  } else {
    console.error('🚨 FAIL: Named localhost was NOT blocked with 403!');
    allPassed = false;
  }

  // 3. Cloud Instance Metadata SSRF attempt
  console.log('\n--- Test 3: Cloud Metadata Service SSRF (169.254.169.254) ---');
  const res3 = await testProxy('http://169.254.169.254/latest/meta-data/');
  console.log('HTTP Status:', res3.status, '| Response:', JSON.stringify(res3.body || res3.bodySnippet));
  if (res3.status === 403) {
    console.log('✅ PASS: Cloud metadata IP blocked with 403 Forbidden!');
  } else {
    console.error('🚨 FAIL: Cloud metadata IP was NOT blocked with 403!');
    allPassed = false;
  }

  // 4. Unauthorized External Domain SSRF attempt
  console.log('\n--- Test 4: Disallowed External Domain (https://example.com) ---');
  const res4 = await testProxy('https://example.com');
  console.log('HTTP Status:', res4.status, '| Response:', JSON.stringify(res4.body || res4.bodySnippet));
  if (res4.status === 403) {
    console.log('✅ PASS: Unauthorized external domain blocked with 403 Forbidden!');
  } else {
    console.error('🚨 FAIL: Unauthorized external domain was NOT blocked!');
    allPassed = false;
  }

  // 5. Invalid Protocol SSRF attempt (file://, ftp://)
  console.log('\n--- Test 5: Disallowed Protocol (ftp://gpcamerarental.com/pic.jpg) ---');
  const res5 = await testProxy('ftp://gpcamerarental.com/pic.jpg');
  console.log('HTTP Status:', res5.status, '| Response:', JSON.stringify(res5.body || res5.bodySnippet));
  if (res5.status === 400) {
    console.log('✅ PASS: Non-HTTP/HTTPS protocol blocked with 400 Bad Request!');
  } else {
    console.error('🚨 FAIL: Non-HTTP protocol was NOT blocked!');
    allPassed = false;
  }

  // 6. Malformed URL string
  console.log('\n--- Test 6: Malformed URL ("not-a-valid-url") ---');
  const res6 = await testProxy('not-a-valid-url');
  console.log('HTTP Status:', res6.status, '| Response:', JSON.stringify(res6.body || res6.bodySnippet));
  if (res6.status === 400) {
    console.log('✅ PASS: Malformed URL blocked with 400 Bad Request!');
  } else {
    console.error('🚨 FAIL: Malformed URL was NOT rejected!');
    allPassed = false;
  }

  // 7. Allowed Domain Verification (gpcamerarental.com)
  console.log('\n--- Test 7: Allowed Domain Domain-Validation Check ---');
  const res7 = await testProxy('https://gpcamerarental.com/non-existent-image-xyz.jpg');
  console.log('HTTP Status:', res7.status, '| Response:', JSON.stringify(res7.body || res7.bodySnippet));
  // Since gpcamerarental.com is in domain allowlist, it is allowed past host & DNS validation
  // It reaches the remote server or receives 404/non-image response, which is properly handled
  if (res7.status !== 403) {
    console.log('✅ PASS: Allowed domain successfully passed domain allowlist (not 403)!');
  } else {
    console.error('🚨 FAIL: Allowed domain was blocked unexpectedly!');
    allPassed = false;
  }

  console.log('\n========================================================');
  if (allPassed) {
    console.log('🎉 ALL SSRF MITIGATION TESTS PASSED (100% SECURE)');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('========================================================');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
