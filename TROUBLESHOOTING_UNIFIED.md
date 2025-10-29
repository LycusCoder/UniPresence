# 🐛 Troubleshooting - Unified Mode

## Common Issues & Solutions

### Issue 1: 404 Not Found on Reload ✅ FIXED

**Symptom:**
```
Not Found
The requested URL was not found on the server.
```

Terjadi saat:
- Refresh halaman di `/dashboard`, `/register`, dll
- Direct access ke route selain home

**Root Cause:**
React Router menghandle routing di client-side, tapi Flask tidak tahu route tersebut.

**Solution:** ✅ Already Fixed!

Server sekarang sudah dikonfigurasi untuk:
1. Serve API routes dari `/api/*` (Flask handles)
2. Serve static files (CSS, JS, images) jika ada
3. Serve `index.html` untuk semua routes lainnya (React Router handles)

**Verification:**
```bash
# Test API (should work)
curl http://localhost:41201/api/health

# Test frontend route (should return HTML)
curl http://localhost:41201/dashboard

# Both should work now!
```

---

### Issue 2: Frontend Not Built

**Symptom:**
```json
{
  "error": "Frontend not built",
  "message": "Please run: cd frontend && yarn build"
}
```

**Solution:**
```bash
# Build frontend
cd /app/frontend
yarn build

# Or re-run script (builds automatically)
cd /app
./start_unified.sh
```

**Verify build exists:**
```bash
ls -la /app/frontend/dist/
# Should show: index.html, assets/, etc
```

---

### Issue 3: Port Already in Use

**Symptom:**
```
OSError: [Errno 98] Address already in use
```

**Solution:**
```bash
# Find process
sudo lsof -i:41201

# Kill process
sudo kill -9 PID

# Or use script cleanup
Ctrl+C
./start_unified.sh
```

---

### Issue 4: API Returns HTML Instead of JSON

**Symptom:**
Frontend error: "Unexpected token < in JSON"

**Cause:**
API endpoint returning index.html instead of JSON

**Solution:**
Pastikan API route dimulai dengan `/api/`:

```javascript
// ❌ Wrong
fetch('/login', ...)

// ✅ Correct
fetch('/api/login', ...)
```

Check frontend code:
```bash
grep -r "fetch('" frontend/src/
# Semua harus "/api/..."
```

---

### Issue 5: Static Files Not Loading (CSS/JS)

**Symptom:**
- Page loads but no styling
- Console errors: "Failed to load resource"

**Solution:**

**Check build output:**
```bash
ls -la frontend/dist/assets/
# Should show CSS and JS files
```

**Check base path in index.html:**
```bash
cat frontend/dist/index.html | grep 'base href'
# Should be: <base href="/">
```

**If using subdirectory, update Vite config:**
```javascript
// vite.config.ts
export default defineConfig({
  base: '/subdir/',  // If deploying to subdirectory
  // ...
})
```

---

### Issue 6: CORS Errors (Unified Mode)

**Symptom:**
```
Access to fetch at 'http://localhost:41201/api/login' from origin 
'http://localhost:41201' has been blocked by CORS policy
```

**This shouldn't happen in unified mode!**

**Possible causes:**
1. Using wrong URL in fetch
2. Not using `/api/` prefix
3. Development mode mixing with production

**Solution:**
```javascript
// Check frontend .env.production
cat frontend/.env.production

// Should be:
VITE_BACKEND_URL=/api

// NOT:
VITE_BACKEND_URL=http://localhost:8001  ❌
```

---

### Issue 7: Ngrok Tunnel Not Working

**Symptom:**
"Could not get ngrok URL"

**Solution:**

**Check ngrok installed:**
```bash
ngrok version
# Should show version 3.x
```

**Check authtoken:**
```bash
ngrok config check
# Should show config file location
```

**Manual test:**
```bash
ngrok http 41201
# If this works, script should work too
```

**Check logs:**
```bash
tail -f /tmp/ngrok_unified.log
```

---

### Issue 8: Nginx 502 Bad Gateway

**Symptom:**
Browser shows: "502 Bad Gateway"

**Causes & Solutions:**

**1. Server not running:**
```bash
# Check process
ps aux | grep server_unified

# If not running, start it
cd /app
./start_unified.sh
```

**2. Wrong port in nginx config:**
```bash
# Check nginx config
sudo cat /etc/nginx/sites-available/unipresence | grep proxy_pass

# Should show:
proxy_pass http://127.0.0.1:41201;

# If wrong, fix it
sudo nano /etc/nginx/sites-available/unipresence
sudo nginx -t
sudo systemctl reload nginx
```

