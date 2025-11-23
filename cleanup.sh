#!/bin/bash

echo "🚀 Starting user-level VPS cleanup..."

# Clear user cache
echo "💾 Clearing user cache..."
rm -rf ~/.cache/*

# Clear downloads history
echo "📁 Clearing download history..."
rm -rf ~/.local/share/recently-used.xbel

# Clear trash
echo "🗑️ Clearing trash..."
rm -rf ~/.local/share/Trash/*

# Clear browser cache (if exists)
echo "🌐 Clearing browser cache..."
rm -rf ~/.cache/mozilla/
rm -rf ~/.cache/google-chrome/

# Clear temporary files in user home
echo "🧽 Clearing user temp files..."
rm -rf ~/tmp/* 2>/dev/null || true
rm -rf ~/Downloads/* 2>/dev/null || true

# Clear node_modules cache if exists
echo "📦 Clearing node modules cache..."
rm -rf ~/.npm 2>/dev/null || true
rm -rf ~/.cache/yarn 2>/dev/null || true

# Clear other common cache directories
echo "🔧 Clearing other caches..."
rm -rf ~/.wine/drive_c/users/*/AppData/Local/Temp/* 2>/dev/null || true

echo "✅ User-level cleanup completed!"
