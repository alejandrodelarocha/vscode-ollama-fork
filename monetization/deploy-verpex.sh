#!/bin/bash

# Deploy license server to Verpex (209.42.26.107)
# Usage: ./deploy-verpex.sh

set -e

VERPEX_IP="209.42.26.107"
VERPEX_USER="root"
VERPEX_PATH="/root/ollama-license"
PM2_NAME="ollama-license"
PORT=9979

echo "🚀 Deploying License Server to Verpex..."
echo ""

# 1. SSH and prepare
echo "1️⃣  Preparing Verpex server..."
ssh $VERPEX_USER@$VERPEX_IP << 'SSHEOF'
  set -e
  
  # Create directory
  mkdir -p /root/ollama-license
  cd /root/ollama-license
  
  # Initialize git if needed
  if [ ! -d .git ]; then
    git init
    git remote add origin https://github.com/alejandrodelarocha/vscode-ollama-fork.git
  fi
  
  # Pull latest
  git fetch origin main
  git checkout origin/main -- monetization/
  
  # Install dependencies
  cd monetization
  npm install --production
  
  echo "✅ Server prepared"
SSHEOF

# 2. Configure environment
echo ""
echo "2️⃣  Configuring environment..."
read -p "Enter STRIPE_SECRET_KEY (sk_live_...): " STRIPE_KEY
read -p "Enter STRIPE_WEBHOOK_SECRET (whsec_...): " WEBHOOK_SECRET
read -p "Enter JWT_SECRET (64+ chars, press Enter for auto-generate): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "Generated JWT_SECRET: $JWT_SECRET"
fi

ssh $VERPEX_USER@$VERPEX_IP << SSHEOF
  cat > /root/ollama-license/monetization/.env << 'ENVEOF'
PORT=$PORT
DOMAIN=https://license.rochastudios.ai
DB_PATH=/root/ollama-license.db
JWT_SECRET=$JWT_SECRET
STRIPE_SECRET_KEY=$STRIPE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_
STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET
NODE_ENV=production
ENVEOF
  
  chmod 600 /root/ollama-license/monetization/.env
  echo "✅ Environment configured"
SSHEOF

# 3. Start with PM2
echo ""
echo "3️⃣  Starting server with PM2..."
ssh $VERPEX_USER@$VERPEX_IP << SSHEOF
  cd /root/ollama-license/monetization
  
  # Install PM2 globally if needed
  npm install -g pm2 >/dev/null 2>&1 || true
  
  # Stop existing instance
  pm2 delete $PM2_NAME >/dev/null 2>&1 || true
  
  # Start server
  pm2 start license-server.js --name "$PM2_NAME" --env production
  pm2 save
  pm2 startup
  
  echo "✅ Server started with PM2"
SSHEOF

# 4. Configure Caddy
echo ""
echo "4️⃣  Configuring Caddy..."
ssh $VERPEX_USER@$VERPEX_IP << 'SSHEOF'
  # Check if Caddyfile exists
  if [ -f /root/dynamic/Caddyfile ]; then
    # Add license server config if not present
    if ! grep -q "license.rochastudios.ai" /root/dynamic/Caddyfile; then
      cat >> /root/dynamic/Caddyfile << 'CADDY'

license.rochastudios.ai {
  reverse_proxy 127.0.0.1:9979
  encode gzip
}
CADDY
      
      # Reload Caddy
      docker exec caddy caddy reload --config /etc/caddy/Caddyfile
      echo "✅ Caddy configured and reloaded"
    else
      echo "✅ Caddy already configured"
    fi
  else
    echo "⚠️  Caddyfile not found at /root/dynamic/Caddyfile"
    echo "   Manual Caddy configuration required"
  fi
SSHEOF

# 5. Verify deployment
echo ""
echo "5️⃣  Verifying deployment..."
sleep 2

STATUS=$(curl -s https://license.rochastudios.ai/api/status)
if echo "$STATUS" | grep -q "ok"; then
  echo "✅ Server is running!"
  echo "   Status: $STATUS"
else
  echo "⚠️  Server may still be starting..."
  echo "   Retry in 10 seconds: curl https://license.rochastudios.ai/api/status"
fi

# 6. Setup webhook
echo ""
echo "6️⃣  Stripe Webhook Configuration"
echo "   Go to: https://dashboard.stripe.com/webhooks"
echo "   Create endpoint:"
echo "   - URL: https://license.rochastudios.ai/api/webhooks/stripe"
echo "   - Events: checkout.session.completed, payment_intent.succeeded"
echo "   - Copy signing secret to .env STRIPE_WEBHOOK_SECRET"

# 7. Summary
echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Server Info:"
echo "   URL: https://license.rochastudios.ai"
echo "   Port: 9979 (internal)"
echo "   PM2 name: $PM2_NAME"
echo "   Database: /root/ollama-license.db"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure Stripe webhook (see above)"
echo "   2. Test signup: POST /api/auth/signup"
echo "   3. Monitor: ssh root@$VERPEX_IP 'pm2 logs $PM2_NAME'"
echo "   4. Backup DB: ssh root@$VERPEX_IP 'cp /root/ollama-license.db /root/backups/'"
echo ""
