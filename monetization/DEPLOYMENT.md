# License Server Deployment Guide

Complete guide to deploy Ollama VS Code license and subscription server.

## Overview

**License Server** handles:
- User authentication (signup/login with JWT)
- Subscription management (Stripe integration)
- Credit system (pay-as-you-go)
- License verification
- Usage tracking and billing

**Tech Stack:**
- Express.js (Node.js)
- SQLite3 (database)
- Stripe API (payments)
- JWT (authentication)

## Prerequisites

1. Node.js 16+ and npm
2. Stripe Account (free tier OK for testing)
3. Domain (for production)
4. Server (Verpex, DigitalOcean, Heroku, etc.)

## Local Development

### 1. Setup

```bash
cd monetization
npm install
cp .env.example .env
```

### 2. Configure .env

```
PORT=3000
DOMAIN=http://localhost:3000
DB_PATH=./license.db
JWT_SECRET=dev-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=development
```

Get Stripe keys from https://dashboard.stripe.com/apikeys

### 3. Run Server

```bash
npm start
# Server running on http://localhost:3000
```

Test:
```bash
curl http://localhost:3000/api/status
# { "status": "ok", "version": "1.0.0" }
```

## Deployment to Verpex

**Host:** 209.42.26.107  
**Port:** 9979 (via Caddy reverse proxy)

### Steps:

1. **SSH to server**
   ```bash
   ssh root@209.42.26.107
   ```

2. **Clone repo**
   ```bash
   cd /root && git clone https://github.com/alejandrodelarocha/vscode-ollama-fork.git
   cd vscode-ollama-fork/monetization
   ```

3. **Install dependencies**
   ```bash
   npm install --production
   ```

4. **Create .env**
   ```bash
   cat > .env << 'ENVEOF'
   PORT=9979
   DOMAIN=https://rochastudios.ai
   DB_PATH=/root/ollama-license.db
   JWT_SECRET=your-production-secret-key-64-chars-min
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=production
   ENVEOF
   chmod 600 .env
   ```

5. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start license-server.js --name "ollama-license" --env production
   pm2 save
   pm2 startup
   ```

6. **Configure Caddy**
   Edit `/root/dynamic/Caddyfile`:
   ```
   license.rochastudios.ai {
     reverse_proxy 127.0.0.1:9979
   }
   ```

7. **Reload Caddy**
   ```bash
   docker exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

**Access:** https://license.rochastudios.ai/api/status

### Monitoring

```bash
pm2 logs ollama-license      # View logs
pm2 monit                     # Real-time stats
pm2 restart ollama-license    # Restart
pm2 status                    # Check status
```

## Stripe Configuration

### 1. Get API Keys

Dashboard → Developers → API Keys:
- Secret: sk_live_...
- Publishable: pk_live_...

### 2. Create Webhook

Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://license.rochastudios.ai/api/webhooks/stripe`
- Events:
  - checkout.session.completed
  - payment_intent.succeeded

Copy signing secret: whsec_...

## API Endpoints

### Auth

```
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123"
}

POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Plans

```
GET /api/plans
# Returns: free, starter, professional, business, enterprise
```

### Subscriptions

```
POST /api/subscriptions/checkout
Authorization: Bearer TOKEN
{
  "tier": "professional"
}
```

### Credits

```
GET /api/credits/balance
Authorization: Bearer TOKEN

POST /api/credits/purchase
Authorization: Bearer TOKEN
{
  "amount": 50
}

POST /api/usage/deduct
Authorization: Bearer TOKEN
{
  "licenseId": "lic_123",
  "completions": 1
}
```

### Licenses

```
POST /api/licenses/verify
Authorization: Bearer TOKEN
{
  "licenseKey": "OLLAMA-xxxxx"
}
```

## Pricing

| Tier | Price | Completions | Features |
|------|-------|-------------|----------|
| Free | $0 | 50/day | Basic, Community |
| Starter | $5/mo | 500/mo | Email support |
| Professional | $15/mo | 2000/mo | Priority support |
| Business | $50/mo | 10000/mo | 24/7 support |
| Enterprise | Custom | Unlimited | Custom SLA |

## Database Backup

```bash
# Manual backup
cp /root/ollama-license.db /root/backups/license-$(date +%Y%m%d).db

# Daily cron backup
0 2 * * * cp /root/ollama-license.db /root/backups/license-$(date +\%Y\%m\%d).db
```

## Security Checklist

- [ ] JWT_SECRET is 64+ characters
- [ ] Using STRIPE_LIVE keys (not test)
- [ ] HTTPS only (via Caddy)
- [ ] Rate limiting enabled
- [ ] Database backups daily
- [ ] Monitor suspicious activity
- [ ] Never commit .env file
- [ ] Log all payments

## Troubleshooting

**Port in use:**
```bash
lsof -i :9979
kill -9 <PID>
```

**Database locked:**
```bash
pm2 restart ollama-license
```

**Webhook failing:**
1. Check webhook secret in .env
2. Verify firewall allows port 443
3. Test in Stripe Dashboard

---

Version: 1.0.0 | Status: Ready for deployment
