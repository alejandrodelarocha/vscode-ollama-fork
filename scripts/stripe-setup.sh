#!/bin/bash
set -e

echo "🚀 Ollama Stripe Setup Helper"
echo "=============================="
echo ""
echo "This script will help you configure Stripe for the Ollama license server."
echo ""

# Step 1: Get webhook secret
echo "Step 1: Create Webhook Endpoint"
echo "✓ Go to: https://dashboard.stripe.com/webhooks"
echo "✓ Click 'Add endpoint'"
echo "✓ URL: https://license.rochastudios.ai/api/webhooks/stripe"
echo "✓ Events: checkout.session.completed, payment_intent.succeeded"
echo ""
read -p "Paste your webhook signing secret (whsec_...): " WEBHOOK_SECRET

if [[ ! $WEBHOOK_SECRET =~ ^whsec_ ]]; then
  echo "❌ Invalid webhook secret format. Should start with 'whsec_'"
  exit 1
fi

# Step 2: Get API keys
echo ""
echo "Step 2: Get API Keys"
echo "✓ Go to: https://dashboard.stripe.com/apikeys"
read -p "Paste your SECRET key (sk_test_ or sk_live_): " SECRET_KEY

if [[ ! $SECRET_KEY =~ ^sk_ ]]; then
  echo "❌ Invalid secret key format. Should start with 'sk_'"
  exit 1
fi

read -p "Paste your PUBLISHABLE key (pk_test_ or pk_live_): " PUBLISHABLE_KEY

if [[ ! $PUBLISHABLE_KEY =~ ^pk_ ]]; then
  echo "❌ Invalid publishable key format. Should start with 'pk_'"
  exit 1
fi

# Step 3: Update server
echo ""
echo "Step 3: Updating Server..."
echo "Connecting to Verpex (209.42.26.107)..."

ssh root@209.42.26.107 << SSHCMD
  echo "Updating .env file..."

  # Backup current .env
  cp /root/ollama-license/monetization/.env /root/ollama-license/monetization/.env.backup

  # Update secrets
  sed -i "s|STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" /root/ollama-license/monetization/.env
  sed -i "s|STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$SECRET_KEY|" /root/ollama-license/monetization/.env
  sed -i "s|STRIPE_PUBLISHABLE_KEY=.*|STRIPE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY|" /root/ollama-license/monetization/.env

  echo "Restarting license server..."
  pm2 restart ollama-license

  echo "Waiting for server to restart..."
  sleep 3

  echo "Checking server status..."
  pm2 status ollama-license
SSHCMD

echo ""
echo "✅ Stripe configuration complete!"
echo ""
echo "Next steps:"
echo "1. Test the webhook:"
echo "   Go to https://dashboard.stripe.com/webhooks"
echo "   Select your endpoint → 'Send test event'"
echo "   Expected: 200 OK"
echo ""
echo "2. Test end-to-end flow:"
echo "   Sign up at https://license.rochastudios.ai/auth"
echo "   Get license token from dashboard"
echo "   Test payment with test card: 4242 4242 4242 4242"
echo ""
echo "3. When ready for live mode:"
echo "   - Switch Stripe to live mode"
echo "   - Get live keys (sk_live_, pk_live_)"
echo "   - Run this script again with live keys"
echo ""
