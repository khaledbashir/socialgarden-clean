#!/bin/bash
# VPS Cleanup Script - Run this every few builds to free up space
# Usage: bash cleanup-vps.sh

echo "🧹 Starting VPS Cleanup..."
echo ""

# 1. Docker cleanup (most important)
echo "🐳 Cleaning Docker (containers, images, volumes, cache)..."
docker system prune -a -f --volumes
echo ""

# 2. pnpm/npm cache
echo "📦 Cleaning pnpm/npm cache..."
pnpm store prune 2>/dev/null || npm cache clean --force 2>/dev/null || echo "No cache to clean"
echo ""

# 3. Old temp files and logs
echo "🗑️  Cleaning old temp files and logs..."
find /tmp -type f -atime +7 -delete 2>/dev/null
find /var/log -name "*.gz" -delete 2>/dev/null
journalctl --vacuum-time=7d 2>/dev/null || true
echo ""

# 4. Clean old PM2 logs (if using PM2)
echo "📋 Cleaning PM2 logs..."
pm2 flush 2>/dev/null || echo "PM2 not running or no logs"
echo ""

# 5. Show final disk usage
echo "💾 Final disk usage:"
df -h / | tail -1
echo ""
echo "Docker directory size:"
du -sh /var/lib/docker 2>/dev/null || echo "Docker dir unavailable"
echo ""

echo "✅ Cleanup complete!"
echo "Recommendation: Run this script after every 3-5 builds or when disk usage > 80%"
