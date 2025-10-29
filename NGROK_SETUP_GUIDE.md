# 🌐 Ngrok v3 Setup Guide - Unipresence

## 📋 Overview
Script `start_services.sh` v6.0 sudah support **Ngrok v3** dengan config YAML untuk multiple tunnels!

## ✨ Fitur Baru
- ✅ Support Ngrok v3 dengan config YAML
- ✅ Multiple tunnels (frontend + backend)
- ✅ Auto-detect dan parse tunnel URLs
- ✅ Smart CORS configuration
- ✅ Auto restart services dengan ngrok URLs
- ✅ Backup & restore .env files

## 🚀 Setup Ngrok

### 1. Install Ngrok v3
```bash
# Download dari https://ngrok.com/download
# Atau install via snap (Linux)
sudo snap install ngrok

# Atau via brew (macOS)
brew install ngrok/ngrok/ngrok
```

### 2. Buat Ngrok Config File

**Lokasi config:** `~/.config/ngrok/ngrok.yml`

```bash
# Buat directory jika belum ada
mkdir -p ~/.config/ngrok

# Copy template config
cp /app/ngrok-config-example.yml ~/.config/ngrok/ngrok.yml

# Edit config dengan authtoken Anda
nano ~/.config/ngrok/ngrok.yml
```

**Format config:**
```yaml
version: "3"

agent:
  authtoken: YOUR_NGROK_AUTHTOKEN_HERE  # Ganti dengan token Anda

tunnels:
  frontend:
    addr: 3000
    proto: http
    subdomain: lycus  # Ganti dengan subdomain Anda
  backend:
    addr: 8001
    proto: http
    subdomain: lycus  # Ganti dengan subdomain Anda
```

### 3. Dapatkan Authtoken

1. Login ke https://dashboard.ngrok.com/
2. Go to **Your Authtoken**
3. Copy token Anda
4. Paste ke config file

### 4. Test Config

```bash
# Test ngrok config
ngrok config check

# Test start semua tunnels
ngrok start --all
```

## 🎯 Cara Menggunakan

### Start Services dengan Ngrok

```bash
cd /app
./start_services.sh

# Pilih opsi 1 untuk aktifkan Ngrok
# Script akan:
# 1. Start backend di port 8001
# 2. Start frontend di port 3000
# 3. Start ngrok dengan config YAML
# 4. Auto-detect tunnel URLs
# 5. Update .env files
# 6. Restart services dengan ngrok URLs
```

### Output yang Diharapkan

```
🚀 UNIPRESENCE LAUNCHER v6.0 - NGROK V3 READY
==========================================================

🐍 DETECTING PYTHON ENVIRONMENT
✅ Using System Python3

📦 INSTALLING BACKEND DEPENDENCIES
✅ Backend dependencies berhasil diinstall/update!

📦 INSTALLING FRONTEND DEPENDENCIES
✅ Frontend dependencies berhasil diinstall/update (Yarn)!

🌐 NGROK NETWORK EXPOSURE
Apakah Anda ingin mengaktifkan Ngrok v3?

  1. ✅ Ya - Aktifkan Ngrok (Internet Access)
  2. ❌ Tidak - Lokal saja

Pilihan (1/2): 1

✅ Ngrok v3 siap digunakan! (config: ~/.config/ngrok/ngrok.yml)

🧹 CLEANUP OLD PROCESSES
...

🐍 STARTING BACKEND
✅ Backend running (PID: 12345) → http://localhost:8001

⚛️  STARTING FRONTEND
✅ Frontend running (PID: 12346) → http://localhost:3000

🌐 STARTING NGROK V3
✅ Backend Ngrok URL: https://lycus.ngrok-free.app
✅ Frontend Ngrok URL: https://lycus-1.ngrok-free.app
📊 Dashboard: http://localhost:4040

✨ ALL SYSTEMS RUNNING
==========================================================

🔗 Local Access:
   Backend:  http://localhost:8001
   Frontend: http://localhost:3000

🌍 Internet Access (Ngrok v3):
   Backend:  https://lycus.ngrok-free.app
   Frontend: https://lycus-1.ngrok-free.app
   Dashboard: http://localhost:4040

⚠️  PENTING:
   ✅ Frontend sudah dikonfigurasi untuk menggunakan Ngrok backend
   ✅ Backend CORS sudah allow Ngrok URLs
   ✅ Share URL Ngrok ke teman-teman untuk testing!
```

