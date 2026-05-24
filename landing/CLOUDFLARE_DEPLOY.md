# Deploy Landing Pages to Cloudflare Pages

## Option 1: Git Integration (Recommended)

1. **Ensure GitHub repo is up to date**
   ```bash
   git push origin main
   ```

2. **Go to Cloudflare Dashboard**
   - https://dash.cloudflare.com
   - Pages → Create a project → Connect to Git

3. **Select Repository**
   - Account: alejandrodelarocha
   - Repository: vscode-ollama-fork
   - Branch: main

4. **Configure Build**
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `landing`

5. **Add Environment Variables**
   - None needed (static site)

6. **Deploy**
   - Click "Save and Deploy"
   - Wait for build to complete (~1-2 minutes)

7. **Custom Domain Setup**
   
   For `rochastudios.ai/ollama`:
   ```
   Cloudflare Pages > Custom domains > Add domain
   → ollama.rochastudios.ai
   → Update DNS records as instructed
   ```

   For `rochastudios.ai/wpbasic`:
   ```
   → wpbasic.rochastudios.ai
   ```

## Option 2: Using wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Deploy**
   ```bash
   cd landing
   wrangler pages deploy . --project-name ollama-landing
   ```

3. **Get URL**
   - Pages → ollama-landing → Deployments
   - Copy production URL

## Routing

Cloudflare automatically serves:
- `/ollama/index.html` → `/ollama`
- `/wpbasic/index.html` → `/wpbasic`
- `/download/index.html` → `/download`
- `/setup/index.html` → `/setup`

## DNS Configuration

Add to your domain registrar (Name.com):

```
CNAME    ollama        pages.pages.dev
CNAME    wpbasic       pages.pages.dev
CNAME    download      pages.pages.dev
CNAME    setup         pages.pages.dev
```

Or use Cloudflare nameservers if already hosted.

## Verification

```bash
curl https://ollama.rochastudios.ai
curl https://wpbasic.rochastudios.ai
curl https://download.rochastudios.ai
curl https://setup.rochastudios.ai
```

Should return HTML (200 status).

## Updates

Changes to `landing/` automatically deploy when pushed to main:
- Git push → GitHub detects change → Cloudflare auto-deploys → Live in ~2 min

## Status

Check deployment status:
- Cloudflare Dashboard → Pages → ollama-landing → Deployments
- GitHub Actions → Check build logs

---

**Cost:** Free tier includes:
- Unlimited deployments
- Unlimited bandwidth
- Custom domains
- SSL/TLS included
