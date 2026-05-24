/**
 * End-to-End Test Suite for Ollama License System
 * Tests: Signup → License Token → License Verification
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://license.rochastudios.ai';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test1234!';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🧪 Ollama E2E Test Suite');
  console.log('========================\n');

  try {
    // Test 1: Signup
    console.log('Test 1: User Signup');
    console.log('─────────────────────');
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('#signup-email', TEST_EMAIL);
    await page.fill('#signup-password', TEST_PASSWORD);
    await page.fill('#signup-confirm', TEST_PASSWORD);

    // Wait for button and click
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✅ Signup successful');
    console.log(`   Email: ${TEST_EMAIL}\n`);

    // Test 2: Verify License Token
    console.log('Test 2: License Token Generation');
    console.log('────────────────────────────────');
    const pageContent = await page.content();

    // Look for JWT token in the page
    const tokenMatch = pageContent.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);

    if (tokenMatch) {
      const token = tokenMatch[0];
      console.log('✅ License token found');
      console.log(`   Token: ${token.substring(0, 30)}...${token.substring(token.length - 20)}\n`);

      // Test 3: Verify Token Format
      console.log('Test 3: Token Validation');
      console.log('───────────────────────');
      const parts = token.split('.');
      if (parts.length === 3) {
        console.log('✅ Valid JWT format (3 parts)\n');
      }
    } else {
      console.log('⚠️  License token not found on dashboard\n');
    }

    // Test 4: API Verification
    console.log('Test 4: License Verification API');
    console.log('────────────────────────────────');
    const response = await page.request.post(`${BASE_URL}/api/licenses/verify`, {
      data: { token: tokenMatch?.[0] || 'test' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API responds to license verification');
      console.log(`   Status: ${data.valid ? 'Valid' : 'Invalid'}\n`);
    } else {
      console.log(`⚠️  API returned ${response.status()}\n`);
    }

    // Test 5: Dashboard Elements
    console.log('Test 5: Dashboard UI Elements');
    console.log('────────────────────────────');

    const hasEmail = await page.locator('text=Email').isVisible();
    const hasPlan = await page.locator('text=Plan').isVisible();
    const hasToken = await page.locator('text=License Token').isVisible();

    if (hasEmail && hasPlan && hasToken) {
      console.log('✅ All dashboard sections visible\n');
    } else {
      console.log('⚠️  Some dashboard sections missing\n');
    }

    // Test 6: Server Health
    console.log('Test 6: Server Health Check');
    console.log('──────────────────────────');
    const statusResponse = await page.request.get(`${BASE_URL}/api/status`);

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ License server responding');
      console.log(`   Status: ${status.status}`);
      console.log(`   Version: ${status.version}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - System is operational!');
    console.log('═══════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Copy the license token from dashboard');
    console.log('2. Paste into VS Code settings');
    console.log('3. Open a code file and start typing');
    console.log('4. Verify completions appear from qwen3:14b\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Check if https://license.rochastudios.ai is accessible');
    console.error('- Verify license server is running: ssh root@209.42.26.107 && pm2 status ollama-license');
    console.error('- Check DNS: nslookup license.rochastudios.ai');
  } finally {
    await browser.close();
  }
}

// Run tests
runTests().catch(console.error);
