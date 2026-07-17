#!/usr/bin/env bash
# Sentinel — AI Compliance Officer
# Linux launcher, invoked by the sentinel.desktop entry.

set -e

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
  notify-send "Sentinel" "Could not locate the Sentinel project" 2>/dev/null || true
  echo "❌  Could not locate Sentinel. Set SENTINEL_APP_DIR or place next to kyc-platform/." >&2
  exit 1
fi

cd "$APP_DIR"

# nvm / user profile
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
[ -s "$HOME/.bashrc"    ] && \. "$HOME/.bashrc"    >/dev/null 2>&1 || true
[ -s "$HOME/.profile"   ] && \. "$HOME/.profile"   >/dev/null 2>&1 || true

if ! command -v node >/dev/null 2>&1; then
  notify-send "Sentinel" "Node.js 20+ is required. Install from https://nodejs.org." 2>/dev/null || true
  echo "❌  Node.js not found in PATH." >&2
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
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
  fi
) &

exec npm run start
