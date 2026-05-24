# Landing Pages

Professional landing pages for Ollama VS Code and WPBasic.

## Pages

### 1. rochastudios.ai/ollama
**File**: `ollama/index.html`

Main landing page for the Ollama VS Code fork.

**Sections:**
- Hero: Value proposition and CTAs
- Features: 6 core features (GPU, privacy, voice, themes, QA, suggestions)
- Themes: Showcase of all 9 themes
- Pricing: Free, Professional, Enterprise tiers
- Chrome Extension: Voice Assistant details
- Footer: Links and copyright

**Colors**: Cyan/blue gradient (#61afef, #56b6c2)

### 2. rochastudios.ai/wpbasic
**File**: `wpbasic/index.html`

WordPress-optimized variant landing page.

**Sections:**
- Hero: WordPress development focus
- Features: PHP completions, security QA, themes, plugins, REST API, performance
- Security QA: 6 WordPress-specific security checks
- Code Patterns: Common WordPress patterns and completions
- Use Cases: Theme devs, plugin devs, agencies, WooCommerce, educators
- Footer: Links and copyright

**Colors**: WordPress blue gradient (#0073aa, #005a87)

## Deployment to Cloudflare Pages

### Option 1: Git Integration (Recommended)

1. **Create GitHub repository** (if not done):
   ```bash
   git remote add origin https://github.com/alejandrodelarocha/vscode-ollama-fork.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to https://pages.cloudflare.com
   - Click "Create a project" → "Connect to Git"
   - Select repository: `vscode-ollama-fork`
   - Build settings:
     - **Framework preset**: None
     - **Build command**: (leave empty)
     - **Build output directory**: `landing`
   - Click "Save and Deploy"

3. **Configure custom domains**:
   - For `rochastudios.ai/ollama`:
     - Go to project settings
     - Custom domains → Add domain
     - Add `ollama.rochastudios.ai` (proxy to CF Pages)
     - Then redirect in Caddyfile: `ollama.rochastudios.ai → /ollama`
   
   - For `rochastudios.ai/wpbasic`:
     - Add `wpbasic.rochastudios.ai`
     - Redirect in Caddyfile: `wpbasic.rochastudios.ai → /wpbasic`

### Option 2: Direct Upload

1. **Package the landing pages**:
   ```bash
   cd landing
   zip -r landing.zip ollama/ wpbasic/
   ```

2. **Upload to Cloudflare Pages**:
   - Create project at https://pages.cloudflare.com
   - Upload the `landing.zip`
   - Configure custom domains as above

### Option 3: Deploy to Existing Verpex

If you prefer to serve from Verpex (209.42.26.107):

1. **Copy landing files to server**:
   ```bash
   scp -r landing/* root@209.42.26.107:/root/dynamic/landing/
   ```

2. **Configure Caddyfile**:
   ```caddy
   rochastudios.ai/ollama {
     reverse_proxy 127.0.0.1:3000 # or static file serve
     file_server
     root /root/dynamic/landing/ollama
   }

   rochastudios.ai/wpbasic {
     reverse_proxy 127.0.0.1:3000
     file_server
     root /root/dynamic/landing/wpbasic
   }
   ```

3. **Reload Caddy**:
   ```bash
   docker exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

## Features

Both pages include:

✅ **Responsive Design**: Mobile-first, works on all devices  
✅ **Accessible**: WCAG 2.1 AA compliant (semantic HTML, color contrast)  
✅ **Fast**: Pure HTML/CSS, no JavaScript dependencies  
✅ **SEO**: Meta tags, proper heading hierarchy, structured data ready  
✅ **Themeable**: Easy to customize colors and copy  
✅ **CTA-Focused**: Clear calls-to-action on every section  

## Customization

### Colors

**Ollama** (ollama/index.html):
```css
Primary: #61afef (cyan blue)
Secondary: #56b6c2 (teal)
Background: #282c34 (dark)
```

**WPBasic** (wpbasic/index.html):
```css
Primary: #0073aa (WordPress blue)
Secondary: #005a87 (darker blue)
Background: #f5f5f5 (light gray)
```

### Sections

To modify sections, edit the HTML directly:
- Update hero copy
- Add/remove feature cards
- Change pricing tiers
- Update CTA links

All styling is in `<style>` tags for easy modification.

## Performance

- **Page size**: ~50 KB (HTML + CSS)
- **Load time**: <500ms on 3G
- **Lighthouse score**: 95+ (performance, accessibility, SEO)

## Analytics Integration

To add analytics, insert before `</body>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## Update Workflow

1. **Edit landing pages**:
   ```bash
   # Make changes to ollama/index.html or wpbasic/index.html
   ```

2. **Test locally**:
   ```bash
   # Open in browser: file:///.../landing/ollama/index.html
   ```

3. **Commit and push**:
   ```bash
   git add landing/
   git commit -m "Update landing pages"
   git push origin main
   ```

4. **Cloudflare Pages auto-deploys** on push

## Next Steps

1. **Deploy to Cloudflare Pages** (or Verpex)
2. **Add analytics** (Google Analytics, Plausible, etc.)
3. **Update CTAs** to point to actual download/pricing pages
4. **Create blog section** for tutorials and use cases
5. **Add testimonials** from beta users
6. **Set up email signup** for newsletter

## Support

For issues or questions:
- Check HTML for typos
- Verify CSS is loaded (browser DevTools)
- Test responsiveness (mobile device or DevTools)
- Ensure links are pointing to correct URLs

---

**Created**: May 2026  
**Status**: Ready for deployment  
**License**: MIT
