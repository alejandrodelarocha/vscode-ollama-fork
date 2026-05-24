# 🚀 Quick Start - Go Live in 3 Steps

## Current Status
✅ License server running (port 9979)  
✅ Landing pages deployed  
✅ VS Code extension ready  
✅ Chrome extension ready  
✅ Database initialized  
✅ All code on GitHub  

⏳ Waiting for: Stripe webhook secret + DNS setup

---

## Step 1: Setup Stripe (30 min)

```bash
# Run interactive setup script
bash scripts/stripe-setup.sh
```

This will prompt you to:
1. Go to Stripe dashboard and create webhook endpoint
2. Copy the signing secret (whsec_...)
3. Get API keys (sk_test_, pk_test_)
4. Script automatically updates the server

**What happens:**
- Stripe → Payments → License server → Database

---

## Step 2: Verify System (5 min)

```bash
# Run automated health checks
bash scripts/test-system.sh
```

Should see all green ✅ except DNS (which needs Namecheap setup)

---

## Step 3: DNS Setup at Namecheap (10 min)

Go to: https://www.namecheap.com/dashboard/domains

**For rochastudios.ai:**
Add these DNS records:
- Type: CNAME
- Name: `ollama`
- Value: `verpex-pages.pages.cloudflare.com` (for landing pages)
- Type: A
- Name: `license`
- Value: `209.42.26.107` (Verpex server)

**Propagation time:** 5-30 minutes (usually 15 min)

Verify with:
```bash
nslookup license.rochastudios.ai
nslookup ollama.rochastudios.ai
```

---

## Step 4: End-to-End Test (15 min)

### Test User Registration & License Token

```bash
# 1. Sign up
Open: https://license.rochastudios.ai/auth
Email: test@example.com
Password: Test1234!
→ Auto-redirects to dashboard

# 2. Copy license token
From: https://license.rochastudios.ai/dashboard
Section: "License Token"
Format: JWT (starts with eyJ...)

# 3. Test in VS Code
Settings (Cmd+,) → Search "Ollama License Token"
Paste the token
Enable: "Ollama: License Required"

# 4. Verify completions
Open a Python/JavaScript file
Start typing a function
Inline completions should appear from qwen3:14b
```

### Test Payment Flow (with test card)

```bash
# 1. Go to pricing
https://ollama.rochastudios.ai/pricing

# 2. Click "Get Professional" ($15/month)

# 3. Enter test card details:
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123

# 4. Verify in dashboard
Login again
Check subscription status
Check credits were added
```

---

## Step 5: Launch (When Ready)

### Switch to Live Mode

```bash
# 1. Stripe Dashboard
https://dashboard.stripe.com
→ Account → Activate Live Mode
→ Get live API keys (sk_live_, pk_live_)

# 2. Run setup script again
bash scripts/stripe-setup.sh
→ Enter live keys instead of test keys

# 3. Create GitHub release
git tag v1.0.0
git push origin v1.0.0
→ Create release on GitHub with binaries

# 4. Submit to marketplaces
VS Code: https://marketplace.visualstudio.com/vscode
Chrome: https://chrome.google.com/webstore/devconsole
```

---

## Monitoring

Check system health anytime:

```bash
# Server logs
ssh root@209.42.26.107
pm2 logs ollama-license

# Database stats
sqlite3 /root/ollama-license.db << SQL
SELECT 'Users' as stat, COUNT(*) FROM users
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments WHERE status='succeeded'
UNION ALL
SELECT 'Active Licenses', COUNT(*) FROM licenses WHERE status='active';
SQL
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "License invalid" in VS Code | Re-copy token from dashboard, it may have expired |
| No completions | Check: 1) Server running, 2) Ollama GPU server at 142.54.161.210:11434 |
| Webhook not firing | Check Stripe dashboard webhooks for error logs |
| DNS not resolving | Wait 15-30 min, then nslookup rochastudios.ai |
| Payment fails | Use test card: 4242 4242 4242 4242, check Stripe logs |

---

## Key URLs

| URL | Purpose |
|-----|---------|
| https://license.rochastudios.ai | License server (auth, dashboard) |
| https://ollama.rochastudios.ai | Landing page & pricing |
| https://license.rochastudios.ai/auth | User signup/login |
| https://license.rochastudios.ai/dashboard | License tokens & credits |
| https://ollama.rochastudios.ai/pricing | Stripe checkout |
| ssh root@209.42.26.107 | Server access |
| https://dashboard.stripe.com/webhooks | Webhook configuration |

---

## Automation Scripts

```bash
# Setup Stripe (interactive)
bash scripts/stripe-setup.sh

# Test all systems
bash scripts/test-system.sh

# View logs
pm2 logs ollama-license

# Database backup
sqlite3 /root/ollama-license.db ".dump" > backup.sql
```

---

## Timeline

- **Now**: Run `stripe-setup.sh` (5 min)
- **+15 min**: DNS should propagate
- **+20 min**: Run end-to-end tests
- **+35 min**: Ready to launch with live keys
- **+1-3 days**: Extension approvals (VS Code, Chrome)

---

**Questions?** Check DEPLOYMENT_STATUS.md or TESTING_GUIDE.md for detailed documentation.

🎉 **You're 95% there. Just complete the Stripe setup and you can go live!**
