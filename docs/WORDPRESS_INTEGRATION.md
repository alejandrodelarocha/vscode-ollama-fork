# WordPress Integration Guide

Using VS Code Ollama for WordPress development and content creation.

## Overview

VS Code Ollama accelerates WordPress development by providing:
- **AI-powered code completion** for PHP, HTML, CSS, JavaScript
- **Instant content generation** for posts, pages, and meta descriptions
- **Theme/plugin development** with intelligent code suggestions
- **Auto QA** to catch PHP errors before deployment

## Quick Start

### 1. Install VS Code Ollama
```bash
# Download and extract
unzip vscode-ollama-latest-macos.zip
./VS\ Code.app/Contents/MacOS/Electron

# Or use your existing VS Code
# Install as extension from marketplace (coming soon)
```

### 2. Configure for WordPress
```json
{
  "vscodeOllama.enabled": true,
  "vscodeOllama.host": "http://142.54.161.210",
  "vscodeOllama.port": 11434,
  "vscodeOllama.model": "qwen3:14b",
  "vscodeOllama.temperature": 0.4,
  "vscodeOllama.maxTokens": 150,
  "vscodeOllama.contextLines": 75,
  "vscodeOllama.qaEnabled": true
}
```

### 3. Open Your WordPress Project
```bash
code /path/to/wordpress
# or
code /path/to/wp-content/themes/my-theme
code /path/to/wp-content/plugins/my-plugin
```

## Use Cases

### WordPress Theme Development

**PHP Functions**
```php
// Start typing and get completions
function custom_post_type_args() {
  // Ollama suggests complete register_post_type args
  // Press Tab to accept
  return [
    'label' => 'Custom Posts',
    'public' => true,
    // ... more suggestions
  ];
}
```

**Template Tags**
```php
<?php the_post_thumbnail(); ?>
// Get suggestions for thumbnail sizes, classes, etc.

<?php get_template_part('template-parts/header');
// Ollama completes template paths from your file structure
```

**WP Hooks & Filters**
```php
add_action('wp_footer', function() {
  // Ollama suggests common footer hooks and callbacks
});

add_filter('the_content', function($content) {
  // Get filter signature, parameter suggestions
  return $content;
});
```

### WordPress Plugin Development

**Plugin Header**
```php
<?php
/**
 * Plugin Name: My Custom Plugin
 * Description: 
 * Version: 1.0
 * Author: 
 * 
 * Ollama completes standard plugin header fields
 */
```

**Admin Pages**
```php
function my_plugin_admin_menu() {
  add_menu_page(
    // Ollama auto-completes all parameters:
    // $page_title, $menu_title, $capability, 
    // $menu_slug, $function, $icon_url, $position
  );
}
```

**Settings API**
```php
register_setting('group', 'option_name', [
  // Ollama suggests all sanitize callbacks,
  // show_in_rest, type, default, etc.
]);
```

### Content Creation

**Meta Descriptions**
```
Title: "10 Best WordPress Hosting Providers"
Press Ctrl+Space after "Description:" 
→ Ollama generates SEO-optimized description
```

**Schema Markup**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  // Ollama completes all required fields
  "headline": "",
  "image": "",
  "datePublished": ""
}
</script>
```

## Code Quality (Auto QA)

### Real-Time PHP Error Detection

```php
<?php
// ❌ Ollama QA detects:
$user = get_user_by('email'); // Missing required parameter
// Shows: [ERROR] Missing required argument: $id_or_login

// ❌ Detects undefined functions:
custom_undefined_function(); 
// Shows: [WARNING] Undefined function (not hooked?)

