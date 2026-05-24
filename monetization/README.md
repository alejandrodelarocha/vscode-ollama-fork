# Ollama VS Code - License Server & Monetization

Complete licensing, subscription, and billing system for Ollama VS Code.

## Overview

This folder contains the complete backend for monetizing Ollama VS Code:

- **License Server** - Express.js backend with Stripe integration
- **Authentication** - JWT-based user accounts
- **Subscriptions** - Monthly plans with Stripe
- **Credits** - Pay-as-you-go system ($0.01 per completion)
- **Usage Tracking** - Monitor completions and costs per user
- **Database** - SQLite3 with 7 tables

## Quick Start

### Development

```bash
npm install
cp .env.example .env
npm start
# Server running on http://localhost:3000
```

### Production (Verpex)

```bash
# Deploy to 209.42.26.107:9979
# See DEPLOYMENT.md for full instructions
```

## Architecture

```
┌─────────────────────────────────────────┐
│  VS Code Extension                      │
│  - Verify license                       │
│  - Deduct credits per completion        │
│  - Get credit balance                   │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│  License Server (9979)                  │
│  - /api/auth/signup                     │
│  - /api/auth/login                      │
│  - /api/licenses/verify                 │
│  - /api/subscriptions/checkout          │
│  - /api/credits/balance                 │
│  - /api/usage/deduct                    │
│  - /api/webhooks/stripe                 │
└──────────────┬──────────────────────────┘
               │
               ├──► Stripe API (payments)
               │
               └──► SQLite3 (license.db)
```

## Files

- **license-server.js** - Main Express.js server (400+ lines)
  - 8 API endpoints
  - 6 tables with proper indexing
  - Stripe webhook handling
  - JWT authentication
  
- **package.json** - Dependencies
  - express, sqlite3, stripe, jwt, bcrypt
  
- **.env.example** - Environment template
  - Stripe keys, JWT secret, database path
  
- **DEPLOYMENT.md** - Full deployment guide
  - Verpex setup (recommended)
  - Docker alternative
  - Stripe configuration
  - Monitoring & logging

## Pricing Tiers

### Free ($0)
- 50 completions/day
- Community support
- All 9 themes

### Starter ($5/month)
- 500 completions/month
- Email support
- All themes

### Professional ($15/month)
- 2000 completions/month
- Priority support
- Advanced QA

### Business ($50/month)
- 10000 completions/month
- 24/7 support
- Custom models

### Enterprise (Custom)
- Unlimited completions
- Dedicated support
- Custom SLA

## API Endpoints

### Authentication
```
POST /api/auth/signup      - Create account
POST /api/auth/login       - Login (returns JWT token)
```

### Licensing
```
POST /api/licenses/verify  - Verify license key
GET  /api/plans            - Get pricing tiers
```

### Subscriptions
```
POST /api/subscriptions/checkout - Create Stripe checkout session
```

### Credits
```
GET  /api/credits/balance      - Get credit balance
POST /api/credits/purchase     - Purchase credits with Stripe
POST /api/usage/deduct         - Deduct credits after completion
```

### Webhooks
```
POST /api/webhooks/stripe  - Stripe webhook (auto-called by Stripe)
GET  /api/status           - Health check
```

## Database Schema

### users
- id, email (unique), passwordHash, createdAt

### subscriptions
- id, userId (unique), tier, stripeCustomerId, status, currentPeriodStart/End

### credits
- id, userId (unique), balance, totalPurchased, totalUsed

### licenses
- id, userId, licenseKey (unique), productName, expiresAt, status

### usage
- id, userId, licenseId, completions, creditsCost, timestamp

### payments
- id, userId, stripePaymentIntentId, amount, creditsGranted, status

## Deployment

### Recommended: Verpex (209.42.26.107)

