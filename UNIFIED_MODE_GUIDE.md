# 🚀 Unified Mode Guide - Single Port Deployment

## 📋 Overview

**Unified Mode** = Backend + Frontend dalam 1 port (41201)

**Benefits:**
- ✅ **No CORS issues** (same origin!)
- ✅ **1 port saja** untuk ngrok/nginx
- ✅ **Production-ready** deployment
- ✅ **Seperti Laravel/Django** - simple & powerful
- ✅ **Easy self-hosting**

---

## 🎯 3 Deployment Modes

### Mode 1: 🏠 Local (Development)
```bash
./start_unified.sh
# Pilih: 1

# Access:
http://localhost:41201
```

**Use Case:**
- Development & testing lokal
- Debug aplikasi
- Tidak butuh internet access

---

### Mode 2: 🌐 Ngrok (Quick Share)
```bash
./start_unified.sh
# Pilih: 2

# Access:
https://random-xyz.ngrok-free.app
```

**Use Case:**
- Share dengan teman-teman instantly
- Demo ke client
- Testing dari device lain (smartphone, tablet)
- Tidak ada server/domain sendiri

**Setup Ngrok:**
```bash
# Install ngrok
sudo snap install ngrok

# Set authtoken
ngrok config add-authtoken YOUR_TOKEN

# Test
ngrok http 41201
```

---

### Mode 3: 🔧 Nginx (Production)
```bash
./start_unified.sh
# Pilih: 3

# Access:
https://unipresence.yourdomain.com
```

**Use Case:**
- Production deployment
- Custom domain
- SSL/HTTPS
- Full control

**Setup Nginx:** See [NGINX_SETUP_GUIDE.md](./NGINX_SETUP_GUIDE.md)

---

## 🚀 Quick Start

### Step 1: Build & Run

```bash
cd /app
./start_unified.sh
```

**Script akan:**
1. Install dependencies (backend + frontend)
2. Build frontend (production mode)
3. Tanya deployment mode (Local/Ngrok/Nginx)
4. Start unified server di port 41201
5. Setup ngrok (jika dipilih)

### Step 2: Choose Mode

```
Pilih mode deployment:

  1. 🏠 Local Only
     → Akses: http://localhost:41201
     → Untuk development/testing lokal

  2. 🌐 Ngrok (Internet)
     → Share dengan teman-teman via internet
     → Instant public URL (free tier)

  3. 🔧 Nginx (Self-hosted)
     → Production deployment dengan domain sendiri
     → Full control, custom domain/SSL

Pilihan (1/2/3):
```

### Step 3: Access Application

**Mode Local:**
```
http://localhost:41201
```

**Mode Ngrok:**
```
https://abc-xyz.ngrok-free.app
```

**Mode Nginx:**
```
https://unipresence.yourdomain.com
```

---

## 📁 How It Works

### Architecture

```
┌─────────────────────────────────────┐
│      Browser / Client               │
└─────────────┬───────────────────────┘
              │
              ↓ (HTTP/HTTPS)
┌─────────────────────────────────────┐
│     Nginx (Optional - Mode 3)       │
│     Port 80/443 → 41201             │
└─────────────┬───────────────────────┘
              │
              ↓ (Reverse Proxy)
┌─────────────────────────────────────┐
│  Ngrok (Optional - Mode 2)          │
│  Public URL → localhost:41201       │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│   UNIFIED SERVER (Port 41201)       │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Flask Backend (Python)     │   │
│   │  - API routes: /api/*       │   │
│   │  - JWT authentication       │   │
│   │  - Database (SQLite)        │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Frontend Static Files      │   │
│   │  - Built from React/Vite    │   │
│   │  - Served from /            │   │
│   │  - Location: frontend/dist  │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Request Flow

**Frontend Request (/, /dashboard, etc):**
```
Browser → Port 41201 / → server_unified.py → Serve frontend/dist/index.html
```

**API Request (/api/login, etc):**
```
Browser → Port 41201 /api/login → server_unified.py → Process API → Return JSON
```

**Static Assets (CSS, JS, Images):**
```
Browser → Port 41201 /assets/main.js → server_unified.py → Serve frontend/dist/assets/main.js
```

---

## 🔧 Configuration

### Custom Port

**Method 1: Environment Variable**
```bash
PORT=8080 ./start_unified.sh
```

**Method 2: Edit Script**
```bash
nano start_unified.sh

