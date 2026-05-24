# Ollama VS Code - Complete Testing Guide

## Pre-Launch Checklist

### 1. Stripe Webhook Setup (Required)

```bash
# 1. Go to https://dashboard.stripe.com/webhooks
# 2. Click "Add endpoint"
# 3. URL: https://license.rochastudios.ai/api/webhooks/stripe
# 4. Events: checkout.session.completed, payment_intent.succeeded
# 5. Copy signing secret (whsec_...)
# 6. Update server:

ssh root@209.42.26.107
sed -i 's/whsec_test_.*/whsec_YOUR_REAL_SECRET/' /root/ollama-license/monetization/.env
pm2 restart ollama-license

# 7. Get publishable key from https://dashboard.stripe.com/apikeys
# 8. Copy pk_live_... and update .env
```

### 2. DNS Propagation Check

```bash
# Check if landing pages are accessible
curl -I https://license.rochastudios.ai/api/status
# Expected: 200 OK

curl -I https://ollama.rochastudios.ai
# Expected: 200 OK (Cloudflare Pages)
```

### 3. License Server Health

```bash
# Test API endpoints
curl https://license.rochastudios.ai/api/status
# Expected: {"status":"ok","version":"1.0.0"}
```

## Integration Testing

### Test 1: User Registration & Login

```bash
# 1. Go to https://license.rochastudios.ai/auth
# 2. Click "Sign Up"
# 3. Enter test@example.com / Test1234!
# 4. Submit form
# Expected: Redirect to dashboard, token saved locally

# 5. Log out
# 6. Go to login tab
# 7. Enter same credentials
# Expected: Successful login
```

### Test 2: License Token Generation

```bash
# After logging in:
# 1. Go to https://license.rochastudios.ai/dashboard
# 2. Copy license token from "License Token" section
# 3. Should be a valid JWT starting with "eyJ..."
# 4. Test validation:

curl -X POST https://license.rochastudios.ai/api/licenses/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'

# Expected: {"valid":true,"tier":"Free","creditsRemaining":100}
```

### Test 3: VS Code Extension License Check

```bash
# 1. In VS Code settings (Cmd+,)
# 2. Search "Ollama License Token"
# 3. Paste the token from dashboard
# 4. Check "Ollama: License Required"
# 5. Open a code file (Python/JavaScript)
# 6. Start typing a function
# Expected: Inline completions appear from qwen3:14b

# If no completions:
# - Check VS Code output panel (Ctrl+`)
# - Verify Ollama server running: curl http://142.54.161.210:11434/api/tags
# - Check license token is valid
```

### Test 4: Payment Flow (Stripe Test Mode)

```bash
# Use Stripe test card: 4242 4242 4242 4242
# 1. Go to https://ollama.rochastudios.ai/pricing
# 2. Click "Get Professional" ($15/month)
# 3. Enter test card details:
#    - Card: 4242 4242 4242 4242
#    - Expiry: 12/25
#    - CVC: 123
# 4. Submit checkout
# Expected: Subscription created, credits granted, license renewed

# Verify in database:
ssh root@209.42.26.107
sqlite3 /root/ollama-license.db "SELECT * FROM subscriptions WHERE userId = 'YOUR_USER_ID';"
```

### Test 5: Chrome Extension Voice Commands

```bash
# 1. Install extension from chrome://extensions (load unpacked)
# 2. Open VS Code editor
# 3. Click extension icon
# 4. Click microphone button
# 5. Say: "code function hello"
# Expected: "function hello()" inserted at cursor

# Test commands:
# - "code [text]" - Insert code
# - "complete" - Request completion
# - "toggle ollama" - Toggle completions
# - "check status" - Check Ollama status
# - "qa" - Run quality analysis
```

### Test 6: Auto QA Analysis

```bash
# PHP file test:
# 1. Create test.php with: <?php echo $_GET['name']; ?>
# 2. Open in VS Code with extension enabled
# 3. Expected diagnostic: "XSS vulnerability: echoing user input"

