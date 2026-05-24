const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ROCHA_SCRAPER_URL = 'http://localhost:9865';
const THEMES_DIR = path.join(__dirname, '../themes');

// Search for MIT-licensed VS Code themes on GitHub
async function findMITThemes() {
  console.log('🔍 Searching for MIT-licensed VS Code themes...');

  const queries = [
    'vscode theme MIT license json',
    'vscode color theme github MIT',
    'VS Code theme extension MIT',
    'vscode dark theme open source'
  ];

  let themes = [];

  for (const query of queries) {
    try {
      console.log(`  Searching: "${query}"`);
      
      const response = await axios.post(`${ROCHA_SCRAPER_URL}/api/search`, {
        query: query,
        filters: {
          license: 'MIT',
          fileType: 'json',
          organization: 'github'
        },
        limit: 20
      });

      if (response.data.results) {
        themes = themes.concat(response.data.results);
      }
    } catch (err) {
      console.warn(`  ⚠️  Search failed: ${err.message}`);
    }
  }

  return themes;
}

// Extract theme from GitHub raw file
async function extractTheme(githubUrl) {
  try {
    console.log(`  📥 Extracting: ${githubUrl}`);
    
    const response = await axios.post(`${ROCHA_SCRAPER_URL}/api/extract`, {
      url: githubUrl,
      format: 'json',
      proxyType: 'webshare'
    });

    return response.data.content;
  } catch (err) {
    console.warn(`    ⚠️  Extraction failed: ${err.message}`);
    return null;
  }
}

// Validate VS Code theme format
function validateTheme(theme) {
  if (!theme.name || !theme.colors) {
    return false;
  }

  // Check required editor colors
  const requiredColors = [
    'editor.background',
    'editor.foreground',
    'editor.lineNumberColor'
  ];

  return requiredColors.every(color => color in theme.colors);
}

// Save theme to file
function saveTheme(theme, name) {
  const filename = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const filepath = path.join(THEMES_DIR, `${filename}.json`);

  // Check for duplicates
  if (fs.existsSync(filepath)) {
    console.log(`  ⏭️  Skipping (already exists): ${filename}`);
    return false;
  }

  try {
    fs.writeFileSync(filepath, JSON.stringify(theme, null, 2));
    console.log(`  ✅ Saved: ${filename}.json`);
    return true;
  } catch (err) {
    console.warn(`  ❌ Failed to save: ${err.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🎨 MIT VS Code Theme Discoverer\n');

  // Check rocha-scraper is running
  try {
    await axios.get(`${ROCHA_SCRAPER_URL}/api/status`);
  } catch (err) {
    console.error('❌ Error: rocha-scraper not running on :9865');
    console.error('   Start with: docker run -p 9865:9865 rocha-scraper');
    process.exit(1);
  }

  // Find themes
  const themes = await findMITThemes();
  console.log(`\n📊 Found ${themes.length} potential themes\n`);

  if (themes.length === 0) {
    console.log('No themes found. Try again later.');
    process.exit(0);
  }

  // Extract and save themes
  let saved = 0;

  for (const theme of themes) {
    try {
      const extracted = await extractTheme(theme.url);
      
      if (extracted && validateTheme(extracted)) {
        if (saveTheme(extracted, extracted.name)) {
          saved++;
        }
      }
    } catch (err) {
      console.warn(`  ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✨ Complete! Added ${saved} new themes\n`);
  console.log('📝 Next: Update package.json contributes.themes array');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
