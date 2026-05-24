# Ollama VS Code - Complete Deployment Checklist

## Phase 1: Landing Pages (Cloudflare Pages)

- [ ] **Verify GitHub is up to date**
  ```bash
  git status
  git push origin main
  ```

- [ ] **Setup Cloudflare Pages**
  - Go to https://dash.cloudflare.com → Pages
  - Create project → Connect to Git
  - Select: alejandrodelarocha/vscode-ollama-fork
  - Branch: main
  - Build command: (empty)
  - Output directory: landing
  - Deploy

- [ ] **Verify landing pages load**
  ```bash
  curl https://YOUR-PROJECT.pages.dev/ollama/
  curl https://YOUR-PROJECT.pages.dev/wpbasic/
  curl https://YOUR-PROJECT.pages.dev/download/
  curl https://YOUR-PROJECT.pages.dev/setup/
  ```

- [ ] **Configure custom domains**
  - Add CNAME records at Name.com:
    - ollama → pages.pages.dev
    - wpbasic → pages.pages.dev
    - download → pages.pages.dev
    - setup → pages.pages.dev

- [ ] **Test custom domains**
  ```bash
  curl https://ollama.rochastudios.ai
  curl https://wpbasic.rochastudios.ai
  ```

## Phase 2: License Server (Verpex)

- [ ] **Prepare deployment**
  ```bash
  cd monetization
  ./deploy-verpex.sh
  ```
  When prompted:
  - STRIPE_SECRET_KEY: sk_live_... (from Stripe Dashboard)
  - STRIPE_WEBHOOK_SECRET: (leave empty for now)
  - JWT_SECRET: Press Enter to auto-generate

- [ ] **Verify server is running**
  ```bash
  curl https://license.rochastudios.ai/api/status
  # Should return: {"status":"ok","version":"1.0.0"}
  ```

- [ ] **Monitor deployment**
  ```bash
  ssh root@209.42.26.107 'pm2 logs ollama-license'
  ```

- [ ] **Setup Stripe webhook**
  1. Go to https://dashboard.stripe.com/webhooks
  2. Click "Add endpoint"
  3. URL: https://license.rochastudios.ai/api/webhooks/stripe
  4. Events:
     - checkout.session.completed
     - payment_intent.succeeded
  5. Copy signing secret
  6. SSH to server and update .env:
     ```bash
     ssh root@209.42.26.107
     nano /root/ollama-license/monetization/.env
     # Paste: STRIPE_WEBHOOK_SECRET=whsec_...
     pm2 restart ollama-license
     ```

- [ ] **Create pricing page**
  - Create `/landing/pricing/index.html`
  - Include: Plan cards, Stripe checkout links, FAQ
  - Deploy via Cloudflare Pages (auto-deploys on git push)

## Phase 3: VS Code Extension Integration

- [ ] **Update extension to use license server**
  Edit `src/vs/editor/contrib/ollama/extension.ts`:
  ```typescript
  // Add license verification
  async function verifyLicense() {
    const token = vscode.workspace.getConfiguration('vscodeOllama').get('licenseToken');
    const response = await fetch('https://license.rochastudios.ai/api/licenses/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ licenseKey: licenseKey })
    });
    return response.json();
  }

  // On completion, deduct credits
  async function deductCredits(completions = 1) {
    const response = await fetch('https://license.rochastudios.ai/api/usage/deduct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completions })
    });
    
    if (response.status === 402) {
      vscode.window.showInformationMessage('Insufficient credits. Purchase more?', 'Go to Pricing')
        .then(choice => {
          if (choice === 'Go to Pricing') {
            vscode.env.openExternal(vscode.Uri.parse('https://rochastudios.ai/pricing'));
          }
        });
    }
    return response.json();
  }
  ```

- [ ] **Add license settings to package.json**
  ```json
  "vscodeOllama.licenseServer": {
    "type": "string",
    "default": "https://license.rochastudios.ai",
    "description": "License server URL"
  },
  "vscodeOllama.licenseToken": {
    "type": "string",
    "description": "JWT token from license server"
  }
  ```

- [ ] **Recompile and test**
  ```bash
  npm run compile
  # Test with: npm test
  ```