# 4. Fix code: <?php echo htmlspecialchars($_GET['name']); ?>
# 5. Expected: Diagnostic clears
```

### Test 7: Themes Testing

```bash
# 1. Cmd+K Cmd+T (Command Palette > Preferences: Color Theme)
# 2. Cycle through all 13 themes:
#    - Ollama Dark ✓
#    - Ollama Light ✓
#    - Ollama High Contrast Light ✓
#    - Ollama High Contrast Dark ✓
#    - Dracula ✓
#    - Nord ✓
#    - Tokyo Night ✓
#    - One Dark Pro ✓
#    - GitHub Light ✓
#    - Solarized Dark ✓
#    - Solarized Light ✓
#    - Monokai ✓
#    - Gruvbox Dark ✓
# Expected: All themes load without errors
```

## Performance Testing

```bash
# Measure latency
time curl -X POST https://license.rochastudios.ai/api/licenses/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN"}'
# Expected: < 100ms response time

# Load test (10 concurrent requests)
ab -n 100 -c 10 https://license.rochastudios.ai/api/status

# Database integrity
ssh root@209.42.26.107
sqlite3 /root/ollama-license.db "PRAGMA integrity_check;"
# Expected: ok
```

## Deployment Checklist

- [ ] Stripe webhook endpoint created
- [ ] Stripe signing secret in .env
- [ ] Stripe publishable key in .env
- [ ] License server restarted
- [ ] DNS records propagated
- [ ] Landing pages accessible
- [ ] Auth pages working (signup/login)
- [ ] Dashboard shows license token
- [ ] VS Code extension can verify tokens
- [ ] Chrome extension installed
- [ ] Payment flow tested with test card
- [ ] Auto QA detects issues
- [ ] All 13 themes load
- [ ] GitHub repo updated with all code

## Going Live

### 1. Switch Stripe to Live Mode

```bash
# In Stripe dashboard:
# 1. Click "Activate your account"
# 2. Fill in business information
# 3. Provide banking details
# 4. Dashboard will switch from test mode
# 5. Get live API keys
# 6. Update .env on server:

sed -i 's/sk_test_.*/sk_live_YOUR_LIVE_KEY/' /root/ollama-license/monetization/.env
sed -i 's/pk_test_.*/pk_live_YOUR_LIVE_KEY/' /root/ollama-license/monetization/.env
pm2 restart ollama-license
```

### 2. Publish to GitHub Releases

```bash
git tag v1.0.0
git push origin v1.0.0

# Create release on GitHub with:
# - VS Code extension (`.vsix` file)
# - Chrome extension (`.zip` for Chrome Web Store)
# - Installation instructions
```

### 3. Submit to Extension Marketplaces

**VS Code:**
- https://marketplace.visualstudio.com/vscode
- Upload `.vsix` file
- 24-48 hours for review

**Chrome Web Store:**
- https://chrome.google.com/webstore/devconsole
- Upload extension ZIP
- 1-3 hours for review

## Monitoring

```bash
# Daily checks
ssh root@209.42.26.107

# Check process
pm2 monit ollama-license

# View recent logs
pm2 logs ollama-license --lines 50

# Database stats
sqlite3 /root/ollama-license.db << 'SQL'
SELECT 'Users' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Licenses', COUNT(*) FROM licenses
UNION ALL
SELECT 'Credits Sold', SUM(creditsGranted) FROM payments WHERE status='succeeded';
SQL

# Check disk space
df -h /root/ollama-license.db
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "License invalid" | Verify token in /dashboard, regenerate if needed |
| No completions appearing | Check Ollama server: `curl http://142.54.161.210:11434/api/tags` |
| Payment fails | Check Stripe API keys, enable test mode for testing |
| Webhook not firing | Check Stripe dashboard webhook logs, verify signing secret |
| Voice commands not working | Allow microphone access in Chrome, check browser console |
| Themes not loading | Clear VS Code cache: `rm -rf ~/.config/Code/Cache` |

## Support

- Issues: https://github.com/alejandrodelarocha/vscode-ollama-fork/issues
- Docs: https://github.com/alejandrodelarocha/vscode-ollama-fork/blob/main/README.md
- Email: support@rochastudios.ai
