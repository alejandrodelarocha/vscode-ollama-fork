# WPBasic - WordPress AI Development

**AI-powered code completion optimized for WordPress theme & plugin development**

Uses local Ollama (qwen3:14b) on GPU for instant, private WordPress code suggestions.

## What is WPBasic?

WPBasic is a specialized VS Code distribution pre-configured for WordPress developers:

- ✨ **AI Code Completion** — WordPress-aware suggestions for PHP, hooks, template tags
- 🔒 **Security-Focused QA** — Auto-detects escaping, sanitization, XSS risks
- 🚀 **GPU-Accelerated** — Sub-second completions on dedicated GPU server
- 📝 **WordPress Patterns** — Understands CPTs, taxonomies, REST APIs, admin hooks
- 💡 **Daily Tips** — WordPress development tricks and best practices
- 🎯 **Zero Setup** — Pre-configured for WordPress out of the box

## Quick Start

### 1. Install WPBasic

**macOS:**
```bash
unzip wpbasic-latest-macos.zip
./wpbasic/VS\ Code\ Ollama.app/Contents/MacOS/Electron
```

**Linux:**
```bash
tar -xzf wpbasic-latest-linux.tar.gz
./wpbasic/code
```

**Windows:**
```cmd
REM Extract wpbasic-latest-windows.zip, then:
cd wpbasic
code.bat
```

### 2. Point to Your WordPress Project

```bash
# Theme development
code /path/to/wp-content/themes/my-theme

# Plugin development
code /path/to/wp-content/plugins/my-plugin

# Full WordPress install
code /path/to/wordpress
```

### 3. Start Coding

Begin typing PHP and get instant WordPress-aware completions:

```php
<?php
// Type "add_action" → Get hook suggestions + callback signature
add_action('wp_footer', function() {
  // Completions understand WordPress context
});

// Type "register_post_type" → Get full CPT args with descriptions
register_post_type('book', [
  // Pre-filled with common options
]);
```

## WordPress-Specific Features

### PHP & Hooks

```php
// WordPress hook completions
add_filter('the_content', function($content) {
  // Ollama suggests proper return types, parameters
  return $content;
});

// Custom post types
register_post_type('portfolio', [
  'label' => 'Portfolio Items',
  'public' => true,
  // Full suggestions for all CPT arguments
]);

// Taxonomy registration
register_taxonomy('skill', 'portfolio', [
  // Complete taxonomy options
]);
```

### Admin Pages & Settings

```php
// Admin menu with full parameter suggestions
add_menu_page(
  __('Settings', 'my-theme'),
  __('My Settings', 'my-theme'),
  'manage_options',
  'my-settings',
  'render_settings_page'
);

// Settings API
register_setting('my-group', 'my_option', [
  'sanitize_callback' => 'sanitize_text_field',
  'type' => 'string',
  'default' => ''
]);
```

### REST API

```php
// REST endpoint with security checks
register_rest_route('my-plugin/v1', '/data', [
  'methods' => 'GET',
  'callback' => function($request) {
    // Ollama suggests proper auth checks
    if (!current_user_can('read')) {
      return new WP_Error('forbidden', 'Access denied', ['status' => 403]);
    }
    return rest_ensure_response([]);
  }
]);
```

### Template Development

```php
<?php
// Template tag completions
the_post_thumbnail('large', ['class' => 'featured-image']);

// Get suggestions for:
get_template_part('template-parts/header');
get_post_meta($post_id, '_key', true);
wp_localize_script('script-handle', 'obj', []);
?>
```

## Security QA - WordPress Edition

### Real-Time Security Checks

WPBasic detects and highlights:

| Issue | Detection | Fix Suggestion |
|-------|-----------|----------------|
| **Unescaped Output** | `echo $_GET['x']` | Use `esc_html()`, `esc_attr()`, `wp_kses_post()` |
| **Unsanitized Input** | `$_POST['data']` | Use `sanitize_text_field()`, `sanitize_email()` |
| **Missing Nonces** | `$_POST` without nonce check | Suggest `wp_verify_nonce()` |
| **Direct DB Queries** | `$wpdb->query()` | Suggest `$wpdb->prepare()` with placeholders |
| **Undefined Functions** | Using non-existent hooks | Suggest hooked alternatives |
| **Security Issues** | SQL injection risks | Highlight vulnerable patterns |

### Example QA in Action

```php
<?php
// ❌ WPBasic highlights security issues:
echo $_GET['search'];
// Error: [SECURITY] Output not escaped. Use: esc_html($_GET['search'])

$_POST['email'];
// Error: [SECURITY] Input not sanitized. Use: sanitize_email($_POST['email'])

$wpdb->query("SELECT * FROM wp_posts WHERE ID = " . $_GET['id']);
// Error: [SQL_INJECTION] Unsafe query. Use: $wpdb->prepare()

// ✅ Correct patterns:
echo esc_html($_GET['search']);
$email = sanitize_email($_POST['email']);
$wpdb->get_results($wpdb->prepare("SELECT * FROM wp_posts WHERE ID = %d", $post_id));
```

## Configuration

### Pre-Optimized for WordPress

Default settings are optimized for WordPress development:

