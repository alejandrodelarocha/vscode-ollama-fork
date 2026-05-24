#!/bin/bash

# Find popular MIT-licensed VS Code themes from GitHub
# Uses GitHub API + rocha-scraper

THEMES_DIR="./themes"
FOUND_COUNT=0

echo "🎨 Searching GitHub for MIT-licensed VS Code themes..."
echo ""

# Popular GitHub searches for themes
SEARCHES=(
  "vscode-theme language:json license:MIT stars:>50"
  "vscode theme extension language:json MIT"
  "color-theme vscode language:json"
  "dark theme vscode language:json license:MIT"
  "light theme vscode language:json"
)

for search in "${SEARCHES[@]}"; do
  echo "🔍 Searching: $search"
  
  # Use GitHub API to find matching repos
  curl -s "https://api.github.com/search/repositories?q=$search&per_page=30" \
    | jq -r '.items[] | .clone_url' \
    | while read repo; do
      if [ ! -z "$repo" ]; then
        echo "  📦 Found: $repo"
        ((FOUND_COUNT++))
      fi
    done
done

echo ""
echo "Found $FOUND_COUNT repositories"
echo ""
echo "Next steps:"
echo "1. Use rocha-scraper to extract theme files"
echo "2. Validate JSON format"
echo "3. Add to themes/ directory"
echo "4. Update package.json"
echo ""