// ❌ Detects security issues:
echo $_GET['search']; 
// Shows: [ERROR] SECURITY: Output not escaped (use esc_html)
```

### Common Issues Detected

| Issue | Severity | Auto-Fix Available |
|-------|----------|-------------------|
| Missing escaping (XSS risk) | 🔴 Error | ✅ Suggest `esc_html`, `esc_attr` |
| Undefined functions | 🟡 Warning | ❓ Suggest hooked alternatives |
| Missing sanitization | 🔴 Error | ✅ Suggest `sanitize_text_field` |
| Database without WPDB | 🔴 Error | ✅ Suggest `$wpdb->prepare` |
| Missing nonce verification | 🔴 Error | ✅ Suggest `wp_verify_nonce` |
| Hardcoded paths | 🟡 Warning | ✅ Suggest `WP_CONTENT_DIR` |
| Missing text domains | 🟡 Warning | ✅ Suggest `__()` or `_e()` |

## Configuration for Different Roles

### For Theme Developers
```json
{
  "vscodeOllama.temperature": 0.3,      // Precise suggestions
  "vscodeOllama.maxTokens": 150,        // Longer completions for CSS
  "vscodeOllama.contextLines": 100,     // More file context
  "vscodeOllama.qaEnabled": true        // Catch all PHP errors
}
```

### For Plugin Developers
```json
{
  "vscodeOllama.temperature": 0.4,      // Balanced creativity
  "vscodeOllama.maxTokens": 200,        // Support full classes
  "vscodeOllama.contextLines": 75,      // Class/namespace context
  "vscodeOllama.qaEnabled": true        // Security-critical QA
}
```

### For Content Authors
```json
{
  "vscodeOllama.temperature": 0.7,      // More creative
  "vscodeOllama.maxTokens": 300,        // Full paragraphs
  "vscodeOllama.contextLines": 50       // Post context
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` or `Cmd+Space` | Trigger completions |
| `Tab` | Accept suggestion |
| `Esc` | Dismiss suggestion |
| `Ctrl+Alt+Q` | Toggle Auto QA |
| `Cmd+Shift+P` → "Show Daily Tips" | View daily suggestions |

## Performance Tips

### Reduce Latency
```json
{
  "vscodeOllama.debounceMs": 200,    // Faster trigger
  "vscodeOllama.maxTokens": 75,      // Shorter suggestions
  "vscodeOllama.timeout": 3000       // Fail fast
}
```

### Better Accuracy for WordPress
```json
{
  "vscodeOllama.contextLines": 100,  // More context = better understanding
  "vscodeOllama.temperature": 0.2,   // More predictable WordPress patterns
  "vscodeOllama.debounceMs": 500     // More processing time
}
```

## Common WordPress Patterns

### Custom Post Types
Ollama learns and completes:
- `register_post_type()` arguments
- `add_action('init', ...)` hooks
- Taxonomy registration
- Capability definitions

### Admin Columns
```php
add_filter('manage_posts_columns', function($columns) {
  // Ollama suggests column keys and labels
  $columns['my_column'] = 'My Column';
  return $columns;
});

add_filter('manage_posts_custom_column', function($column, $post_id) {
  // Get value and format suggestions
  switch($column) {
    case 'my_column':
      echo get_post_meta($post_id, '_my_meta', true);
      break;
  }
}, 10, 2);
```

### REST API Endpoints
```php
register_rest_route('my-plugin/v1', '/posts', [
  'methods' => 'GET',
  'callback' => function($request) {
    // Ollama suggests proper response formatting
    return new WP_REST_Response([
      'success' => true,
      'data' => []
    ], 200);
  },
  'permission_callback' => function() {
    // Suggest appropriate capability checks
    return current_user_can('read');
  }
]);
```

## Troubleshooting

### "No completions for WordPress files"
```bash
# Ensure qwen3:14b is loaded
curl http://142.54.161.210:11434/api/tags

# Verify context includes WordPress files
# Check vscodeOllama.contextLines is set to 75+
```

### "QA shows false positives"
```json
{
  "vscodeOllama.qaEnabled": false  // Disable QA temporarily
  // Then: Cmd+Shift+P → "Toggle Ollama Auto QA"
}
```

### "Suggestions are generic, not WordPress-specific"
```json
{
  "vscodeOllama.temperature": 0.2,      // More deterministic
  "vscodeOllama.contextLines": 150      // Much more context
}
```

## Best Practices

### Do ✅
- Use context lines 75-150 for accurate WordPress completions
- Keep temperature 0.2-0.4 for code accuracy
- Enable QA for security-critical code (nonces, escaping)
- Review AI suggestions before committing
- Use for repetitive patterns (post types, hooks, CPT)

### Don't ❌
- Accept suggestions without understanding them
- Use high temperatures (0.8+) for code
- Ignore QA warnings about escaping/sanitization
- Trust completions for database queries (always use WPDB)
- Leave placeholder values from suggestions

## WordPress Community

Join the community for WordPress + Ollama:
- Share useful snippets and patterns
- Report WordPress-specific issues
- Suggest improvements for PHP accuracy
- Share performance configurations

**Discord/Slack:** [Link TBD]  
**GitHub Issues:** Report WordPress-specific bugs

---

**Last Updated**: 2026-05-23  
**Compatible With**: WordPress 5.0+, PHP 7.4+, VS Code 1.85+
