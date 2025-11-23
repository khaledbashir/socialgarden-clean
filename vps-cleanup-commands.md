# VPS Cleanup Commands

## System Package Cleanup

### For Debian/Ubuntu systems:
```bash
# Clean package cache
sudo apt clean

# Remove unused dependencies
sudo apt autoremove

# Remove old kernel versions
sudo apt autoremove --purge

# Clean package lists
sudo apt autoclean
```

### For CentOS/RHEL/Fedora systems:
```bash
# Clean yum cache
sudo yum clean all

# Remove old kernel packages
sudo package-cleanup --oldkernels --count=1

# Clean dnf cache (Fedora)
sudo dnf clean all
```

## System Logs Cleanup
```bash
# Clear systemd journal logs older than 7 days
sudo journalctl --vacuum-time=7d

# Clear system logs
sudo find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;

# Clear old log files
sudo find /var/log -type f -mtime +30 -delete
```

## Temporary Files Cleanup
```bash
# Clear temporary files
sudo rm -rf /tmp/*

# Clear thumbnail cache
rm -rf ~/.cache/thumbnails/*

# Clear browser cache
rm -rf ~/.cache/mozilla/
rm -rf ~/.cache/google-chrome/

# Clear system cache
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

## Docker Cleanup (if using Docker)
```bash
# Remove unused containers, images, networks, and volumes
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a
```

## User Cache Cleanup
```bash
# Clear user cache directories
rm -rf ~/.cache/*

# Clear download history
rm -rf ~/.local/share/recently-used.xbel

# Clear trash
rm -rf ~/.local/share/Trash/*
```

## Disk Usage Analysis
```bash
# Check disk usage
df -h

# Find large files
sudo find / -type f -size +100M -exec ls -lh {} \; | sort -k5 -hr

# Check directory sizes
du -sh /* | sort -hr
```

## One-liner Clean Script
```bash
# Complete cleanup script
sudo apt update && sudo apt clean && sudo apt autoremove -y && sudo apt autoclean && sudo journalctl --vacuum-time=7d && sudo rm -rf /tmp/* && rm -rf ~/.cache/* && echo "VPS cleanup completed!"
```

## Notes
- Always backup important data before running cleanup commands
- Be careful with commands that remove files permanently
- Test commands on non-production systems first
- The "drop_caches" command should be used with caution and sync first
