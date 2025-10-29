# 🌐 Network Access Guide - UniPresence Enterprise

> **Panduan untuk mengakses aplikasi dari device lain di network yang sama**

**Last Updated:** 28 Oktober 2025  
**Project:** UniPresence Enterprise - Employee Management System

---

## 📑 Table of Contents

1. [Cara Akses dari Device Lain](#cara-akses-dari-device-lain)
2. [Setup untuk Development](#setup-untuk-development)
3. [Setup untuk Production](#setup-untuk-production)
4. [Troubleshooting](#troubleshooting)
5. [Camera Access dari Network](#camera-access-dari-network)

---

## 🚀 Cara Akses dari Device Lain

### **Step 1: Cari IP Address Server**

Di komputer/server yang menjalankan aplikasi:

**Linux/Mac:**
```bash
# Method 1: Using ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# Method 2: Using ip
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 3: Using hostname
hostname -I

# Example output: 192.168.1.100
```

**Windows:**
```bash
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

**Expected Output:**
```
192.168.1.100  ← Your server IP
```

---

### **Step 2: Update Environment Variables**

**Backend (.env):**
```bash
# /app/backend/.env
FLASK_ENV=development
DATABASE_URL=sqlite:///instance/attendance.db
SECRET_KEY=your-secret-key-here
PORT=8001
FRONTEND_URL=http://192.168.1.100:3000  # ← Add your IP
```

**Frontend (.env):**
```bash
# /app/frontend/.env
VITE_BACKEND_URL=http://192.168.1.100:8001  # ← Add your IP
```

**Important Notes:**
- ⚠️ Replace `192.168.1.100` dengan IP server Anda
- ⚠️ **JANGAN COMMIT** perubahan .env ke git
- ⚠️ Gunakan IP lokal (192.168.x.x) untuk network access

---

### **Step 3: Update Backend CORS (Sudah Fixed!)**

Backend sudah configured untuk allow all origins:

```python
# /app/backend/server.py (Already done ✅)
CORS(app, 
     resources={r"/*": {
         "origins": "*",  # Allow all origins
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": False,
         "max_age": 3600
     }})
```

**Why this works:**
- `"origins": "*"` allows ANY origin to access API
- `supports_credentials: False` required when using `"*"`
- No duplicate CORS headers (fixed!)

---

### **Step 4: Restart Services**

```bash
sudo supervisorctl restart all
```

**Wait 5 seconds, then verify:**
```bash
sudo supervisorctl status
```

All services should show `RUNNING` ✅

---

### **Step 5: Access from Another Device**

**Requirements:**
- Device harus di **network yang sama** (WiFi/LAN sama)
- Firewall harus allow port 3000 dan 8001

**Access URL:**
```
http://192.168.1.100:3000
```
(Replace dengan IP server Anda)

**Test dari device lain:**
1. Open browser (Chrome/Safari/Firefox)
2. Go to `http://<SERVER_IP>:3000`
3. Login dengan: EMP001 / admin123

---

## 🔧 Setup untuk Development

### **Network Access Checklist:**

**1. Backend Configuration:**
```python
# server.py - Already configured ✅
CORS(app, resources={r"/*": {"origins": "*"}})
```

**2. Frontend Configuration:**
```typescript
// Use environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
```

**3. Firewall Rules (Linux):**
```bash
# Allow port 3000 (Frontend)
sudo ufw allow 3000/tcp

# Allow port 8001 (Backend)
sudo ufw allow 8001/tcp

# Check status
sudo ufw status
```

**4. Firewall Rules (Windows):**
- Open Windows Defender Firewall
- New Inbound Rule → Port → TCP → 3000, 8001
- Allow connection → All profiles → Name: UniPresence

---

## 🏭 Setup untuk Production

### **Production Best Practices:**

**1. Use HTTPS (Required untuk camera access):**
```bash
# Install SSL certificate (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Backend will be: https://yourdomain.com/api
# Frontend will be: https://yourdomain.com
```

**2. Restrict CORS Origins:**
```python
# server.py - Production config
CORS(app, 
     resources={r"/*": {
         "origins": [
             "https://yourdomain.com",
             "https://www.yourdomain.com"
         ],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "supports_credentials": True  # Can be True with specific origins
     }})
```

**3. Environment Variables:**
```bash
# backend/.env (Production)
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host/db  # Use PostgreSQL
SECRET_KEY=<strong-random-key>  # Generate: openssl rand -hex 32
PORT=8001
FRONTEND_URL=https://yourdomain.com
```

```bash
# frontend/.env.production
VITE_BACKEND_URL=https://yourdomain.com/api
```

**4. Security Headers:**
```python
# Add to server.py
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
```

---

## 🐛 Troubleshooting

### **Problem 1: CORS Error - "Multiple Origin Not Allowed"**

**Error Message:**
```
CORS Multiple Origin Not Allowed
```

**Cause:**
Duplicate CORS headers dari CORS() dan @app.after_request

**Solution:** ✅ **FIXED!**
```python
# OLD (Wrong - Duplicate headers):
CORS(app, ...)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', ...)  # ❌ Duplicate!

# NEW (Correct - Single source):
CORS(app, resources={r"/*": {"origins": "*"}})
# No @app.after_request for CORS
```

---

### **Problem 2: Video Ref is Null**

**Error Message:**
```
❌ [Camera] Video ref is null
```

**Cause:**
Video element not mounted yet when stream obtained

**Solution:** ✅ **FIXED!**
```typescript
// Add delay before checking ref
await new Promise(resolve => setTimeout(resolve, 100));

if (!videoRef.current) {
    console.error('Video ref still null');
    return;
}
```

---

### **Problem 3: Cannot Access from Network**

**Symptoms:**
- Works on localhost
- Cannot access from phone/tablet

**Checklist:**
```bash
# 1. Check firewall
sudo ufw status

# 2. Check services running
sudo supervisorctl status

# 3. Test backend from same device
curl http://localhost:8001/api/health

# 4. Test backend from network
curl http://<SERVER_IP>:8001/api/health

# 5. Check if ports are listening
sudo netstat -tulpn | grep -E ':(3000|8001)'
```

**Expected Output:**
```
tcp  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  1234/node
tcp  0  0.0.0.0:8001  0.0.0.0:*  LISTEN  5678/python
```

---

### **Problem 4: Camera Not Working from Network**

**Error Message:**
```
⚠️ Akses kamera via network memerlukan HTTPS
```

**Cause:**
Camera API requires HTTPS for non-localhost access

**Solutions:**

**Option A: Use ngrok (Quick & Easy)**
```bash
# Install ngrok
npm install -g ngrok

# Expose frontend
ngrok http 3000

# You'll get: https://abc123.ngrok.io
# Update VITE_BACKEND_URL in frontend to use ngrok URL for backend too
```

**Option B: Use Local HTTPS (More Complex)**
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update vite.config.ts
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
    host: '0.0.0.0',
    port: 3000,
  }
});
```

**Option C: Production HTTPS (Recommended)**
```bash
# Use Let's Encrypt + Nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 📱 Camera Access dari Network

### **Requirements:**

1. **HTTPS Connection** (for non-localhost)
   - ✅ localhost (http:// OK)
   - ❌ 192.168.1.x (http:// NOT OK)
   - ✅ ngrok/domain with HTTPS (https:// OK)

2. **Browser Permissions**
   - User must grant camera permission
   - Cannot auto-grant from code

3. **Security Considerations**
   - Camera access is sensitive
   - Users see permission prompt
   - Can deny/revoke anytime

### **Error Handling:**

Application already handles these errors ✅:
- `NotAllowedError` - User denied permission
- `NotFoundError` - No camera detected
- `NotReadableError` - Camera in use by another app
- HTTPS requirement - Shows warning message

---

## 🔐 Security Notes

### **Development Mode (Current):**
- ✅ CORS allows all origins (`"*"`)
- ✅ HTTP allowed on localhost
- ⚠️ Camera requires HTTPS for network access
- ⚠️ No authentication on CORS

### **Production Mode (Should Implement):**
- ✅ CORS restricted to specific domains
- ✅ HTTPS everywhere
- ✅ Rate limiting on APIs
- ✅ IP whitelisting for sensitive endpoints
- ✅ Secure cookies with httpOnly flag

---

## 📝 Quick Reference

### **Common IPs:**
- `127.0.0.1` / `localhost` - Local machine only
- `192.168.1.x` - Home/Office WiFi network
- `10.0.0.x` - Corporate network
- `172.16.0.x` - VPN/Docker network

### **Common Ports:**
- `3000` - Frontend (React/Vite)
- `8001` - Backend (Flask API)
- `27017` - MongoDB
- `80` - HTTP (production)
- `443` - HTTPS (production)

### **Useful Commands:**
```bash
# Find server IP
hostname -I | awk '{print $1}'

# Test backend
curl http://localhost:8001/api/health

# Check logs
sudo tail -f /var/log/supervisor/backend.*.log
sudo tail -f /var/log/supervisor/frontend.*.log

# Restart all
sudo supervisorctl restart all
```

---

## ✅ Summary

**Current Setup (Working ✅):**
- Backend: CORS allows all origins (`"*"`)
- Frontend: Uses env variable for backend URL
- No duplicate CORS headers
- Video ref null issue fixed
- Camera permissions properly handled

**For Network Access:**
1. Find server IP: `hostname -I`
2. Update .env files with IP
3. Restart services
4. Access from device: `http://<IP>:3000`
5. For camera: Use HTTPS (ngrok/SSL)

**Status:**
- ✅ CORS fixed
- ✅ Video ref fixed
- ✅ Network access ready
- ⚠️ Camera needs HTTPS for network

---

**Last Updated:** 28 Oktober 2025  
**Maintained By:** Development Team