# Change line:
PORT=${PORT:-41201}  # Change 41201 to your port
```

### Frontend API Calls

**Production build** menggunakan relative URLs:

```javascript
// frontend/.env.production
VITE_BACKEND_URL=/api

// In code:
const API_URL = import.meta.env.VITE_BACKEND_URL;
// Results in: /api (relative to same origin)

// Example API call:
fetch('/api/login', { ... })  // Same origin, no CORS!
```

---

## 📦 Files Structure

```
/app/
├── start_unified.sh              # Main launcher script
├── backend/
│   ├── server_unified.py         # Unified server (backend + frontend)
│   ├── server.py                 # Original separate server
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── dist/                     # Production build (auto-generated)
│   ├── src/
│   ├── package.json
│   └── .env.production          # Production env config
├── nginx-unipresence.conf       # Nginx config template
├── NGINX_SETUP_GUIDE.md         # Nginx setup guide
└── UNIFIED_MODE_GUIDE.md        # This file
```

---

## 🧪 Testing

### 1. Test Backend API

```bash
# Health check
curl http://localhost:41201/api/health

# Should return:
# {
#   "status": "ok",
#   "message": "Unified server running",
#   "mode": "production",
#   "frontend_built": true
# }
```

### 2. Test Frontend

```bash
# Open browser
http://localhost:41201

# Should show:
# Unipresence login page
```

### 3. Test with Ngrok

```bash
./start_unified.sh
# Choose mode 2

# Share URL dengan teman
# Test dari device lain (smartphone)
```

### 4. Load Test

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test 1000 requests
ab -n 1000 -c 10 http://localhost:41201/
```

---

## 🐛 Troubleshooting

### Issue 1: Frontend Not Built

**Error:**
```json
{
  "error": "Frontend not built",
  "message": "Please run: cd frontend && yarn build"
}
```

**Fix:**
```bash
cd /app/frontend
yarn build

# Or re-run script (it builds automatically)
./start_unified.sh
```

---

### Issue 2: Port Already in Use

**Error:**
```
Address already in use: 41201
```

**Fix:**
```bash
# Find process using port
sudo lsof -i:41201

# Kill process
sudo kill -9 PID

# Or use different port
PORT=8080 ./start_unified.sh
```

---

### Issue 3: 502 Bad Gateway (Nginx)

**Error:** Browser shows 502

**Causes:**
1. Unified server not running
2. Wrong port in nginx config
3. Firewall blocking

**Fix:**
```bash
# Check server running
ps aux | grep server_unified

# Check port
sudo netstat -tlnp | grep 41201

# Restart server
./start_unified.sh

# Test nginx config
sudo nginx -t
```

---

### Issue 4: Ngrok Not Working

**Error:** "Could not get ngrok URL"

**Fix:**
```bash
# Check ngrok installed
ngrok version

# Set authtoken
ngrok config add-authtoken YOUR_TOKEN

# Test manually
ngrok http 41201
```

---

## 🔒 Security Notes

### Same Origin = Secure

**Benefits:**
- No CORS complexity
- Cookies work properly
- No cross-origin attacks

**But still need:**
- JWT authentication (✅ Already implemented)
- Input validation (✅ Already implemented)
- Rate limiting (Can add with nginx)
- HTTPS in production (Use nginx + SSL)

### Production Checklist

- [ ] Use Nginx with SSL
- [ ] Set strong JWT secret key
- [ ] Enable rate limiting
- [ ] Setup firewall (UFW)
- [ ] Regular security updates
- [ ] Monitor logs
- [ ] Backup database

---

## 📊 Performance

### Single Port Benefits

**Latency:**
- No CORS preflight requests
- Direct static file serving
- Efficient request handling