**3. Firewall blocking:**
```bash
# Nginx can't reach port 41201 internally
# This shouldn't happen, but check
sudo netstat -tlnp | grep 41201
```

---

### Issue 9: Build Failed

**Symptom:**
```
Error: Build failed
frontend build failed!
```

**Solution:**

**Check Node.js version:**
```bash
node --version
# Should be v16+ for Vite

# If too old, update:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

**Check yarn/npm:**
```bash
yarn --version
# or
npm --version
```

**Clean build:**
```bash
cd frontend
rm -rf node_modules dist
yarn install
yarn build
```

**Check build logs:**
```bash
cd frontend
yarn build 2>&1 | tee build.log
# Review build.log for errors
```

---

### Issue 10: Environment Variables Not Working

**Symptom:**
Frontend cannot reach backend API

**Check production env:**
```bash
cat frontend/.env.production

# Should be:
VITE_BACKEND_URL=/api
```

**Check build process used correct env:**
```bash
# Rebuild with explicit env
cd frontend
NODE_ENV=production yarn build
```

**Verify in built files:**
```bash
# Check if env vars are embedded correctly
grep -r "VITE_BACKEND_URL" frontend/dist/
```

---

### Issue 11: React Router Not Working

**Symptom:**
- Homepage works
- Direct navigation works
- Refresh on route breaks

**This is the Issue 1 - should be fixed now!**

**Verify fix:**
```bash
# Check route order in server
grep -n "def serve_frontend" backend/server_unified.py
# Should be near end of file, after all API routes

# Check route handler
cat backend/server_unified.py | grep -A 20 "def serve_frontend"
# Should return index.html for unknown routes
```

---

### Issue 12: Database Errors

**Symptom:**
```
sqlalchemy.exc.OperationalError: unable to open database file
```

**Solution:**

**Check database path:**
```bash
ls -la backend/instance/
# Should show attendance.db

# If not exists, will be created automatically
```

**Check permissions:**
```bash
# Make sure backend can write
chmod 755 backend/instance/
chmod 644 backend/instance/*.db
```

**Reset database (if corrupted):**
```bash
cd backend
mv instance/attendance.db instance/attendance.db.backup
# Restart server - will create new db
```

---

## Debug Tips

### Enable Debug Mode

**For more verbose logging:**

```python
# backend/server_unified.py
# At the end, change:
app.run(host=HOST, port=PORT, debug=True)  # Enable debug
```

### Check Logs

**Server log:**
```bash
tail -f /tmp/unipresence_unified.log
```

**Nginx log (if using):**
```bash
sudo tail -f /var/log/nginx/unipresence_error.log
```

**Browser console:**
- Open DevTools (F12)
- Check Console tab for JS errors
- Check Network tab for failed requests

### Test API Directly

**Health check:**
```bash
curl http://localhost:41201/api/health
```

**Login test:**
```bash
curl -X POST http://localhost:41201/api/login \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"admin","password":"admin"}'
```

### Test Frontend Files

**Check index.html:**
```bash
curl http://localhost:41201/ | head -20
# Should show HTML
```

**Check assets:**
```bash
curl -I http://localhost:41201/assets/index.js
# Should return 200 OK
```

---

## Quick Fixes

### Complete Reset

```bash
# Stop everything
Ctrl+C (if running)
sudo pkill -9 -f server_unified

# Clean build
cd /app/frontend
rm -rf dist node_modules
yarn install
yarn build

# Restart
cd /app
./start_unified.sh
```

### Force Rebuild

```bash
cd /app/frontend
yarn build --force
```

### Clear Browser Cache

```
Ctrl+Shift+R (hard reload)
or
Clear cache in browser settings
```

---

## Prevention

### Before Deploying

- [ ] Test locally first
- [ ] Check all API endpoints work
- [ ] Test navigation and refresh on all routes
- [ ] Check browser console for errors
- [ ] Test from incognito/private window

### Regular Maintenance

```bash
# Update dependencies
cd frontend && yarn upgrade
cd backend && pip install -r requirements.txt --upgrade

# Rebuild
cd /app
./start_unified.sh
```

---

## Get Help

**Check documentation:**
- [UNIFIED_MODE_GUIDE.md](./UNIFIED_MODE_GUIDE.md)
- [NGINX_SETUP_GUIDE.md](./NGINX_SETUP_GUIDE.md)
- [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md)

**Check logs:**
```bash
tail -100 /tmp/unipresence_unified.log
```

**Test components separately:**
1. Backend API: `curl http://localhost:41201/api/health`
2. Frontend build: `ls frontend/dist/`
3. Nginx config: `sudo nginx -t`

---

**Still having issues? Check logs first! 90% masalah terlihat di logs. 📝**
