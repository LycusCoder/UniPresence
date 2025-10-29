# 🌐 Network Access Guide - UniPresence Enterprise

## 🎯 **MASALAH: "This host is not allowed"**

Error ini muncul ketika mencoba akses aplikasi dari network/domain yang berbeda karena Vite's host check security feature.

---

## ✅ **SOLUSI YANG SUDAH DIIMPLEMENTASI:**

### **1. Vite Configuration Update**
File: `/app/frontend/vite.config.ts`

**Changes:**
- ✅ Added custom plugin `disableHostCheck()` untuk bypass host check
- ✅ Server config: `host: '0.0.0.0'` (listen all interfaces)
- ✅ HMR auto-detection untuk network access
- ✅ CORS enabled untuk cross-origin requests
- ✅ Preview mode juga support network access

### **2. Custom Vite Plugin**
File: `/app/frontend/vite-plugin-host-check.ts`

**Purpose:**
- Completely bypass Vite's host check
- Allow access dari any domain/network
- Perfect untuk development & demo environments

### **3. Package.json Update**
File: `/app/frontend/package.json`

**Start script updated:**
```json
"start": "vite --host 0.0.0.0 --port 3000 --strictPort false"
```

### **4. Environment Variables**
File: `/app/frontend/.env.local`

```bash
VITE_HOST_CHECK=false
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

---

## 🚀 **CARA AKSES DARI NETWORK LAIN:**

### **Option 1: Emergentagent Preview URL**
URL Preview sudah otomatis accessible dari mana saja:
```
https://qrcode-ecard-system.preview.emergentagent.com
```

**Benefit:**
- ✅ Otomatis HTTPS (camera works!)
- ✅ No configuration needed
- ✅ Shareable URL
- ✅ Perfect untuk demo/presentasi

### **Option 2: Local Network Access**
**Step 1:** Find your local IP
```bash
# Linux/Mac
hostname -I | awk '{print $1}'

# Or check logs
tail -f /var/log/supervisor/frontend.out.log
# Look for: ➜  Network: http://X.X.X.X:3000/
```

**Step 2:** Access dari device lain di network yang sama
```
http://YOUR_IP:3000
```

**Example:**
```
http://192.168.1.100:3000
```

**⚠️ Note:** HTTP tidak support camera di Chrome/Safari mobile!
- Solusi: Use ngrok atau Emergentagent preview URL

### **Option 3: ngrok (HTTPS Tunnel)**
Untuk testing camera di mobile dengan HTTP → HTTPS:

**Step 1:** Install ngrok (if not installed)
```bash
# Download & install ngrok
# Or use script: /app/scripts/start-with-network.sh
```

**Step 2:** Start ngrok tunnel
```bash
ngrok http 3000
```

**Step 3:** Access via ngrok URL
```
https://abc123.ngrok.io
```

---

## 🔧 **TROUBLESHOOTING:**

### **Issue 1: "Blocked request. This host is not allowed"**
**Symptom:** Error muncul saat akses dari preview URL atau network lain

**Solution:** ✅ ALREADY FIXED!
- Custom plugin `disableHostCheck()` sudah implemented
- Frontend config sudah updated
- Restart frontend sudah done

**Verify:**
```bash
# Check if frontend running
sudo supervisorctl status frontend

# Should show: RUNNING
```

### **Issue 2: Camera tidak work di mobile**
**Symptom:** "NotAllowedError" atau "Only secure origins allowed"

**Cause:** Modern browsers require HTTPS untuk camera access

**Solution:**
1. ✅ Use Emergentagent preview URL (already HTTPS)
2. ✅ Use ngrok untuk local development
3. ❌ HTTP localhost works, tapi HTTP network IP tidak!

### **Issue 3: HMR (Hot Reload) tidak work di network**
**Symptom:** Changes tidak auto-reload saat development

**Solution:**
- HMR configured untuk auto-detect host
- WebSocket connection should work automatically
- If still issue, manual refresh page (acceptable untuk demo)

### **Issue 4: CORS Error**
**Symptom:** "No 'Access-Control-Allow-Origin' header"

**Solution:** ✅ ALREADY FIXED!
- CORS enabled di vite config
- Custom plugin add CORS headers
- Backend juga sudah allow all origins

---

## 📱 **BEST PRACTICES UNTUK PRESENTASI:**

### **Scenario 1: Demo di Kampus (Same Network)**
**Setup:**
1. Connect laptop ke WiFi kampus
2. Get laptop IP: `hostname -I`
3. Share URL: `http://YOUR_IP:3000`
4. Mahasiswa connect ke WiFi yang sama
5. ✅ Works! (tapi camera hanya work di laptop, not mobile)

### **Scenario 2: Demo ke Dosen/Mahasiswa (Remote)**
**Setup:**
1. Use Emergentagent preview URL
2. Share: `https://qrcode-ecard-system.preview.emergentagent.com`
3. ✅ Works everywhere! Camera works on mobile too!

### **Scenario 3: Offline Demo (No Internet)**
**Setup:**
1. Create local hotspot dari laptop
2. Device lain connect ke hotspot
3. Share: `http://192.168.137.1:3000` (hotspot IP)
4. ✅ Works! (tapi camera tidak work di mobile karena HTTP)

---

## 🔐 **SECURITY NOTES:**

**⚠️ Development Mode:**
- Host check disabled untuk flexibility
- CORS allowed dari semua origins
- **NOT RECOMMENDED FOR PRODUCTION!**

**✅ Production Deployment:**
Untuk production, enable security:
1. Remove `disableHostCheck()` plugin
2. Set specific CORS origins di backend
3. Use proper SSL certificate
4. Enable host check di Vite

---

## 🎯 **QUICK REFERENCE:**

### **URLs Available:**
| Type | URL | Camera | Share |
|------|-----|--------|-------|
| Local Laptop | `http://localhost:3000` | ✅ | ❌ |
| Local Network | `http://YOUR_IP:3000` | ❌ Mobile | ✅ |
| Preview URL | `https://facetrack-12.preview...` | ✅ | ✅ |
| ngrok | `https://abc.ngrok.io` | ✅ | ✅ |

### **Services:**
```bash
# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart frontend
sudo supervisorctl restart backend
sudo supervisorctl restart all

# View logs
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/backend.out.log
```

---

## 🚀 **RECOMMENDATION:**

**Untuk Presentasi/Demo:**
1. **Primary:** Use Emergentagent Preview URL
   - ✅ HTTPS = Camera works everywhere
   - ✅ Shareable instantly
   - ✅ No setup needed

2. **Backup:** Local network (same WiFi)
   - ✅ Works offline
   - ⚠️ Camera limited to laptop only

3. **Alternative:** ngrok
   - ✅ HTTPS tunnel
   - ✅ Camera works
   - ⚠️ Requires ngrok setup

---

**Last Updated:** 2025-10-29  
**Status:** ✅ Network Access Fully Configured  
**Ready for:** Demo & Presentation
