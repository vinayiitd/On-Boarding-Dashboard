#!/usr/bin/env bash
# Sentinel — desktop shortcut installer for macOS and Linux.
#
# Usage:  bash desktop-shortcut/install-desktop-shortcut.sh
#         (or double-click, if executable)
#
# Detects your OS, drops a launcher on your Desktop, and points it at
# the kyc-platform/ project living in this repo.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LAUNCHERS_DIR="$SCRIPT_DIR/launchers"
ICON_SRC="$SCRIPT_DIR/sentinel-icon.svg"

if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "❌  Could not find kyc-platform/package.json next to this installer."
  echo "    Expected layout: kyc-platform/desktop-shortcut/install-desktop-shortcut.sh"
  exit 1
fi

DESKTOP_DIR="${DESKTOP_DIR:-$HOME/Desktop}"
mkdir -p "$DESKTOP_DIR"

os="$(uname -s)"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
gray()  { printf "\033[90m%s\033[0m\n" "$*"; }

cyan "🛡  Sentinel — installing desktop shortcut"
gray "   Project:  $REPO_DIR"
gray "   Desktop:  $DESKTOP_DIR"
echo ""

case "$os" in
  Darwin)
    TARGET="$DESKTOP_DIR/Launch Sentinel.command"
    cp "$LAUNCHERS_DIR/Launch Sentinel.command" "$TARGET"
    # Inject the resolved project directory so the launcher works no matter
    # where the repo lives.
    sed -i.bak "1a\\
export SENTINEL_APP_DIR=\"$REPO_DIR\"" "$TARGET"
    rm -f "$TARGET.bak"
    chmod +x "$TARGET"
    # Remove macOS quarantine flag so it double-click launches without a warning.
    xattr -d com.apple.quarantine "$TARGET" 2>/dev/null || true
    green "✓ Installed: $TARGET"
    echo ""
    echo "   Double-click the 'Launch Sentinel' icon on your Desktop to start."
    echo "   The first launch will install dependencies + build (~1 minute)."
    ;;

  Linux)
    LAUNCHER="$LAUNCHERS_DIR/launch-sentinel.sh"
    chmod +x "$LAUNCHER"

    ICON_DIR="$HOME/.local/share/icons"
    mkdir -p "$ICON_DIR"
    ICON_TARGET="$ICON_DIR/sentinel.svg"
    cp "$ICON_SRC" "$ICON_TARGET"

    # freedesktop Exec= parsing chokes on ad-hoc quoting; write a tiny
    # wrapper script that hardcodes the project path and just call that.
    WRAPPER_DIR="$HOME/.local/share/sentinel"
    mkdir -p "$WRAPPER_DIR"
    WRAPPER="$WRAPPER_DIR/launch.sh"
    cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
export SENTINEL_APP_DIR=$(printf '%q' "$REPO_DIR")
exec bash $(printf '%q' "$LAUNCHER")
EOF
    chmod +x "$WRAPPER"

    TARGET="$DESKTOP_DIR/sentinel.desktop"
    sed \
      -e "s|{{LAUNCHER}}|$WRAPPER|g" \
      -e "s|{{ICON}}|$ICON_TARGET|g" \
      "$LAUNCHERS_DIR/sentinel.desktop.template" > "$TARGET"
    chmod +x "$TARGET"

    # Also register in the app menu.
    APP_MENU_DIR="$HOME/.local/share/applications"
    mkdir -p "$APP_MENU_DIR"
    cp "$TARGET" "$APP_MENU_DIR/sentinel.desktop"

    # GNOME: mark as trusted so double-click works without the "Allow launching" prompt.
    if command -v gio >/dev/null 2>&1; then
      gio set "$TARGET" metadata::trusted true 2>/dev/null || true
    fi

    green "✓ Installed: $TARGET"
    green "✓ Registered in app menu: $APP_MENU_DIR/sentinel.desktop"
    echo ""
    echo "   Double-click 'Sentinel — AI Compliance Officer' on your Desktop"
    echo "   (or search 'Sentinel' in your app launcher) to start."
    echo "   The first launch will install dependencies + build (~1 minute)."
    ;;

  *)
    echo "❌  Unsupported OS: $os"
    echo "   For Windows, run: powershell -ExecutionPolicy Bypass -File desktop-shortcut/install-desktop-shortcut.ps1"
    exit 1
    ;;
esac

echo ""
gray "Uninstall later with:  bash desktop-shortcut/uninstall-desktop-shortcut.sh"
