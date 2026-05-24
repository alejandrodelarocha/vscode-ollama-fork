const axios = require('axios');
const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '../themes');
const GITHUB_API = 'https://api.github.com/search/repositories';

// Popular MIT-licensed VS Code themes already known
const KNOWN_THEMES = [
  {
    repo: 'dracula/visual-studio-code',
    file: 'theme/dracula.json'
  },
  {
    repo: 'arcticicestudio/nord-visual-studio-code',
    file: 'themes/nord-color-theme.json'
  },
  {
    repo: 'enkia/tokyo-night-vscode-theme',
    file: 'themes/tokyo-night-color-theme.json'
  },
  {
    repo: 'atom/one-dark-syntax',
    file: 'styles/colors.less'
  },
  {
    repo: 'primer/github-vscode-theme',
    file: 'themes/github-light-default-colors.json'
  },
  {
    repo: 'Binaryify/OneDark-Pro',
    file: 'themes/OneDark-Pro.json'
  },
  {
    repo: 'tomoki1207/vscode-monokai-extended',
    file: 'themes/Monokai Extended.json'
  },
  {
    repo: 'dempfi/ayu',
    file: 'ayu-light.json'
  },
  {
    repo: 'teabyii/vscode-ayu',
    file: 'ayu-light.json'
  },
  {
    repo: 'hedinne/popping-and-locking-vscode',
    file: 'themes/popping-and-locking.json'
  },
  {
    repo: 'evilz/vscode-E7',
    file: 'themes/E7.json'
  },
  {
    repo: 'sdras/night-owl',
    file: 'themes/night-owl-color-theme.json'
  }
];

async function fetchTheme(repo, file) {
  try {
    const url = `https://raw.githubusercontent.com/${repo}/main/${file}`;
    
    console.log(`  📥 ${repo}/${file}`);
    
    const response = await axios.get(url, { timeout: 5000 });
    
    // Parse if needed
    let theme = response.data;
    if (typeof theme === 'string') {
      try {
        theme = JSON.parse(theme);
      } catch (e) {
        console.warn(`    ⚠️  Invalid JSON`);
        return null;
      }
    }
    
    // Validate theme format
    if (!theme.name || !theme.colors) {
      console.warn(`    ⚠️  Invalid theme structure`);
      return null;
    }
    
    return theme;
  } catch (err) {
    console.warn(`    ❌ ${err.message}`);
    return null;
  }
}

function saveTheme(theme) {
  const filename = theme.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const filepath = path.join(THEMES_DIR, `${filename}.json`);

  // Skip if exists
  if (fs.existsSync(filepath)) {
    console.log(`    ⏭️  Already exists`);
    return false;
  }

  try {
    fs.writeFileSync(filepath, JSON.stringify(theme, null, 2));
    console.log(`    ✅ Saved as ${filename}.json`);
    return true;
  } catch (err) {
    console.error(`    ❌ Save failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🎨 MIT VS Code Theme Fetcher\n');
  
  let saved = 0;
  let failed = 0;

  for (const theme of KNOWN_THEMES) {
    const fetched = await fetchTheme(theme.repo, theme.file);
    
    if (fetched) {
      if (saveTheme(fetched)) {
        saved++;
      }
    } else {
      failed++;
    }
  }

  console.log(`\n✨ Complete!`);
  console.log(`   ✅ Saved: ${saved}`);
  console.log(`   ❌ Failed: ${failed}\n`);
  
  if (saved > 0) {
    console.log('Next: Update package.json with new themes');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