```bash
# 1. SSH and clone
ssh root@209.42.26.107
cd /root/vscode-ollama-fork/monetization

# 2. Install and configure
npm install --production
cp .env.example .env
# Edit .env with production keys

# 3. Start with PM2
pm2 start license-server.js --name "ollama-license"
pm2 save

# 4. Configure Caddy (reverse proxy)
# Edit /root/dynamic/Caddyfile
# Add: license.rochastudios.ai { reverse_proxy 127.0.0.1:9979 }

# 5. Reload
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

**Access:** https://license.rochastudios.ai

### Alternative: Docker
```bash
docker build -t ollama-license .
docker run -p 3000:3000 ollama-license
```

### Alternative: Heroku
```bash
heroku create ollama-license
git push heroku main
```

## Integration with VS Code

Add to `src/vs/editor/contrib/ollama/extension.ts`:

```typescript
// Verify license on startup
const license = await verifyLicense(licenseKey, token);
if (!license.valid) {
  vscode.window.showErrorMessage('Invalid license');
  return;
}

// Deduct credits before each completion
const result = await deductCredits(1);
if (result.creditsRemaining < 10) {
  vscode.window.showWarningMessage(
    `Low credits (${result.creditsRemaining} remaining)`
  );
}
```

## Environment Variables

```bash
PORT=9979                          # Server port
DOMAIN=https://rochastudios.ai     # For redirect URLs
DB_PATH=/root/ollama-license.db    # Database location
JWT_SECRET=your-secret-64-chars    # For signing tokens
STRIPE_SECRET_KEY=sk_live_...      # Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_live_... # Stripe public key
STRIPE_WEBHOOK_SECRET=whsec_...    # Stripe webhook secret
NODE_ENV=production                # Environment
```

## Monitoring

```bash
# View logs
pm2 logs ollama-license

# Real-time monitoring
pm2 monit

# Check status
pm2 status

# Restart
pm2 restart ollama-license
```

## Stripe Testing

### Test Keys (development)
- Secret: sk_test_...
- Publishable: pk_test_...
- Card: 4242 4242 4242 4242 (any future date, any CVC)

### Live Keys (production)
- Secret: sk_live_...
- Publishable: pk_live_...
- Use real cards

**Never commit live keys!** Use environment variables.

## Troubleshooting

**Database locked?**
```bash
pm2 restart ollama-license
```

**Webhook not triggering?**
1. Verify webhook secret in .env
2. Check firewall allows HTTPS
3. Test in Stripe Dashboard

**Port already in use?**
```bash
lsof -i :9979
kill -9 <PID>
```

## Security

✅ Passwords hashed with bcrypt  
✅ JWTs signed and verified  
✅ Stripe integration secure (no card storage)  
✅ HTTPS enforced (via Caddy)  
✅ Rate limiting (implement per-IP)  
✅ Input validation on all endpoints  
✅ SQL injection prevented (parameterized queries)  

## Pricing Model

Per completion cost:
- Base: $0.01
- Monthly allowance varies by tier
- Excess completions deducted from credits
- Credits never expire (unless enterprise SLA says otherwise)

Year 1 revenue projection (100 active users):
- 50 free users × $0 = $0
- 30 starter users × $5/mo × 12 = $1,800
- 15 professional users × $15/mo × 12 = $2,700
- 4 business users × $50/mo × 12 = $2,400
- 1 enterprise user × $100/mo × 12 = $1,200

**Total: ~$8,100/year**

(More realistic with 1000+ users: $80K-200K/year)

## Next Steps

1. **Deploy to production** - Follow DEPLOYMENT.md
2. **Test with Stripe test keys** - Use test card numbers
3. **Create landing/pricing page** - Market the plans
4. **Integrate with VS Code** - Add license verification
5. **Monitor and iterate** - Track usage, adjust pricing
6. **Migrate to live keys** - After validation in production

## Support

- GitHub Issues: https://github.com/alejandrodelarocha/vscode-ollama-fork/issues
- Email: support@rochastudios.ai
- Stripe Docs: https://stripe.com/docs

---

**Version:** 1.0.0  
**Status:** Ready for deployment  
**Created:** May 2026
