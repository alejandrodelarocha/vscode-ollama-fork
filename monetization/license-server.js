/**
 * VS Code Ollama License & Credit Server
 * Handles subscription management, license verification, credit tracking
 */

const express = require('express');
const Stripe = require('stripe');
const sqlite3 = require('better-sqlite3');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 9979;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const DB_PATH = process.env.DB_PATH || './licenses.db';

const stripe = new Stripe(STRIPE_KEY);
const db = new sqlite3(DB_PATH);

// ============================================================================
// Database Setup
// ============================================================================

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      tier TEXT DEFAULT 'free',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      stripe_customer_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_subscription_id TEXT UNIQUE,
      tier TEXT NOT NULL,
      monthly_credits INTEGER,
      billing_cycle_start DATETIME,
      billing_cycle_end DATETIME,
      status TEXT DEFAULT 'active',
      auto_renew BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS credits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance INTEGER NOT NULL,
      source TEXT, -- 'subscription', 'purchase', 'promotion'
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      credits_used INTEGER,
      completions_count INTEGER,
      qa_checks_count INTEGER,
      date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      license_key TEXT UNIQUE NOT NULL,
      product TEXT, -- 'vscode-ollama', 'wpbasic'
      type TEXT, -- 'freemium', 'subscription', 'enterprise'
      tier TEXT,
      max_activations INTEGER DEFAULT 1,
      activations INTEGER DEFAULT 0,
      expires_at DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_credits_user ON credits(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
  `);
  console.log('Database initialized');
}

// ============================================================================
// Authentication
// ============================================================================

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
};

// ============================================================================
// Authentication Routes
// ============================================================================

// Sign up / Create account
app.post('/auth/signup', async (req, res) => {
  const { email, name, product } = req.body;

  try {
    // Check if user exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { product }
    });

    // Create user
    const userId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, name, stripe_customer_id, tier)
      VALUES (?, ?, ?, ?, 'free')
    `).run(userId, email, name, customer.id);

    // Generate license key for free tier
    const licenseKey = generateLicenseKey();
    db.prepare(`
      INSERT INTO licenses (id, user_id, license_key, product, type, tier)
      VALUES (?, ?, ?, ?, 'freemium', 'free')
    `).run(crypto.randomUUID(), userId, licenseKey, product);

    const token = generateToken(userId);

    res.json({
      userId,
      email,
      tier: 'free',
      token,
      licenseKey,
      message: 'Welcome to VS Code Ollama!'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In production, verify password hash
    const token = generateToken(user.id);

    res.json({
      userId: user.id,
      email: user.email,
      tier: user.tier,
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================================================
// License Routes
// ============================================================================

// Verify license key
app.post('/license/verify', (req, res) => {
  const { licenseKey, product } = req.body;

  try {
    const license = db.prepare(`
      SELECT l.*, u.tier, u.status FROM licenses l
      JOIN users u ON l.user_id = u.id
      WHERE l.license_key = ? AND l.product = ?
    `).get(licenseKey, product);

    if (!license) {
      return res.status(404).json({ error: 'Invalid license key' });
    }

    if (license.status !== 'active') {
      return res.status(403).json({ error: 'License not active' });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(403).json({ error: 'License expired' });
    }

    if (license.activations >= license.max_activations) {
      return res.status(403).json({ error: 'Max activations reached' });
    }

    // Increment activations
    db.prepare('UPDATE licenses SET activations = activations + 1 WHERE id = ?')
      .run(license.id);

    res.json({
      valid: true,
      tier: license.tier,
      product: license.product,
      expiresAt: license.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================================================
// Subscription Routes
// ============================================================================

// Get subscription options
app.get('/subscriptions/plans', (req, res) => {
  const plans = {
    starter: {
      priceId: 'price_starter',
      name: 'Starter',
      price: 5,
      monthlyCredits: 500,
      features: ['500 completions/month', 'Unlimited workspaces', '4 themes']
    },
    professional: {
      priceId: 'price_pro',
      name: 'Professional',
      price: 15,
      monthlyCredits: 2000,
      features: ['2,000 completions/month', 'Team collaboration (3)', 'API access']
    },
    business: {
      priceId: 'price_business',
      name: 'Business',
      price: 50,
      monthlyCredits: 10000,
      features: ['10,000 completions/month', 'Unlimited team', 'Custom models']
    }
  };

  res.json(plans);
});

// Create subscription checkout session
app.post('/subscriptions/checkout', authMiddleware, async (req, res) => {
  const { tier } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    const priceMap = {
      starter: 'price_starter',
      professional: 'price_pro',
      business: 'price_business'
    };

    const session = await stripe.checkout.sessions.create({
      customer: user.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceMap[tier],
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: req.userId,
        tier
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Handle Stripe webhook
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const userId = subscription.metadata.userId;
    const tier = subscription.metadata.tier;

    // Store subscription
    db.prepare(`
      INSERT OR REPLACE INTO subscriptions
      (id, user_id, stripe_subscription_id, tier, monthly_credits, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(
      crypto.randomUUID(),
      userId,
      subscription.id,
      tier,
      getTierCredits(tier)
    );

    // Update user tier
    db.prepare('UPDATE users SET tier = ? WHERE id = ?').run(tier, userId);

    // Add credits for new billing cycle
    addMonthlyCredits(userId, getTierCredits(tier));
  }

  res.json({ received: true });
});

// ============================================================================
// Credits Routes
// ============================================================================

// Get user credits
app.get('/credits/balance', authMiddleware, (req, res) => {
  const credits = db.prepare(`
    SELECT SUM(balance) as total FROM credits
    WHERE user_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `).get(req.userId);

  const usage = db.prepare(`
    SELECT SUM(credits_used) as total FROM usage
    WHERE user_id = ? AND date >= date('now', '-30 days')
  `).get(req.userId);

  res.json({
    balance: credits.total || 0,
    usedThisMonth: usage.total || 0
  });
});

// Use credits (deduct for completion)
app.post('/credits/use', authMiddleware, (req, res) => {
  const { amount, type } = req.body; // type: 'completion', 'qa'

  try {
    const balance = db.prepare(`
      SELECT SUM(balance) as total FROM credits
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `).get(req.userId);

    if (!balance.total || balance.total < amount) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Deduct credits (use oldest first)
    const credits = db.prepare(`
      SELECT * FROM credits
      WHERE user_id = ? AND balance > 0
      ORDER BY expires_at ASC, created_at ASC
    `).all(req.userId);

    let remaining = amount;
    for (const credit of credits) {
      const deduct = Math.min(credit.balance, remaining);
      db.prepare('UPDATE credits SET balance = balance - ? WHERE id = ?')
        .run(deduct, credit.id);
      remaining -= deduct;
      if (remaining === 0) break;
    }

    // Log usage
    db.prepare(`
      INSERT OR REPLACE INTO usage (id, user_id, credits_used, ${type}_count)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET credits_used = credits_used + ?, ${type}_count = ${type}_count + 1
    `).run(
      `${req.userId}-${new Date().toISOString().split('T')[0]}`,
      req.userId,
      amount,
      1,
      amount
    );

    res.json({ success: true, creditsUsed: amount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to use credits' });
  }
});

// Purchase additional credits
app.post('/credits/purchase', authMiddleware, async (req, res) => {
  const { creditAmount } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    const price = creditAmount * 0.01; // $0.01 per credit

    const session = await stripe.checkout.sessions.create({
      customer: user.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${creditAmount} Credits`
          },
          unit_amount: Math.round(price * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/credits/success`,
      cancel_url: `${process.env.FRONTEND_URL}/credits/cancel`,
      metadata: {
        userId: req.userId,
        creditAmount
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function getTierCredits(tier) {
  const tierCredits = {
    free: 50,
    starter: 500,
    professional: 2000,
    business: 10000
  };
  return tierCredits[tier] || 0;
}

function generateLicenseKey() {
  return 'LL-' + crypto.randomBytes(16).toString('hex').toUpperCase().slice(0, 24);
}

function addMonthlyCredits(userId, amount) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3); // Expire in 3 months

  db.prepare(`
    INSERT INTO credits (id, user_id, amount, balance, source, expires_at)
    VALUES (?, ?, ?, ?, 'subscription', ?)
  `).run(
    crypto.randomUUID(),
    userId,
    amount,
    amount,
    expiresAt.toISOString()
  );
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VS Code Ollama License Server'
  });
});

// ============================================================================
// Startup
// ============================================================================

initializeDatabase();

app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /auth/signup');
  console.log('  POST /auth/login');
  console.log('  POST /license/verify');
  console.log('  GET  /subscriptions/plans');
  console.log('  POST /subscriptions/checkout');
  console.log('  GET  /credits/balance');
  console.log('  POST /credits/use');
  console.log('  POST /credits/purchase');
});

module.exports = app;