```json
{
  "wpbasic.enabled": true,
  "wpbasic.model": "qwen3:14b",
  "wpbasic.temperature": 0.3,        // Precise PHP suggestions
  "wpbasic.maxTokens": 120,          // Good for PHP functions
  "wpbasic.contextLines": 100,       // WordPress class/namespace context
  "wpbasic.qaSecurityFocus": true    // Security-first QA
}
```

### Adjust for Your Workflow

```json
{
  // Faster completions (trade accuracy)
  "wpbasic.temperature": 0.5,
  "wpbasic.maxTokens": 75,
  
  // Slower but more accurate
  "wpbasic.temperature": 0.1,
  "wpbasic.contextLines": 150,
  
  // Content creation (more creative)
  "wpbasic.temperature": 0.7
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` or `Cmd+Space` | Trigger AI completion |
| `Tab` | Accept suggestion |
| `Esc` | Dismiss suggestion |
| `Cmd+Shift+P` → "WPBasic: Show Daily Tips" | View WordPress tips |
| `Cmd+Shift+P` → "WPBasic: Toggle Code Quality Analysis" | Toggle security checks |

## Daily WordPress Tips

Get 5 WordPress development tips daily:

- 📚 WordPress hooks and filters
- 🔒 Security best practices
- ⚡ Performance optimization
- 🎨 Theme development patterns
- 🔌 Plugin architecture tips

Enable/disable in settings:
```json
{
  "wpbasic.showDailySuggestions": true
}
```

## Common WordPress Patterns

### Custom Post Type + Taxonomy

```php
<?php
// WPBasic completes entire CPT setup
add_action('init', function() {
  register_post_type('project', [
    'label' => 'Projects',
    'public' => true,
    'menu_icon' => 'dashicons-briefcase',
    'supports' => ['title', 'editor', 'thumbnail'],
    // Full suggestions for all arguments
  ]);
  
  register_taxonomy('project_category', 'project', [
    'label' => 'Categories',
    'hierarchical' => true,
    // Complete taxonomy options
  ]);
});
```

### Admin Settings Page

```php
<?php
// WPBasic suggests complete settings implementation
add_action('admin_menu', function() {
  add_options_page(
    __('My Plugin Settings', 'my-plugin'),
    __('My Plugin', 'my-plugin'),
    'manage_options',
    'my-plugin-settings',
    'render_settings_page'
  );
});

function render_settings_page() {
  ?>
  <div class="wrap">
    <h1><?php esc_html_e('My Plugin Settings', 'my-plugin'); ?></h1>
    <form method="post" action="options.php">
      <?php settings_fields('my-plugin-group'); ?>
      <?php do_settings_sections('my-plugin-settings'); ?>
      <?php submit_button(); ?>
    </form>
  </div>
  <?php
}
```

## Performance Tips

### For Slow Networks

```json
{
  "wpbasic.debounceMs": 500,
  "wpbasic.maxTokens": 50,
  "wpbasic.temperature": 0.1
}
```

### For WordPress Files

```json
{
  "wpbasic.contextLines": 150,      // More context = better PHP understanding
  "wpbasic.temperature": 0.2,       // WordPress patterns are deterministic
  "wpbasic.debounceMs": 400         // Allow processing time
}
```

## Troubleshooting

### "No completions for my plugin"

```bash
# Check Ollama is accessible
curl http://142.54.161.210:11434/api/tags

# Check model is loaded
ollama list | grep qwen3:14b

# Verify WPBasic settings
# Command Palette → "WPBasic: Check GPU Server Status"
```

### "QA is too strict / too lenient"

```json
{
  // More relaxed (fewer warnings)
  "wpbasic.qaSecurityFocus": false,
  
  // Stricter (more security warnings)
  "wpbasic.qaSecurityFocus": true
}
```

### "Completions don't understand WordPress"

```json
{
  // Increase context for WordPress understanding
  "wpbasic.contextLines": 150,
  
  // Lower temperature for more WordPress patterns
  "wpbasic.temperature": 0.2
}
```

## System Requirements

- **VS Code**: 1.85+
- **OS**: macOS 10.15+, Linux (Ubuntu 18.04+), Windows 10+
- **Network**: Access to GPU server at 142.54.161.210:11434
- **RAM**: 2GB minimum, 4GB+ recommended
- **PHP Knowledge**: Helpful but not required

## Support & Community

- 📖 Full Documentation: [docs/WORDPRESS_INTEGRATION.md](../docs/WORDPRESS_INTEGRATION.md)
- 🐛 Report Issues: [GitHub Issues](https://github.com/alejandrodelarocha/vscode-ollama-fork/issues)
- 💬 Discuss: [GitHub Discussions](https://github.com/alejandrodelarocha/vscode-ollama-fork/discussions)
- 🚀 Suggest Features: [Feature Requests](https://github.com/alejandrodelarocha/vscode-ollama-fork/issues/new)

## License

MIT (same as VS Code)

---

**Ready to develop WordPress with AI?**

[Download Latest](https://releases.rochastudios.ai/wpbasic/) • [View Docs](../docs/WORDPRESS_INTEGRATION.md) • [GitHub](https://github.com/alejandrodelarocha/vscode-ollama-fork)

Made for WordPress developers who want private, fast, GPU-powered code completion.
