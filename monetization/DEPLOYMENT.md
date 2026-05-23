# Monetization Deployment Guide

Complete setup for monetized VS Code Ollama & WPBasic.

## Components

1. **License Server** (`license-server.js`)
   - User authentication (signup/login)
   - License key management
   - Subscription handling (Stripe)
   - Credit system + tracking
   - Usage analytics

2. **Landing Pages**
   - rochastudios.ai/ollama
   - rochastudios.ai/wpbasic
   - Pricing, features, call-to-action

3. **Extension Integration**
   - License key verification
   - Credit deduction per completion
   - Subscription status checking
   - Upgrade prompts

4. **Admin Dashboard**
   - User analytics
   - Revenue tracking
   - Churn monitoring
   - Support tools

---

## Setup Steps

### 1. Stripe Setup

```bash
# Create Stripe account at https://stripe.com

# Get API keys from Dashboard → Developers → API Keys
export STRIPE_SECRET_KEY="sk_live_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."

# Set up Stripe products & prices
# Free: No price (freemium)
# Starter: $5/month (price_starter)
# Professional: $15/month (price_pro)
# Business: $50/month (price_business)
```

### 2. Environment Setup

```bash
# Create .env file
cat > .env << EOF
PORT=9979
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your-secret-key-here
DB_PATH=./licenses.db
FRONTEND_URL=https://rochastudios.ai
EOF
```

### 3. Install Dependencies

```bash
cd monetization
npm install express stripe sqlite3 better-sqlite3 jsonwebtoken
```

### 4. Deploy License Server

```bash
# Option A: PM2 (recommended)
pm2 start license-server.js --name "ollama-license"
pm2 save
pm2 startup

# Option B: Docker
docker build -t ollama-license .
docker run -p 9979:9979 -e STRIPE_SECRET_KEY=sk_live_... ollama-license

# Option C: Manual
node license-server.js
```

### 5. Configure Stripe Webhooks

```
Stripe Dashboard → Developers → Webhooks

Endpoint URL: https://your-domain.com/api/webhooks/stripe
Events:
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
```

### 6. Update Extension

```typescript
// src/vs/editor/contrib/ollama/extension.ts

const LICENSE_SERVER = 'https://your-domain.com/api';

// On activation
const licenseKey = await vscode.workspace.getConfiguration('vscodeOllama').get('licenseKey');
const verified = await verifyLicense(licenseKey);

// Before each completion request
const credits = await getCreditsBalance();
if (credits < 1) {
  showUpgradePrompt();
  return;
}

// After completion
await deductCredits(1);
```

---

## API Endpoints

### Authentication

**POST /auth/signup**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "product": "vscode-ollama"
}

Response:
{
  "userId": "uuid",
  "token": "jwt-token",
  "licenseKey": "LL-...",
  "tier": "free"
}
```

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Licensing

**POST /license/verify**
```json
{
  "licenseKey": "LL-...",
  "product": "vscode-ollama"
}

