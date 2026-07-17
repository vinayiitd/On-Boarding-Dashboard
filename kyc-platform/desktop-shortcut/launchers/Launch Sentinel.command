#!/usr/bin/env bash
# Sentinel — AI Compliance Officer
# macOS launcher. Double-click this file in Finder to start the app.
# Installed to your Desktop by scripts/install-desktop-shortcut.sh.

set -e

# When installed on the Desktop, this env var tells the launcher where the
# project lives. If the launcher is run in place it falls back to a sibling
# directory (../kyc-platform).
APP_DIR="${SENTINEL_APP_DIR:-}"
if [ -z "$APP_DIR" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  if [ -d "$SCRIPT_DIR/../../kyc-platform" ]; then
    APP_DIR="$(cd "$SCRIPT_DIR/../../kyc-platform" && pwd)"
  elif [ -d "$SCRIPT_DIR/../kyc-platform" ]; then
    APP_DIR="$(cd "$SCRIPT_DIR/../kyc-platform" && pwd)"
  fi
fi

if [ -z "$APP_DIR" ] || [ ! -f "$APP_DIR/package.json" ]; then
  osascript -e 'display alert "Sentinel not found" message "Could not locate the Sentinel project. Re-run install-desktop-shortcut.sh from the kyc-platform folder." as critical'
  exit 1
fi

cd "$APP_DIR"

# Load user shell profile so PATH picks up nvm / homebrew node.
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
[ -s "$HOME/.zshrc"    ] && \. "$HOME/.zshrc"    >/dev/null 2>&1 || true
[ -s "$HOME/.bash_profile" ] && \. "$HOME/.bash_profile" >/dev/null 2>&1 || true

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js is required" message "Install Node.js 20+ from https://nodejs.org and try again." as critical'
  exit 1
fi

echo ""
echo "🛡️  Sentinel — AI Compliance Officer"
echo "-------------------------------------"
echo "Project:  $APP_DIR"
echo "Node:     $(node -v)"
echo ""

if [ ! -d node_modules ]; then
  echo "→ Installing dependencies (first-run, one minute)…"
  npm install --silent
fi

if [ ! -d .next ]; then
  echo "→ Building production bundle (one-time)…"
  npm run build
fi

echo "→ Starting Sentinel on http://localhost:3000"
(
  sleep 2
  open "http://localhost:3000" >/dev/null 2>&1 || true
) &

exec npm run start
