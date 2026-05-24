const express = require('express');
const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Stripe webhook MUST come before express.json() to access raw body
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, tier } = session.metadata;

      // Update subscription
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const subStmt = db.prepare(`
        INSERT OR REPLACE INTO subscriptions (id, userId, tier, stripeCustomerId, stripeSubscriptionId, status, currentPeriodStart, currentPeriodEnd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      subStmt.run(
        generateId(),
        userId,
        tier,
        session.customer,
        session.subscription,
        'active',
        now.toISOString(),
        nextMonth.toISOString()
      );

      // Grant monthly credits
      const PRICING_TIERS = { Free: { cost: 0 }, Starter: { cost: 5, monthlyCredits: 1000 }, Professional: { cost: 15, monthlyCredits: 5000 }, Business: { cost: 50, monthlyCredits: 20000 }, Enterprise: { cost: 'custom' } };
      const planCredits = PRICING_TIERS[tier]?.monthlyCredits || 0;
      db.prepare('UPDATE credits SET balance = balance + ? WHERE userId = ?')
        .run(planCredits, userId);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        const payment = db.prepare('SELECT creditsGranted FROM payments WHERE stripePaymentIntentId = ?').get(paymentIntent.id);
        if (payment) {
          db.prepare('UPDATE credits SET balance = balance + ?, totalPurchased = totalPurchased + ? WHERE userId = ?')
            .run(payment.creditsGranted, payment.creditsGranted, userId);
          db.prepare('UPDATE payments SET status = ? WHERE stripePaymentIntentId = ?')
            .run('succeeded', paymentIntent.id);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DB_PATH = process.env.DB_PATH || './license.db';

// Initialize database
const db = new sqlite3(DB_PATH);
db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL,
      stripeCustomerId TEXT UNIQUE,
      stripeSubscriptionId TEXT,
      status TEXT DEFAULT 'active',
      currentPeriodStart DATETIME,
      currentPeriodEnd DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS credits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      balance REAL DEFAULT 0,
      totalPurchased REAL DEFAULT 0,
      totalUsed REAL DEFAULT 0,
      lastRefillDate DATETIME,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      licenseKey TEXT UNIQUE NOT NULL,
      productName TEXT NOT NULL,
      expiresAt DATETIME,
      activations INTEGER DEFAULT 0,
      maxActivations INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      licenseId TEXT,
      completions INTEGER DEFAULT 0,
      creditsCost REAL DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (licenseId) REFERENCES licenses(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      stripePaymentIntentId TEXT UNIQUE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'usd',
      creditsGranted REAL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
    CREATE INDEX IF NOT EXISTS idx_licenses_userId ON licenses(userId);
    CREATE INDEX IF NOT EXISTS idx_usage_userId ON usage(userId);
    CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments(userId);
  `);
}

initializeDatabase();

// Pricing tiers
const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    completionsPerDay: 50,
    creditLimit: 0,
    features: ['Basic completions', 'Community support']
  },
  starter: {
    name: 'Starter',
    price: 5,
    completionsPerMonth: 500,
    monthlyCredits: 50,
    features: ['500 completions/month', 'Email support', 'All themes']
  },
  professional: {
    name: 'Professional',
    price: 15,
    completionsPerMonth: 2000,
    monthlyCredits: 200,
    features: ['2000 completions/month', 'Priority support', 'Advanced QA', 'Voice commands']
  },
  business: {
    name: 'Business',
    price: 50,
    completionsPerMonth: 10000,
    monthlyCredits: 1000,
    features: ['10000 completions/month', '24/7 support', 'Custom models', 'Team management']
  },
  enterprise: {
    name: 'Enterprise',
    price: 'custom',
    completionsPerMonth: 'unlimited',
    monthlyCredits: 'unlimited',
    features: ['Unlimited usage', 'Dedicated support', 'Custom SLA', 'On-premise option']
  }
};

