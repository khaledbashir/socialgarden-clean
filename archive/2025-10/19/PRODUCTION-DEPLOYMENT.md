# Production Deployment Guide for sow.qandu.me

## Prerequisites
- Domain: sow.qandu.me pointing to your server
- PM2 installed globally
- Nginx configured as reverse proxy
- MySQL database running at 168.231.115.219

## Step 1: Environment Configuration

Create production `.env` file:
```bash
cd /root/the11/frontend
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://sow.qandu.me
NEXT_PUBLIC_API_URL=https://sow.qandu.me/api

# Database
DB_HOST=168.231.115.219
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
DB_PORT=3306

# AnythingLLM
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
ANYTHINGLLM_WORKSPACE_SLUG=pop

# OpenRouter
OPENROUTER_API_KEY=your_key_here

# JWT Secret (generate new one for production)
JWT_SECRET=$(openssl rand -base64 32)
EOF
```

## Step 2: Build Production Bundle

```bash
cd /root/the11/frontend
pnpm install
pnpm build
```

## Step 3: Start with PM2 (Persistent Process)

```bash
# Start frontend
pm2 start pnpm --name "sow-frontend" -- start

# Start backend
cd /root/the11/backend
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name "sow-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command that PM2 outputs

# Check status
pm2 status
pm2 logs sow-frontend
pm2 logs sow-backend
```

## Step 4: Nginx Configuration

Create `/etc/nginx/sites-available/sow.qandu.me`:

```nginx
server {
    listen 80;
    server_name sow.qandu.me;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sow.qandu.me;

    # SSL certificates (use Certbot)
    ssl_certificate /etc/letsencrypt/live/sow.qandu.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sow.qandu.me/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API proxy
    location /backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Max upload size for PDF generation
    client_max_body_size 50M;
}
```

Enable site and reload:
```bash
sudo ln -s /etc/nginx/sites-available/sow.qandu.me /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d sow.qandu.me
# Follow prompts to get SSL certificate
```

## Step 6: Verify Deployment

```bash
# Check PM2 processes
pm2 status

# Check logs
pm2 logs sow-frontend --lines 50
pm2 logs sow-backend --lines 50

# Test frontend
curl https://sow.qandu.me

# Test backend API
curl https://sow.qandu.me/backend/health
```

## Step 7: Monitoring & Maintenance

```bash
# View real-time logs
pm2 logs

# Restart services
pm2 restart sow-frontend
pm2 restart sow-backend

# Update application
cd /root/the11/frontend
git pull
pnpm install
pnpm build
pm2 restart sow-frontend

# Monitor resources
pm2 monit
```

## Common Commands

```bash
# Stop services
pm2 stop sow-frontend sow-backend

# Start services
pm2 start sow-frontend sow-backend

# Restart services
pm2 restart all

# Delete services (to reconfigure)
pm2 delete sow-frontend sow-backend

# Save PM2 configuration
pm2 save

# View logs
pm2 logs sow-frontend --lines 100
pm2 logs sow-backend --lines 100
```

## Troubleshooting

### Frontend not starting
```bash
pm2 logs sow-frontend
# Check for port conflicts
lsof -i:3000
```

### Backend not starting
```bash
pm2 logs sow-backend
# Check Python environment
cd /root/the11/backend
source venv/bin/activate
python main.py
```

### Database connection issues
```bash
# Test database connection
mysql -h 168.231.115.219 -u sg_sow_user -p socialgarden_sow
```

### SSL certificate renewal
```bash
# Certbot auto-renews, but you can test with:
sudo certbot renew --dry-run
```

## Auto-Deployment Script

Create `/root/the11/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying SOW Generator to production..."

cd /root/the11/frontend

echo "📦 Installing dependencies..."
pnpm install

echo "🏗️  Building frontend..."
pnpm build

echo "♻️  Restarting PM2 services..."
pm2 restart sow-frontend

echo "✅ Deployment complete!"
echo "🌐 Visit: https://sow.qandu.me"

pm2 logs sow-frontend --lines 20
```

Make it executable:
```bash
chmod +x /root/the11/deploy.sh
```

Use it:
```bash
./deploy.sh
```
