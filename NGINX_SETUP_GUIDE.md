# 🔧 Nginx Setup Guide - Unipresence Production

## 📋 Overview

Nginx sebagai reverse proxy untuk Unipresence unified server (port 41201).  
**Benefits:**
- ✅ Production-grade deployment
- ✅ SSL/TLS support (HTTPS)
- ✅ Custom domain
- ✅ Better performance (caching, compression)
- ✅ Load balancing ready
- ✅ Security headers

---

## 🚀 Quick Start (Local Testing)

### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Check status
sudo systemctl status nginx
```

### 2. Copy Config Template

```bash
# Copy template
sudo cp /app/nginx-unipresence.conf /etc/nginx/sites-available/unipresence

# Enable site
sudo ln -s /etc/nginx/sites-available/unipresence /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Test Configuration

```bash
# Test nginx config
sudo nginx -t

# Should show:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Start Unipresence Server

```bash
cd /app
./start_unified.sh

# Choose Mode 3 (Nginx)
```

### 5. Reload Nginx

```bash
sudo systemctl reload nginx
```

### 6. Test Access

```bash
# Local
http://localhost

# Network
http://YOUR_SERVER_IP
```

✅ Done! Unipresence now running behind Nginx!

---

## 🌍 Production Setup (Domain + SSL)

### Step 1: Domain Setup

**A. Get Domain**
- Beli domain dari Namecheap, GoDaddy, dll
- Atau gunakan subdomain dari domain existing

**B. Point Domain ke Server**

Di DNS settings domain Anda:
```
Type: A
Name: @ atau unipresence
Value: YOUR_SERVER_IP
TTL: 3600
```

Contoh:
```
unipresence.yourdomain.com → 192.168.1.100
```

**C. Verify DNS**
```bash
# Check DNS propagation
dig unipresence.yourdomain.com

# atau
nslookup unipresence.yourdomain.com
```

Wait 5-30 menit untuk DNS propagation.

### Step 2: Update Nginx Config

```bash
sudo nano /etc/nginx/sites-available/unipresence
```

Ganti:
```nginx
server_name localhost;
```

Menjadi:
```nginx
server_name unipresence.yourdomain.com;
```

Save dan test:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Install SSL (Certbot)

**A. Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

**B. Get SSL Certificate**
```bash
sudo certbot --nginx -d unipresence.yourdomain.com
```

Certbot akan:
1. Verify domain ownership
2. Generate SSL certificate
3. Auto-update nginx config
4. Setup auto-renewal

**C. Test SSL**
```bash
# Access via HTTPS
https://unipresence.yourdomain.com
```

**D. Auto-renewal Check**
```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal runs via cron
sudo systemctl status certbot.timer
```

✅ Production setup complete!

---

## 🔒 Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

**Important:** Port 41201 tidak perlu dibuka (internal only).

---

## 📊 Monitoring & Logs

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/unipresence_access.log

# Error logs
sudo tail -f /var/log/nginx/unipresence_error.log

# All nginx logs
sudo tail -f /var/log/nginx/*.log
```

### App Logs

```bash
# Unipresence server log
tail -f /tmp/unipresence_unified.log
```

### Nginx Status

```bash
# Check nginx service
sudo systemctl status nginx

# Reload config
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Test config
sudo nginx -t
```

---

## ⚙️ Advanced Configuration

### 1. Gzip Compression

Edit `/etc/nginx/nginx.conf`:

```nginx
http {
    # ...
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        image/svg+xml;
}
```

### 2. Rate Limiting

Add to nginx config:

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ...
    
    # Apply rate limit to API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://unipresence_app;
        # ... other proxy settings
    }
}
```

### 3. IP Whitelist (Admin only)

```nginx
# Restrict admin endpoints
location /api/employees {
    allow 192.168.1.0/24;  # Local network
    allow YOUR_OFFICE_IP;   # Office IP
    deny all;
    
    proxy_pass http://unipresence_app;
}
```

### 4. Custom Error Pages

```nginx
server {
    # ...
    
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        root /var/www/errors;
        internal;
    }
    
    location = /50x.html {
        root /var/www/errors;
        internal;
    }
}
```

### 5. Load Balancing (Multiple Instances)

```nginx
upstream unipresence_app {
    least_conn;  # Load balancing method
    
    server 127.0.0.1:41201 weight=1;
    server 127.0.0.1:41202 weight=1;
    server 127.0.0.1:41203 weight=1;
    
    keepalive 64;
}
```

---

## 🐛 Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause:** Unipresence server not running

**Fix:**
```bash
# Check if server running
ps aux | grep server_unified

# Check port
sudo netstat -tlnp | grep 41201

# Restart server
cd /app
./start_unified.sh
```

### Issue 2: 403 Forbidden

**Cause:** Nginx permission issues

**Fix:**
```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Fix permissions if needed
sudo chown -R www-data:www-data /var/log/nginx
```

### Issue 3: SSL Certificate Error

**Cause:** Certificate expired or invalid

**Fix:**
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal
```

### Issue 4: Connection Timeout

**Cause:** Firewall blocking

**Fix:**
```bash
# Check UFW
sudo ufw status

# Allow nginx
sudo ufw allow 'Nginx Full'

# Or specific ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Issue 5: Slow Response

**Cause:** No caching/compression

**Fix:**
- Enable gzip compression (see Advanced Configuration)
- Add static file caching
- Increase nginx buffers:

```nginx
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

---

## 🔐 Security Best Practices

### 1. Hide Nginx Version

```nginx
http {
    server_tokens off;
}
```

### 2. Limit Request Size

```nginx
client_max_body_size 10M;
client_body_buffer_size 128k;
```

### 3. Timeout Configuration

```nginx
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;
```

### 4. Block Bad Bots

```nginx
if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
    return 403;
}
```

### 5. HTTPS Only (Force SSL)

```nginx
server {
    listen 80;
    server_name unipresence.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Performance Tuning

### 1. Worker Processes

Edit `/etc/nginx/nginx.conf`:

```nginx
# Set to number of CPU cores
worker_processes auto;
worker_connections 1024;
```

### 2. Keepalive

```nginx
keepalive_timeout 65;
keepalive_requests 100;
```

### 3. Buffer Sizes

```nginx
client_body_buffer_size 128k;
client_max_body_size 10M;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
```

---

## 🎓 Testing Tools

### SSL Test
```bash
# Test SSL configuration
https://www.ssllabs.com/ssltest/
```

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost/
```

### Security Scan
```bash
# Install nmap
sudo apt install nmap

# Scan open ports
nmap -sV YOUR_SERVER_IP
```

---

## 📚 References

- Nginx Docs: https://nginx.org/en/docs/
- Certbot: https://certbot.eff.org/
- Let's Encrypt: https://letsencrypt.org/
- SSL Test: https://www.ssllabs.com/ssltest/

---

## ✅ Checklist

**Development:**
- [ ] Nginx installed
- [ ] Config copied and enabled
- [ ] Unipresence server running
- [ ] Local access working

**Production:**
- [ ] Domain pointed to server
- [ ] DNS propagated
- [ ] Nginx config updated with domain
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] Firewall configured
- [ ] Auto-renewal setup
- [ ] Monitoring configured

---

**Need help? Check logs first:**
```bash
# Nginx
sudo tail -f /var/log/nginx/error.log

# Unipresence
tail -f /tmp/unipresence_unified.log
```

**Happy Deploying! 🚀**