Response:
{
  "valid": true,
  "tier": "professional",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Subscriptions

**GET /subscriptions/plans**
```
Returns available tiers with pricing and features
```

**POST /subscriptions/checkout**
```json
{
  "tier": "professional"
}

Response:
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

### Credits

**GET /credits/balance** (requires auth)
```
Response:
{
  "balance": 1500,
  "usedThisMonth": 350
}
```

**POST /credits/use** (requires auth)
```json
{
  "amount": 1,
  "type": "completion"
}
```

**POST /credits/purchase** (requires auth)
```json
{
  "creditAmount": 500
}
```

---

## Landing Page Template

### rochastudios.ai/ollama

```html
<header>
  <nav>
    <a href="/">Rocha Studios</a>
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    <a href="https://github.com/alejandrodelarocha/vscode-ollama-fork">GitHub</a>
  </nav>
</header>

<hero>
  <h1>VS Code Ollama</h1>
  <p>AI-powered code completion. Local. Private. Fast.</p>
  <button>Download Now</button>
  <button>Pricing</button>
</hero>

<features>
  <card>
    <icon>✨</icon>
    <h3>AI Completions</h3>
    <p>Intelligent code suggestions as you type</p>
  </card>
  <card>
    <icon>🚀</icon>
    <h3>GPU-Accelerated</h3>
    <p>Sub-second completions on dedicated hardware</p>
  </card>
  <card>
    <icon>🔒</icon>
    <h3>Fully Private</h3>
    <p>No external APIs, all computation stays local</p>
  </card>
  <card>
    <icon>🎨</icon>
    <h3>4 Beautiful Themes</h3>
    <p>Dark, Light, High Contrast variants</p>
  </card>
</features>

<pricing>
  <tier>
    <name>Free</name>
    <price>$0/month</price>
    <features>
      <li>50 completions/day</li>
      <li>Auto QA</li>
      <li>1 workspace</li>
      <li>Community support</li>
    </features>
    <button>Get Started</button>
  </tier>

  <tier highlight>
    <name>Professional</name>
    <price>$15/month</price>
    <features>
      <li>2,000 completions/month</li>
      <li>Advanced QA</li>
      <li>Team collaboration</li>
      <li>API access</li>
      <li>Priority support</li>
    </features>
    <button>Start Free Trial</button>
  </tier>

  <tier>
    <name>Business</name>
    <price>$50/month</price>
    <features>
      <li>10,000 completions/month</li>
      <li>Unlimited teams</li>
      <li>Custom AI models</li>
      <li>Dedicated support</li>
    </features>
    <button>Contact Sales</button>
  </tier>
</pricing>

<faq>
  <q>How much does it cost?</q>
  <a>Free forever with 50 completions/day, or $5-50/month for unlimited</a>

  <q>Is my code private?</q>
  <a>Yes! All computation stays on your GPU server. No data sent to us.</a>

  <q>What AI model does it use?</q>
  <a>Ollama qwen3:14b - fully local, no cloud APIs</a>

  <q>Can I self-host?</q>
  <a>Yes! Enterprise plan includes on-premises deployment</a>
</faq>

<cta>
  <h2>Ready to code with AI?</h2>
  <p>Get started free. No credit card required.</p>
  <button href="/auth/signup">Sign Up Now</button>
</cta>

<footer>
  <links>
    <a href="https://github.com/...">GitHub</a>
    <a href="https://docs">Docs</a>
    <a href="https://support">Support</a>
    <a href="https://privacy">Privacy</a>
  </links>
  <copyright>© 2026 Rocha Studios. All rights reserved.</copyright>
</footer>
```

### rochastudios.ai/wpbasic (Similar, WordPress-focused)

---

## Marketing Strategy

### Launch Phase (Week 1-2)

1. **ProductHunt Launch**
   - Post on ProductHunt
   - Engage with comments
   - Target: Top 5 product

2. **GitHub**
   - Release v1.0.0 + WPBasic v1.0.0
   - Add topic tags
   - Get on awesome-lists

3. **Reddit**
   - r/programming
   - r/PHP
   - r/WordPress (for WPBasic)
   - r/vscode

4. **Dev Communities**
   - Dev.to articles
   - Hacker News
   - Twitter threads

### Growth Phase (Month 1-3)

1. **SEO**
   - "AI code completion for WordPress"
   - "Local Ollama IDE"
   - "Private code suggestions"

2. **Partnerships**
   - WordPress hosting companies
   - Dev agencies (referral program)
   - Educational institutions

3. **Content**
   - Blog posts
   - Tutorial videos
   - Use case guides

### Retention Phase (Month 3+)

1. **Email**
   - Newsletter (usage tips, new features)
   - Upgrade emails
   - Re-engagement campaigns

2. **In-Product**
   - Daily tips (already built!)
   - Feature announcements
   - Credit promotional offers

3. **Community**
   - Discord/Slack
   - Monthly webinars
   - User surveys

---

## Revenue Projections

**Conservative Y1**: $14,400 (100 paid users)
**Aggressive Y1**: $90,000 (500 paid users)

**Break-even**: Month 4-6 depending on CAC

---

## Support Infrastructure

### Tier 1: Free/Starter
- Community Discord
- GitHub issues
- Email (48h response)

### Tier 2: Professional
- Priority email (24h)
- Phone support (business hours)
- Slack integration

### Tier 3: Business/Enterprise
- Dedicated Slack
- Phone support (24h)
- Custom SLAs
- Account manager

---

## Monitoring & Analytics

Track:
- Signups per day
- Conversion rate (free → paid)
- Monthly churn rate
- ARPU (Average Revenue Per User)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Feature usage
- Credit consumption

Dashboard: Stripe + custom analytics

---

## Legal/Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] GDPR compliance (EU users)
- [ ] Tax registration (sales tax)
- [ ] Payment processor compliance (PCI DSS via Stripe)
- [ ] Refund policy
- [ ] License agreement

---

## Timeline

**Week 1**: Set up Stripe + License server  
**Week 2**: Deploy landing pages  
**Week 3**: Integrate with extensions  
**Week 4**: Launch beta (friends/early users)  
**Week 5**: ProductHunt launch  
**Week 6+**: Growth & iteration  

---

**Status**: Ready for implementation

Start with free tier to build user base, then convert to paid tiers.