## 🔧 Troubleshooting

### Issue 1: Ngrok Config Not Found
**Error:** `Ngrok config tidak ditemukan`

**Solution:**
```bash
# Buat config file
mkdir -p ~/.config/ngrok
nano ~/.config/ngrok/ngrok.yml

# Paste config dari template
```

### Issue 2: Authtoken Invalid
**Error:** `authentication failed`

**Solution:**
```bash
# Get new authtoken dari dashboard
# Update di config file
nano ~/.config/ngrok/ngrok.yml

# Test lagi
ngrok config check
```

### Issue 3: Subdomain Already Taken
**Error:** `subdomain is already in use`

**Solution:**
- Ganti subdomain di config file dengan nama lain
- Atau upgrade ke Ngrok paid plan untuk custom subdomain

### Issue 4: CORS Errors
**Problem:** Browser console menampilkan CORS errors

**Solution:**
Script sudah auto-handle CORS! Backend akan:
1. Detect ngrok URLs dari environment
2. Auto-add ke CORS allowed origins
3. Support wildcard patterns: `*.ngrok-free.app`, `*.ngrok.io`

**Manual check:**
```bash
# Check backend logs
tail -f /tmp/unipresence_backend.log

# Seharusnya terlihat:
# ✅ CORS: Added Ngrok Frontend URL: https://...
# ✅ CORS: Added Ngrok Backend URL: https://...
```

### Issue 5: Frontend Tidak Connect ke Backend
**Problem:** Frontend tidak bisa hit backend API

**Solution:**
```bash
# Check frontend .env
cat frontend/.env

# Seharusnya:
# VITE_BACKEND_URL=https://lycus.ngrok-free.app

# Jika masih localhost, restart script
./start_services.sh
```

## 📝 Config File Reference

### Minimal Config
```yaml
version: "3"
agent:
  authtoken: YOUR_TOKEN_HERE
tunnels:
  backend:
    addr: 8001
    proto: http
```

### Advanced Config
```yaml
version: "3"

agent:
  authtoken: YOUR_TOKEN_HERE

tunnels:
  frontend:
    addr: 3000
    proto: http
    subdomain: myapp-frontend  # Custom subdomain (paid feature)
    inspect: true               # Enable inspect
  
  backend:
    addr: 8001
    proto: http
    subdomain: myapp-backend
    inspect: true
    bind_tls: true             # Force HTTPS
```

## 🎉 Testing dengan Teman

### Share URLs
1. Jalankan `./start_services.sh`
2. Pilih opsi 1 (Ngrok)
3. Copy Backend URL: `https://lycus.ngrok-free.app`
4. Copy Frontend URL: `https://lycus-1.ngrok-free.app`
5. Share ke teman-teman!

### Access dari Smartphone
- Buka Frontend URL di browser smartphone
- Login dengan credentials
- Test face recognition
- Works! 🎉

### Multiple Testers
- Semua tester menggunakan **Frontend URL** yang sama
- Backend sudah support concurrent requests
- CORS sudah configured untuk allow ngrok URLs

## 🔐 Security Notes

### Free Ngrok Limitations
- ⚠️ Public URLs accessible by anyone
- ⚠️ Free plan = random subdomains
- ⚠️ URLs change setiap restart (kecuali reserved subdomain)

### Best Practices
1. **Jangan commit authtoken** ke git
2. **Gunakan reserved subdomain** untuk URL yang konsisten (paid feature)
3. **Add authentication** - app sudah punya JWT auth ✅
4. **Monitor dashboard** di http://localhost:4040
5. **Stop ngrok** setelah testing (Ctrl+C)

## 📱 Ngrok Dashboard

Access: http://localhost:4040

Features:
- 📊 Real-time request logs
- 🔍 Inspect request/response
- 📈 Traffic statistics
- 🔄 Replay requests
- 🐛 Debug issues

## 🆘 Support

Jika masih ada masalah:
1. Check logs: `/tmp/unipresence_*.log`
2. Check ngrok status: `ngrok status`
3. Check ngrok dashboard: http://localhost:4040
4. Restart script: `./start_services.sh`

## 🎓 Resources

- Ngrok Docs: https://ngrok.com/docs
- Ngrok Dashboard: https://dashboard.ngrok.com/
- Ngrok Pricing: https://ngrok.com/pricing

---

**Happy Testing! 🚀**