## Phase 4: Create Pricing/Signup Page

- [ ] **Create `/landing/pricing/index.html`**
  Include:
  - 5 pricing tiers (Free, Starter, Professional, Business, Enterprise)
  - Feature comparison table
  - Stripe Checkout integration
  - FAQ section
  - Contact form for enterprise

- [ ] **Add signup flow**
  - Create `/landing/auth/signup.html`
  - Form posts to: https://license.rochastudios.ai/api/auth/signup
  - Stores token in localStorage
  - Redirects to dashboard

- [ ] **Create dashboard**
  - `/landing/dashboard/index.html`
  - Display: License key, credits balance, usage stats
  - Purchase credits form
  - Account settings

## Phase 5: Testing

- [ ] **Test signup flow**
  ```bash
  curl -X POST https://license.rochastudios.ai/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
  ```

- [ ] **Test license verification**
  ```bash
  curl -X POST https://license.rochastudios.ai/api/licenses/verify \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"licenseKey":"OLLAMA-xxxxx"}'
  ```

- [ ] **Test credit deduction**
  ```bash
  curl -X POST https://license.rochastudios.ai/api/usage/deduct \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"completions":1}'
  ```

- [ ] **Test Stripe checkout** (use test card: 4242 4242 4242 4242)

- [ ] **Test VS Code extension**
  - Install locally: F5 → "Run Extension"
  - Verify completions work
  - Check license token is verified

## Phase 6: Launch

- [ ] **Create ProductHunt post**
  - Title: "Ollama VS Code - Private AI Code Completion with Voice"
  - Description: 13 themes, voice commands, 9 pricing tiers
  - Screenshot: VS Code with Ollama completion
  - GIF: Voice command demo
  - Link: https://ollama.rochastudios.ai

- [ ] **Post on GitHub**
  - Tag: awesome-vscode, awesome-ollama
  - Link: https://github.com/alejandrodelarocha/vscode-ollama-fork

- [ ] **Post on Reddit**
  - r/vscode
  - r/ollama
  - r/programming
  - r/webdev

- [ ] **Share on Twitter**
  - Highlight: Local AI, voice input, free tier
  - Link landing page

- [ ] **Add to awesome lists**
  - awesome-vscode
  - awesome-ollama
  - awesome-local-llm

## Phase 7: Monitoring & Support

- [ ] **Setup monitoring**
  ```bash
  ssh root@209.42.26.107 'pm2 monit ollama-license'
  ```

- [ ] **Enable database backups**
  ```bash
  ssh root@209.42.26.107
  # Add daily cron backup
  0 2 * * * cp /root/ollama-license.db /root/backups/license-$(date +\%Y\%m\%d).db
  ```

- [ ] **Setup email notifications**
  - Monitor for failed payments
  - Alert on quota exceeded
  - Monthly usage reports

- [ ] **Create support docs**
  - FAQ page
  - Troubleshooting guide
  - License activation help

## Rollback Plan

If issues occur:

**Landing Pages:** Automatic rollback to previous deployment
```bash
Cloudflare Dashboard → Pages → Deployments → Rollback
```

**License Server:** Revert to previous version
```bash
ssh root@209.42.26.107
pm2 restart ollama-license  # If config issue
# Or:
git revert HEAD~1 && npm install
```

**VS Code Extension:** Users can downgrade to previous version

## Timeline

- **Phase 1 (Landing):** 30 minutes
- **Phase 2 (License Server):** 30 minutes
- **Phase 3 (VS Code Integration):** 1-2 hours
- **Phase 4 (Pricing Page):** 1 hour
- **Phase 5 (Testing):** 1-2 hours
- **Phase 6 (Launch):** 2-3 hours
- **Phase 7 (Monitoring):** Ongoing

**Total:** 6-8 hours to full deployment

## Success Criteria

✅ Landing pages accessible at rochastudios.ai/*  
✅ License server responds at license.rochastudios.ai  
✅ Stripe webhook receiving payment events  
✅ VS Code extension verifies licenses  
✅ Users can purchase credits  
✅ First 10 users onboarded  
✅ Zero critical bugs in first week  

---

**Created:** May 2026  
**Status:** Ready for full deployment