**Resource Usage:**
- 1 process instead of 2
- Lower memory footprint
- Simpler deployment

### Optimization Tips

1. **Use Nginx** for production (caching, compression)
2. **Enable Gzip** in nginx config
3. **CDN** for static assets (optional)
4. **Database** optimization (add indexes)

---

## 🚀 Deployment Workflows

### Development Workflow

```bash
# Local development
./start_unified.sh
# Choose mode 1

# Make changes
# Test locally

# Share for review
./start_unified.sh
# Choose mode 2 (ngrok)
# Share URL dengan tim
```

### Production Workflow

```bash
# 1. Setup server (VPS/Cloud)
ssh user@your-server

# 2. Clone repo
git clone ...
cd unipresence

# 3. Install nginx
sudo apt install nginx

# 4. Setup nginx config
sudo cp nginx-unipresence.conf /etc/nginx/sites-available/unipresence
sudo ln -s /etc/nginx/sites-available/unipresence /etc/nginx/sites-enabled/

# 5. Start unified server
./start_unified.sh
# Choose mode 3 (nginx)

# 6. Setup SSL
sudo certbot --nginx -d your-domain.com

# 7. Test
https://your-domain.com
```

---

## 📚 Comparison with Separate Ports

### Separate Ports (Original)

```
Frontend: localhost:3000 → Vite dev server
Backend:  localhost:8001 → Flask server

Issues:
❌ CORS configuration needed
❌ 2 processes to manage
❌ 2 ngrok tunnels needed
❌ Complex nginx config
```

### Unified Port (New)

```
Both:     localhost:41201 → Flask unified server

Benefits:
✅ No CORS issues
✅ 1 process only
✅ 1 ngrok tunnel
✅ Simple nginx config
✅ Production ready
```

---

## 🎓 Advanced Topics

### Load Balancing

Run multiple instances:

```bash
# Terminal 1
PORT=41201 ./start_unified.sh

# Terminal 2
PORT=41202 ./start_unified.sh

# Terminal 3
PORT=41203 ./start_unified.sh
```

Update nginx config untuk load balancing (see NGINX_SETUP_GUIDE.md).

### Process Management

**With systemd:**

```bash
# Create service file
sudo nano /etc/systemd/system/unipresence.service
```

```ini
[Unit]
Description=Unipresence Unified Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/app
ExecStart=/usr/bin/python3 /app/backend/server_unified.py
Restart=always
Environment="PORT=41201"
Environment="HOST=0.0.0.0"

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable unipresence
sudo systemctl start unipresence

# Check status
sudo systemctl status unipresence
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm

# Copy files
COPY . /app

# Install dependencies
RUN pip install -r backend/requirements.txt
RUN cd frontend && npm install && npm run build

# Expose port
EXPOSE 41201

# Start server
CMD ["python3", "backend/server_unified.py"]
```

---

## 🆘 Support

**Documentation:**
- Unified Mode: This file
- Nginx Setup: [NGINX_SETUP_GUIDE.md](./NGINX_SETUP_GUIDE.md)
- Ngrok Setup: [NGROK_SETUP_GUIDE.md](./NGROK_SETUP_GUIDE.md)

**Logs:**
```bash
# Server log
tail -f /tmp/unipresence_unified.log

# Nginx log (if using nginx)
sudo tail -f /var/log/nginx/unipresence_error.log
```

**Common Commands:**
```bash
# Restart server
Ctrl+C
./start_unified.sh

# Rebuild frontend
cd frontend && yarn build

# Test nginx
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## ✅ Quick Reference

| Task | Command |
|------|---------|
| Start server | `./start_unified.sh` |
| Stop server | `Ctrl+C` |
| Check status | `ps aux \| grep server_unified` |
| View logs | `tail -f /tmp/unipresence_unified.log` |
| Build frontend | `cd frontend && yarn build` |
| Test API | `curl http://localhost:41201/api/health` |
| Nginx test | `sudo nginx -t` |
| Nginx reload | `sudo systemctl reload nginx` |

---

**Ready to deploy! 🚀**

Choose your mode dan happy coding! 🎉
