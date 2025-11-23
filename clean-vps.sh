#!/bin/bash

# VPS Cleanup Script
# Usage: sudo bash clean-vps.sh

echo "🚀 Starting VPS cleanup..."

# Update package lists
echo "📦 Updating package lists..."
apt update -qq

# Clean package cache
echo "🧹 Cleaning package cache..."
apt clean -qq

# Remove unused dependencies
echo "🗑️  Removing unused dependencies..."
apt autoremove -y -qq

# Clean package lists
echo "🧽 Cleaning package lists..."
apt autoclean -qq

# Clear systemd journal logs older than 7 days
echo "📋 Clearing old system logs..."
journalctl --vacuum-time=7d --quiet

# Clear temporary files
echo "🧽 Clearing temporary files..."
rm -rf /tmp/*

# Clear user cache
echo "💾 Clearing user cache..."
rm -rf ~/.cache/*

# Sync and drop caches
echo "⚡ Dropping system caches..."
sync
echo 3 > /proc/sys/vm/drop_caches

# Show disk usage before and after
echo "💽 Disk usage after cleanup:"
df -h / | tail -1

echo "✅ VPS cleanup completed!"
