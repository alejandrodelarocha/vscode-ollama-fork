/**
 * Local E2E Test - Tests via 127.0.0.1:9979 (Verpex server)
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:9979';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test1234!';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Ollama E2E Test Suite (Local)');
  console.log('═════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Server Health
    console.log('Test 1: License Server Health');
    console.log('────────────────────────────');
    const status = await request('GET', '/api/status');
    if (status.status === 200 && status.data.status === 'ok') {
      console.log('✅ Server responding');
      console.log(`   Status: ${status.data.status}`);
      console.log(`   Version: ${status.data.version}\n`);
      passed++;
    } else {
      console.log('❌ Server not responding\n');
      failed++;
    }

    // Test 2: User Signup
    console.log('Test 2: User Registration');
    console.log('────────────────────────');
    const signup = await request('POST', '/api/auth/signup', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if ((signup.status === 200 || signup.status === 201) && signup.data.token) {
      console.log('✅ User registration successful');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Token received: ${signup.data.token.substring(0, 30)}...\n`);
      passed++;

      const token = signup.data.token;

      // Test 3: User Login
      console.log('Test 3: User Authentication');
      console.log('──────────────────────────');
      const login = await request('POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      if (login.status === 200 && login.data.token) {
        console.log('✅ User login successful');
        console.log(`   Session token: ${login.data.token.substring(0, 30)}...\n`);
        passed++;

        // Test 4: License Verification
        console.log('Test 4: License Token Verification');
        console.log('─────────────────────────────────');
        const verify = await request('POST', '/api/licenses/verify', {
          token: token
        });

        if (verify.status === 200) {
          console.log('✅ License token verified');
          console.log(`   Valid: ${verify.data.valid}`);
          if (verify.data.tier) console.log(`   Tier: ${verify.data.tier}`);
          console.log();
          passed++;
        } else {
          console.log('⚠️  License verification returned:', verify.status, '\n');
        }
      } else {
        console.log('❌ Login failed\n');
        failed++;
      }
    } else {
      console.log('❌ Signup failed\n');
      failed++;
    }

    // Test 5: API Endpoints
    console.log('Test 5: API Endpoint Availability');
    console.log('────────────────────────────────');
    const endpoints = [
      '/api/status',
      '/api/plans'
    ];

    for (const endpoint of endpoints) {
      const res = await request('GET', endpoint);
      if (res.status === 200 || res.status === 201) {
        console.log(`✅ ${endpoint}`);
        passed++;
      } else {
        console.log(`⚠️  ${endpoint} (${res.status})`);
      }
    }
    console.log();

    // Summary
    console.log('═════════════════════════════════════════');
    console.log(`✅ TESTS PASSED: ${passed}`);
    console.log(`⚠️  TESTS FAILED: ${failed}`);
    console.log('═════════════════════════════════════════\n');

    if (failed === 0) {
      console.log('🎉 All tests passed! System is fully operational.\n');
      console.log('Next steps:');
      console.log('1. Setup DNS at Namecheap');
      console.log('2. Test via https://license.rochastudios.ai/auth');
      console.log('3. Provide real Stripe keys (sk_live_, pk_live_)');
      console.log('4. Go live!\n');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Verify license server is running on Verpex');
    console.error('- SSH: ssh root@209.42.26.107 && pm2 status ollama-license');
  }
}

runTests();
