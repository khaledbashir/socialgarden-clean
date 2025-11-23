#!/bin/bash

# Social Garden Development Shortcuts Setup
# This script adds useful aliases to your shell configuration

echo "🚀 Setting up Social Garden development shortcuts..."

# Backup existing .bashrc
cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)

# Add all the useful aliases
cat >> ~/.bashrc << 'EOF'

# ===========================================
# Social Garden Development Shortcuts
# ===========================================

# Development shortcuts
# Default `dev` will now use the Easypanel remote backend by launching the repo dev script with remote backend enabled.
# Use `dev-local` to start frontend dev as before (local backend behavior).
alias dev="cd ~/the11-dev-clean && USE_REMOTE_BACKEND=1 ./dev.sh"
alias dev-local="cd ~/the11-dev-clean/frontend && pnpm dev"
alias build="cd ~/the11-dev-clean/frontend && pnpm build"
alias test="cd ~/the11-dev-clean/frontend && pnpm test"
alias lint="cd ~/the11-dev-clean/frontend && pnpm lint"

# Database shortcuts
alias db="mysql -h localhost -P 3306 -u sg_sow_user -p'sg_sow_2025_SecurePass!' socialgarden_sow"
alias db-status="mysql -h localhost -P 3306 -u sg_sow_user -p'sg_sow_2025_SecurePass!' -e 'SELECT DATABASE() as current_db, COUNT(*) as tables FROM information_schema.tables WHERE table_schema = DATABASE()'"

# Project navigation
alias cd-project="cd ~/the11-dev-clean"
alias cd-frontend="cd ~/the11-dev-clean/frontend"
alias cd-backend="cd ~/the11-dev-clean/backend"
alias cd-db="cd ~/the11-dev-clean/database"

# Status checking
alias status="cd ~/the11-dev-clean && ./status.sh"
alias logs="cd ~/the11-dev-clean && tail -f frontend/.next/server.log"
alias health="cd ~/the11-dev-clean && ./verify-production-system.sh"

# Common tasks
alias restart="cd ~/the11-dev-clean && ./clean-vps.sh && cd frontend && pnpm dev"
alias deploy="cd ~/the11-dev-clean && ./docs/archive/deploy.sh"
alias backup="cd ~/the11-dev-clean && ./scripts/backup-database.sh"

# Git shortcuts
alias gs="cd ~/the11-dev-clean && git status"
alias ga="cd ~/the11-dev-clean && git add ."
alias gc="cd ~/the11-dev-clean && git commit -m"
alias gp="cd ~/the11-dev-clean && git push"
alias gl="cd ~/the11-dev-clean && git log --oneline -10"

# Quick file editing
alias edit-config="nano ~/the11-dev-clean/frontend/.env.local"
alias edit-db="nano ~/the11-dev-clean/database/init.sql"

# Utility shortcuts
alias cls="clear"
alias ll="ls -la"
alias ..="cd .."
alias ...="cd ../.."

EOF

# Reload the shell configuration
source ~/.bashrc

echo "✅ Shortcuts added successfully!"
echo ""
echo "Available shortcuts:"
echo "==================="
echo "dev          - Start development server"
echo "build        - Build the project"
echo "test         - Run tests"
echo "db           - Connect to database"
echo "db-status    - Check database status"
echo "cd-project   - Go to project root"
echo "cd-frontend  - Go to frontend directory"
echo "status       - Check system status"
echo "restart      - Clean and restart dev server"
echo "gs           - Git status"
echo "ga           - Git add all"
echo "gc           - Git commit"
echo "gp           - Git push"
echo ""
echo "Type 'source ~/.bashrc' in new terminals to load shortcuts"
echo "Or just start a new terminal session"
