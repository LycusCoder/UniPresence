# 🚀 Quick Reference - Unified Mode

## One-Liner Commands

```bash
# Start unified server
./start_unified.sh

# Stop server
Ctrl+C

# Rebuild frontend
cd frontend && yarn build && cd ..

# Test API
curl http://localhost:41201/api/health

# Check logs
tail -f /tmp/unipresence_unified.log

# Kill port
sudo lsof -ti:41201 | xargs kill -9
```

---

## Deployment Modes

### Mode 1: Local (Development/Testing)
```
Access: http://localhost:41201
Use: Development, local testing
No internet required
```

### Mode 2: Ngrok (Quick Share)
```
Access: https://random-xyz.ngrok-free.app
Use: Share dengan teman, demo, testing remote
Requires: Ngrok installed + authtoken
```

### Mode 3: Nginx (Production Self-Hosted)
```
Access: https://yourdomain.com
Use: Production deployment, custom domain
Requires: Nginx + domain + SSL (optional)
```

---

## Architecture

```
Browser Request
    ↓
Port 41201 (Unified Server)
    ↓
    ├─ /api/* → Flask API (JSON)
    ├─ /assets/* → Static files (CSS/JS)
    └─ /* → index.html (React Router)
```

---

## File Structure

```
/app/
├── start_unified.sh          # Main launcher
├── backend/
│   └── server_unified.py     # Unified server
├── frontend/
│   ├── dist/                 # Production build
│   └── .env.production       # VITE_BACKEND_URL=/api
└── nginx-unipresence.conf   # Nginx template
```

---

## Route Priorities (Order Matters!)

```python
# 1. API routes (highest priority)
@app.route('/api/health')
@app.route('/api/login')
# ... all API routes ...

# 2. Frontend catch-all (lowest priority, defined last)
@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path):
    # Serves index.html for React Router
```

---

## Frontend API Calls

**Production build uses relative URLs:**

```javascript
// .env.production
VITE_BACKEND_URL=/api

// In code
fetch('/api/login', { ... })  // ✅ Same origin
fetch('/api/health', { ... }) // ✅ No CORS
```

---

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| 404 on reload | Fixed! Server returns index.html |
| Port in use | `sudo lsof -ti:41201 \| xargs kill -9` |
| Frontend not built | `cd frontend && yarn build` |
| API returns HTML | Check URL starts with `/api/` |
| 502 Bad Gateway | Check server running: `ps aux \| grep server_unified` |

---

## Nginx Quick Setup

```bash
# 1. Copy config
sudo cp nginx-unipresence.conf /etc/nginx/sites-available/unipresence

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/unipresence /etc/nginx/sites-enabled/

# 3. Test config
sudo nginx -t

# 4. Start app
./start_unified.sh  # Choose mode 3

# 5. Reload nginx
sudo systemctl reload nginx
```

---

## Ngrok Quick Setup

```bash
# 1. Install
sudo snap install ngrok

# 2. Auth
ngrok config add-authtoken YOUR_TOKEN

# 3. Start app
./start_unified.sh  # Choose mode 2

# 4. Share URL
# URL shown in terminal
```

---

## Testing Checklist

- [ ] Backend API works: `curl localhost:41201/api/health`
- [ ] Frontend loads: `curl localhost:41201/`
- [ ] React Router: Visit `/dashboard`, refresh
- [ ] API calls work: Login from frontend
- [ ] Static files load: Check browser DevTools Network
- [ ] No CORS errors: Check browser console

---

## Performance Tips

**Nginx optimization:**
```nginx
# Enable gzip
gzip on;

# Cache static files
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**App optimization:**
- Use production build (done automatically)
- Enable nginx caching
- Use CDN for assets (optional)

---

## Security Checklist

- [ ] Use HTTPS in production (Nginx + SSL)
- [ ] Set strong JWT secret key
- [ ] Enable firewall (UFW)
- [ ] Regular updates
- [ ] Monitor logs
- [ ] Backup database regularly

---

## Monitoring

```bash
# Server status
ps aux | grep server_unified

# Port status
sudo netstat -tlnp | grep 41201

# Server logs
tail -f /tmp/unipresence_unified.log

# Nginx logs (if using)
sudo tail -f /var/log/nginx/unipresence_error.log

# System resources
htop
```

---

## Backup & Restore

**Backup:**
```bash
# Database
cp backend/instance/attendance.db backup/attendance_$(date +%Y%m%d).db

# Environment
cp backend/.env backup/
cp frontend/.env.production backup/
```

**Restore:**
```bash
cp backup/attendance_YYYYMMDD.db backend/instance/attendance.db
```

---

## Useful Links

| Resource | Path |
|----------|------|
| Complete Guide | [UNIFIED_MODE_GUIDE.md](./UNIFIED_MODE_GUIDE.md) |
| Nginx Setup | [NGINX_SETUP_GUIDE.md](./NGINX_SETUP_GUIDE.md) |
| Troubleshooting | [TROUBLESHOOTING_UNIFIED.md](./TROUBLESHOOTING_UNIFIED.md) |
| Mode Comparison | [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md) |
| Ngrok Guide | [NGROK_SETUP_GUIDE.md](./NGROK_SETUP_GUIDE.md) |

---

## Environment Variables

**Backend (.env):**
```bash
PORT=41201
HOST=0.0.0.0
FLASK_ENV=production
DATABASE_URL=sqlite:///instance/attendance.db
SECRET_KEY=your-secret-key
```

**Frontend (.env.production):**
```bash
VITE_BACKEND_URL=/api
```

---

## Port Overview

| Mode | Port(s) | Access |
|------|---------|--------|
| Unified | 41201 | All-in-one |
| Dual (old) | 3000, 8001 | Separate |

---

## When to Use What

| Scenario | Use This |
|----------|----------|
| Active development | Dual port (`start_services.sh`) |
| Local testing | Unified local mode |
| Share with team | Unified ngrok mode |
| Production | Unified nginx mode |
| Quick demo | Unified ngrok mode |
| Self-hosted VPS | Unified nginx mode |

---

**Print this for quick reference! 📄**

Keep this open while deploying → saves time! ⏰