// Middleware
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const userId = generateId();
    const passwordHash = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`INSERT INTO users (id, email, passwordHash) VALUES (?, ?, ?)`);
    stmt.run(userId, email, passwordHash);

    // Initialize free tier
    const creditStmt = db.prepare(`INSERT INTO credits (id, userId, balance) VALUES (?, ?, ?)`);
    creditStmt.run(generateId(), userId, 0);

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ userId, email, token, tier: 'free' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const subscription = db.prepare('SELECT tier FROM subscriptions WHERE userId = ?').get(user.id);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      userId: user.id,
      email: user.email,
      token,
      tier: subscription?.tier || 'free'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// License verification
app.post('/api/licenses/verify', verifyToken, (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ error: 'License key required' });

    const license = db.prepare('SELECT * FROM licenses WHERE licenseKey = ? AND userId = ?').get(
      licenseKey,
      req.user.userId
    );

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    if (license.status !== 'active') {
      return res.status(403).json({ error: 'License is not active' });
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'License expired' });
    }

    res.json({
      valid: true,
      licenseKey: license.licenseKey,
      productName: license.productName,
      expiresAt: license.expiresAt,
      status: license.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pricing plans
app.get('/api/plans', (req, res) => {
  res.json(PRICING_TIERS);
});

// Subscription management
app.post('/api/subscriptions/checkout', verifyToken, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!PRICING_TIERS[tier]) return res.status(400).json({ error: 'Invalid tier' });

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.userId);
    const pricing = PRICING_TIERS[tier];

    if (tier === 'free' || tier === 'enterprise') {
      return res.status(400).json({ error: 'Cannot checkout free or enterprise tier' });
    }

    // Create or get Stripe customer
    let subscription = db.prepare('SELECT * FROM subscriptions WHERE userId = ?').get(req.user.userId);
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: req.user.userId }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ollama VS Code - ${pricing.name}`,
              description: `${pricing.completionsPerMonth} completions/month`
            },
            unit_amount: Math.round(pricing.price * 100),
            recurring: {
              interval: 'month',
              interval_count: 1
            }
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.DOMAIN || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN || 'http://localhost:3000'}/cancelled`,
      metadata: { userId: req.user.userId, tier }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Credits API
app.get('/api/credits/balance', verifyToken, (req, res) => {
  try {
    const credits = db.prepare('SELECT * FROM credits WHERE userId = ?').get(req.user.userId);
    if (!credits) return res.status(404).json({ error: 'Credits not found' });

    res.json({
      balance: credits.balance,
      totalPurchased: credits.totalPurchased,
      totalUsed: credits.totalUsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credits/purchase', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ error: 'Minimum $10 purchase' });

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.userId);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: (await stripe.customers.create({ email: user.email })).id,
      metadata: { userId: req.user.userId }
    });

    // Calculate credits (e.g., $10 = 1000 credits at $0.01 per completion)
    const creditsGranted = amount * 100;

    // Store payment record
    const paymentId = generateId();
    db.prepare(`
      INSERT INTO payments (id, userId, stripePaymentIntentId, amount, creditsGranted, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(paymentId, req.user.userId, paymentIntent.id, amount, creditsGranted, 'pending');

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      creditsWillReceive: creditsGranted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Usage tracking
app.post('/api/usage/deduct', verifyToken, (req, res) => {
  try {
    const { licenseId, completions = 1 } = req.body;
    const costPerCompletion = 0.01;
    const totalCost = completions * costPerCompletion;

    // Check credits
    const credits = db.prepare('SELECT balance FROM credits WHERE userId = ?').get(req.user.userId);
    if (credits.balance < totalCost) {
      return res.status(402).json({ error: 'Insufficient credits', required: totalCost, available: credits.balance });
    }

    // Deduct credits
    db.prepare('UPDATE credits SET balance = balance - ?, totalUsed = totalUsed + ? WHERE userId = ?')
      .run(totalCost, totalCost, req.user.userId);

    // Log usage
    const usageId = generateId();
    db.prepare(`
      INSERT INTO usage (id, userId, licenseId, completions, creditsCost)
      VALUES (?, ?, ?, ?, ?)
    `).run(usageId, req.user.userId, licenseId, completions, totalCost);

    res.json({
      success: true,
      creditsDeducted: totalCost,
      creditsRemaining: credits.balance - totalCost
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});

module.exports = app;
