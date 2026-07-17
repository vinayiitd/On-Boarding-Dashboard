#!/usr/bin/env bash
# Sentinel — remove the desktop shortcut previously installed on macOS or Linux.
set -e
DESKTOP_DIR="${DESKTOP_DIR:-$HOME/Desktop}"
removed=0
for path in \
  "$DESKTOP_DIR/Launch Sentinel.command" \
  "$DESKTOP_DIR/sentinel.desktop" \
  "$HOME/.local/share/applications/sentinel.desktop" \
  "$HOME/.local/share/icons/sentinel.svg" \
  "$HOME/.local/share/sentinel/launch.sh"
do
  if [ -f "$path" ]; then
    rm -f "$path"
    echo "✓ Removed $path"
    removed=1
  fi
done
[ $removed -eq 0 ] && echo "Nothing to remove."
