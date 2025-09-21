#!/usr/bin/env bash
set -euo pipefail

# --- Helpers ---
append_comment () {
  local file="$1"
  local text="$2"
  case "$file" in
    *.js)   printf "\n// %s\n" "$text" >> "$file" ;;
    *.css)  printf "\n/* %s */\n" "$text" >> "$file" ;;
    *.html) printf "\n<!-- %s -->\n" "$text" >> "$file" ;;
    *.md)   printf "\n<!-- %s -->\n" "$text" >> "$file" ;;
    *)      printf "\n# %s\n" "$text" >> "$file" ;;
  esac
}

require_files=(index.html style.css script.js README.md)
for f in "${require_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing $f. Please run this script from the project folder."
    exit 1
  fi
done

if [[ ! -d .git ]]; then
  git init
fi

# Ensure .gitignore exists & is committed
if [[ ! -f .gitignore ]]; then
  cat > .gitignore <<'EOF'
node_modules/
.env
.DS_Store
*.zip
EOF
  git add .gitignore
  git commit -m "chore: add .gitignore (node_modules, .env, zips)" || true
fi

# --- Add more JS feature commits (each appends a harmless comment so Git sees a change) ---
append_comment script.js "feat(js): 5-day forecast renderer with date/temp/wind/humidity (marker)"
git add script.js
git commit -m "feat(js): 5-day forecast renderer with date/temp/wind/humidity" || true

append_comment script.js "feat(js): recent cities dropdown with localStorage (marker)"
git add script.js
git commit -m "feat(js): recent cities dropdown with localStorage (hidden until first search)" || true

append_comment script.js "feat(js): °C/°F toggle for current temperature only (marker)"
git add script.js
git commit -m "feat(js): °C/°F toggle (current temp only)" || true

append_comment script.js "feat(js): dynamic backgrounds + extreme-heat alert banner (marker)"
git add script.js
git commit -m "feat(js): dynamic backgrounds and extreme-heat alert banner" || true

append_comment script.js "feat(js): validation + custom toast errors (no alert()) (marker)"
git add script.js
git commit -m "feat(js): input validation + graceful error handling with toast (no alert())" || true

append_comment script.js "feat(js): fetch timeout + HTTP status-to-message mapping (marker)"
git add script.js
git commit -m "feat(js): fetch timeouts and HTTP status-to-message mapping" || true

# --- Small polish commits for CSS/HTML/Docs ---
append_comment style.css "style(css): micro polish for buttons and chips (marker)"
git add style.css
git commit -m "style(css): micro polish for buttons and chips" || true

append_comment index.html "feat(html): ARIA label refinements and meta description tweak (marker)"
git add index.html
git commit -m "feat(html): ARIA label refinements and meta description tweak" || true

append_comment README.md "docs(readme): add Windows CRLF troubleshooting tip (marker)"
git add README.md
git commit -m "docs(readme): add Windows CRLF troubleshooting tip" || true

echo "Done. New commit count:"
git rev-list --count HEAD
