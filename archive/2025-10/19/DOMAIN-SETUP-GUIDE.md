# 🌐 Domain Configuration Complete Guide for sow.qandu.me

## ✅ **Current Status**

- **DNS:** ✅ Configured (sow.qandu.me → 168.231.115.219)
- **Application:** ✅ Running on port 3001
- **PM2:** ✅ Persistent (auto-restart enabled)
- **Easypanel:** ✅ Running on port 80/443

---

## 🎯 **Quick Setup via Easypanel (5 Minutes)**

Since Easypanel is already managing port 80/443, this is the easiest way:

### Step 1: Access Easypanel
1. Go to: **http://168.231.115.219:3000** or **https://easypanel.qandu.me**
2. Login with your credentials

### Step 2: Add New Proxy/Service
1. Click **"Projects"** or **"Services"**
2. Click **"Add New"** or **"Create"**
3. Select **"Add Proxy"** or **"External Service"**

### Step 3: Configure the Proxy
```
Name: sow-qandu-me
Domain: sow.qandu.me
Target: http://localhost:3001
Enable SSL: Yes (Let's Encrypt will auto-configure)
```

### Step 4: Save and Done!
- Easypanel will automatically:
  - Configure Nginx/Traefik routing
  - Request SSL certificate from Let's Encrypt
  - Set up HTTPS redirect
  - Your site will be live at: https://sow.qandu.me

---

## 🔄 **Alternative: Manual Nginx Configuration**

If you prefer manual setup (or Easypanel doesn't support external services), you need to:

1. **Stop Docker/Easypanel temporarily:**
   ```bash
   docker-compose -f /path/to/easypanel/docker-compose.yml stop
   ```

2. **Configure Nginx manually:**
   ```bash
   # Copy the config
   sudo cp /tmp/sow.qandu.me.http.conf /etc/nginx/sites-available/sow.qandu.me
   sudo ln -s /etc/nginx/sites-available/sow.qandu.me /etc/nginx/sites-enabled/
   
   # Start Nginx
   sudo systemctl start nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d sow.qandu.me
   ```

3. **Restart Easypanel:**
   ```bash
   docker-compose -f /path/to/easypanel/docker-compose.yml start
   ```

**⚠️ Warning:** This will temporarily take down Easypanel and any sites it's managing.

---

## 🎯 **Recommended Approach: Easypanel Proxy**

Since Easypanel is already running and managing port 80/443, **use Easypanel's UI** to add sow.qandu.me as a proxy to localhost:3001.

### Why Easypanel?
- ✅ No downtime
- ✅ Auto SSL certificates
- ✅ Easy management
- ✅ Existing infrastructure
- ✅ GUI for configuration

---

## 🧪 **Testing Access**

Once configured, test these URLs:

```bash
# HTTP (should redirect to HTTPS)
curl -I http://sow.qandu.me

# HTTPS (should return 200 OK)
curl -I https://sow.qandu.me

# Check certificate
openssl s_client -connect sow.qandu.me:443 -servername sow.qandu.me < /dev/null
```

---

## 📊 **Current Application Status**

```bash
# Check services
pm2 status

# View logs
pm2 logs sow-frontend --lines 50

# Test locally
curl http://localhost:3001
```

---

## 🎉 **What Happens After Setup**

Once you add the domain via Easypanel:

1. ✅ **http://sow.qandu.me** → Redirects to HTTPS
2. ✅ **https://sow.qandu.me** → Your SOW Generator
3. ✅ SSL certificate auto-renews
4. ✅ Application persists across reboots
5. ✅ Auto-restarts if it crashes

---

## 💡 **Quick Easypanel Tips**

If you don't see "Add Proxy" option in Easypanel:
- Look for: **"Templates"** → **"Custom Service"**
- Or: **"Apps"** → **"Add Custom"** → **"Proxy/Redirect"**
- Or: **"Settings"** → **"Domains"** → **"Add Domain"**

Every Easypanel version is slightly different, but the concept is the same:
- **Domain:** sow.qandu.me
- **Target:** http://localhost:3001
- **SSL:** Enabled

---

## 📞 **Need Help?**

If you're stuck configuring Easypanel, you can also:

1. **Use Cloudflare Tunnel** (zero-trust alternative)
2. **Use SSH tunnel** temporarily
3. **Access directly via IP:** http://168.231.115.219:3001

---

## ✅ **Summary**

- Application: **Running on port 3001** ✅
- DNS: **sow.qandu.me → 168.231.115.219** ✅
- PM2: **Auto-restart enabled** ✅
- Next Step: **Configure domain in Easypanel** (5 minutes)

**Your app is 95% ready! Just add the domain proxy in Easypanel and you're live!**
