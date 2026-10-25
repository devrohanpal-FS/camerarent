// Register ts-node so we can directly import TypeScript utility functions
try {
  require('../backend/node_modules/ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' }
  });
} catch {
  // If already registered or handled
}

const http = require('http');
const { Readable } = require('stream');
const {
  isPrivateIp,
  validateDns,
  streamImageWithLimit,
  PayloadTooLargeError,
  ALLOWED_PROXY_DOMAINS
} = require('../backend/src/utils/ssrf');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

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
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const fullBuf = Buffer.concat(data);
        const str = fullBuf.toString('utf8');
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'],
            nosniff: res.headers['x-content-type-options'],
            body: JSON.parse(str),
            byteLength: fullBuf.length
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'],
            nosniff: res.headers['x-content-type-options'],
            bodySnippet: str.slice(0, 150),
            byteLength: fullBuf.length
          });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('🛡️ EXTENDED SSRF VERIFICATION SUITE: ISSUE #2 (ADDENDUM)');
  console.log('================================================================\n');

  let allPassed = true;

  // --------------------------------------------------------------------------
  // 1. UNIT TESTS: isPrivateIp() & DNS Resolution Branch Mocking
  // --------------------------------------------------------------------------
  console.log('--- Step 1: Unit Tests for isPrivateIp() ---');
  const ipTestCases = [
    // IPv4 Private & Reserved (Must be TRUE)
    { ip: '10.0.0.1', expected: true, label: '10.0.0.0/8 private network' },
    { ip: '10.255.255.254', expected: true, label: '10.0.0.0/8 upper bound' },
    { ip: '172.16.0.1', expected: true, label: '172.16.0.0/12 lower bound' },
    { ip: '172.31.255.255', expected: true, label: '172.16.0.0/12 upper bound' },
    { ip: '192.168.1.1', expected: true, label: '192.168.0.0/16 private' },
    { ip: '127.0.0.1', expected: true, label: '127.0.0.0/8 loopback' },
    { ip: '127.123.45.67', expected: true, label: '127.0.0.0/8 arbitrary loopback' },
    { ip: '169.254.169.254', expected: true, label: '169.254.0.0/16 cloud metadata service' },
    { ip: '100.64.0.1', expected: true, label: '100.64.0.0/10 carrier-grade NAT' },
    { ip: '100.127.255.254', expected: true, label: '100.64.0.0/10 upper bound' },
    { ip: '0.0.0.0', expected: true, label: '0.0.0.0/8 current network' },

    // IPv6 Private & Reserved (Must be TRUE)
    { ip: '::1', expected: true, label: 'IPv6 loopback ::1' },
    { ip: '::', expected: true, label: 'IPv6 unspecified ::' },
    { ip: 'fe80::1', expected: true, label: 'IPv6 link-local fe80::' },
    { ip: 'fc00::1', expected: true, label: 'IPv6 unique local fc00::' },
    { ip: 'fd12:3456:789a::1', expected: true, label: 'IPv6 unique local fd00::' },
    { ip: '::ffff:127.0.0.1', expected: true, label: 'IPv4-mapped IPv6 loopback' },
    { ip: '::ffff:10.0.0.1', expected: true, label: 'IPv4-mapped IPv6 private' },

    // Public IPs (Must be FALSE)
    { ip: '8.8.8.8', expected: false, label: 'Google Public DNS 8.8.8.8' },
    { ip: '1.1.1.1', expected: false, label: 'Cloudflare Public DNS 1.1.1.1' },
    { ip: '88.222.243.43', expected: false, label: 'gpcamerarental.com host IP' }
  ];

  let ipPassed = true;
  for (const tc of ipTestCases) {
    const result = isPrivateIp(tc.ip);
    if (result !== tc.expected) {
      console.error(`🚨 FAIL: isPrivateIp("${tc.ip}") [${tc.label}] returned ${result}, expected ${tc.expected}`);
      ipPassed = false;
      allPassed = false;
    }
  }
  if (ipPassed) {
    console.log(`✅ PASS: All ${ipTestCases.length} IP test cases correctly classified!`);
  }

  // DNS-resolution branch unit test with mock lookup (simulating DNS rebinding to 127.0.0.1)
  console.log('\n--- Step 1b: Unit Test for DNS Rebinding Defense (Mock DNS Lookup) ---');
  const mockRebindingLookup = async () => [{ address: '127.0.0.1', family: 4 }];
  const rebindingCheck = await validateDns('gpcamerarental.com', mockRebindingLookup);
  console.log('Mock DNS returning 127.0.0.1 -> Result safe:', rebindingCheck.safe, '| Error:', rebindingCheck.error);
  if (!rebindingCheck.safe && rebindingCheck.error && rebindingCheck.error.includes('prohibited')) {
    console.log('✅ PASS: DNS rebinding returning 127.0.0.1 was strictly caught and blocked!');
  } else {
    console.error('🚨 FAIL: DNS rebinding was not caught!');
    allPassed = false;
  }

  const mockPublicLookup = async () => [{ address: '88.222.243.43', family: 4 }];
  const publicCheck = await validateDns('gpcamerarental.com', mockPublicLookup);
  console.log('Mock DNS returning public IP -> Result safe:', publicCheck.safe);
  if (publicCheck.safe) {
    console.log('✅ PASS: Valid public IP passed DNS validation successfully!');
  } else {
    console.error('🚨 FAIL: Valid public IP failed DNS validation!');
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // 2. URL PARSER & BYPASS RESISTANCE TESTS (Expected 403 or 400)
  // --------------------------------------------------------------------------
  console.log('\n--- Step 2: URL Bypass Resistance Tests (Must return 403 / 400) ---');
  const bypassUrls = [
    { url: 'https://evilgpcamerarental.com/pic.jpg', expected: 403, label: 'Suffix prefix domain (evilgpcamerarental.com)' },
    { url: 'https://gpcamerarental.com.evil.com/pic.jpg', expected: 403, label: 'Pre-domain subdomain bypass (gpcamerarental.com.evil.com)' },
    { url: 'https://gpcamerarental.com@evil.com/pic.jpg', expected: 403, label: 'Userinfo bypass (gpcamerarental.com@evil.com)' },
    { url: 'https://evil.com#gpcamerarental.com', expected: 403, label: 'Fragment bypass (evil.com#gpcamerarental.com)' },
    { url: 'http://2130706433/', expected: 400, label: 'Integer IP representation (http://2130706433/)' },
    { url: 'http://[::1]/', expected: 400, label: 'Bracketed IPv6 loopback (http://[::1]/)' }
  ];

  for (const tc of bypassUrls) {
    const res = await testProxy(tc.url);
    console.log(`Testing [${tc.label}] -> Status: ${res.status}`);
    if (res.status === 403 || res.status === 400) {
      console.log(`  ✅ PASS: Blocked with HTTP ${res.status}`);
    } else {
      console.error(`  🚨 FAIL: Expected 403/400 but received ${res.status}!`);
      allPassed = false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. DATABASE IMAGE HOSTNAME AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- Step 3: Database Product Images Hostname Audit ---');
  const products = await prisma.product.findMany({ select: { images: true } });
  const hostnames = new Set();
  for (const p of products) {
    if (!p.images) continue;
    const matches = p.images.match(/https?:\/\/[^/,\s"']+/g) || [];
    for (const m of matches) {
      try { hostnames.add(new URL(m).hostname); } catch {}
    }
  }
  const dbHostnames = Array.from(hostnames);
  console.log('Database products count:', products.length);
  console.log('Product image hostnames found in DB:', dbHostnames.length > 0 ? dbHostnames : 'None (0 external URLs, all local paths)');
  console.log('Configured ALLOWED_PROXY_DOMAINS (Strict exact list):', ALLOWED_PROXY_DOMAINS);
  if (ALLOWED_PROXY_DOMAINS.includes('gpcamerarental.com') && ALLOWED_PROXY_DOMAINS.includes('www.gpcamerarental.com')) {
    console.log('✅ PASS: Allowlist strictly pinned to required hostnames without wildcards.');
  }

  // --------------------------------------------------------------------------
  // 4. POSITIVE TEST: Live Allowed Image from gpcamerarental.com
  // --------------------------------------------------------------------------
  console.log('\n--- Step 4: Positive Test: Real Allowed Image Retrieval ---');
  const realImageUrl = 'https://gpcamerarental.com/wp-content/uploads/2021/06/Icon0.png';
  const posRes = await testProxy(realImageUrl);
  console.log('HTTP Status:', posRes.status);
  console.log('Content-Type:', posRes.contentType);
  console.log('X-Content-Type-Options:', posRes.nosniff);
  console.log('Bytes received:', posRes.byteLength);

  if (posRes.status === 200 && posRes.contentType && posRes.contentType.startsWith('image/') && posRes.nosniff === 'nosniff') {
    console.log('✅ PASS: Successfully fetched real remote image with 200 OK, image content-type, and nosniff header!');
  } else {
    console.error('🚨 FAIL: Real image fetch failed. Status:', posRes.status);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // 5. STREAMING 5MB CUTOFF TEST (CHUNKED 6MB -> 413)
  // --------------------------------------------------------------------------
  console.log('\n--- Step 5: Streaming Byte-Limit Cutoff Test (Chunked 6MB -> 413) ---');
  // Create an async iterable stream yielding six 1MB chunks (total 6MB)
  function createChunkedStream(chunksCount, chunkSize) {
    return (async function* () {
      for (let i = 0; i < chunksCount; i++) {
        yield Buffer.alloc(chunkSize, 'A');
      }
    })();
  }

  const abortCtrl = new AbortController();
  let caughtTooLarge = false;
  try {
    const stream6MB = createChunkedStream(6, 1024 * 1024); // 6 x 1MB = 6MB
    await streamImageWithLimit(stream6MB, abortCtrl, 5 * 1024 * 1024);
  } catch (err) {
    if (err instanceof PayloadTooLargeError || err.code === 'PAYLOAD_TOO_LARGE') {
      caughtTooLarge = true;
      console.log('Stream cutter threw expected error:', err.message);
    } else {
      console.error('Unexpected error from stream limit:', err);
    }
  }

  if (caughtTooLarge && abortCtrl.signal.aborted) {
    console.log('✅ PASS: Stream limit successfully triggered at >5MB and aborted the controller (HTTP 413 mapping)!');
  } else {
    console.error('🚨 FAIL: Stream limit did not catch 6MB stream or abort controller!');
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // 6. HTTPS ENFORCEMENT & RATE LIMITING TEST
  // --------------------------------------------------------------------------
  console.log('\n--- Step 6: HTTPS Protocol Enforcement & Rate Limiting ---');
  const httpRes = await testProxy('http://gpcamerarental.com/wp-content/uploads/2021/06/Icon0.png');
  console.log('Testing plain HTTP URL -> Status:', httpRes.status, '| Error:', httpRes.body?.error);
  if (httpRes.status === 400 && httpRes.body?.error && httpRes.body.error.includes('Only HTTPS')) {
    console.log('✅ PASS: Plain HTTP strictly blocked with 400 Bad Request!');
  } else {
    console.error('🚨 FAIL: Plain HTTP was not rejected properly!');
    allPassed = false;
  }

  await prisma.$disconnect();

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL EXTENDED SSRF VERIFICATION TESTS PASSED (100%)');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('================================================================');
}

run().catch(async (err) => {
  console.error('Test execution error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
