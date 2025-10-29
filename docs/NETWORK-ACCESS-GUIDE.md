# 🌐 Network Access Guide - UniPresence Enterprise

> **Panduan lengkap untuk akses dari HP/Mobile di jaringan yang sama**

---

## 🎯 Tujuan

Agar **mahasiswa/tester bisa akses aplikasi dari HP mereka** untuk test camera & face recognition dengan **HTTPS (wajib untuk camera di mobile)**.

---

## 🚀 Quick Start (Recommended - Menggunakan ngrok)

### Step 1: Setup ngrok (One-time)

```bash
# 1. Daftar gratis di ngrok.com
# Buka: https://ngrok.com/

# 2. Dapatkan authtoken dari dashboard
# Login → Your Authtoken → Copy

# 3. Configure ngrok
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### Step 2: Start Application dengan Network Access

```bash
# Jalankan startup script
cd /app
./scripts/start-with-network.sh
```

**Output yang muncul:**
```
🚀 UniPresence Enterprise - Network Startup
==========================================

📡 Local IP Address: 192.168.1.100

✅ HTTPS URL (untuk Mobile/Camera):
   https://abc123.ngrok.io

✅ Local Network URL (HTTP only):
   http://192.168.1.100:3000

╔════════════════════════════════════════════════════╗
║  📱 Untuk Mahasiswa/Tester:                       ║
║                                                    ║
║  1. Buka URL HTTPS di atas                        ║
║  2. Login dengan:                                 ║
║     - EMP001 / admin123 (Admin)                   ║
║     - EMP002 / manager123 (Manager)               ║
║     - EMP003 / employee123 (Employee)             ║
║                                                    ║
║  3. Camera akan jalan dengan HTTPS! ✅            ║
╚════════════════════════════════════════════════════╝

📱 QR Code untuk akses cepat:
[QR CODE MUNCUL DI SINI]
```

### Step 3: Share URL ke Mahasiswa

**Option 1: Share HTTPS URL**
- Copy URL ngrok: `https://abc123.ngrok.io`
- Share via WhatsApp/Telegram ke mahasiswa
- Mereka bisa langsung akses & camera jalan! ✅

**Option 2: QR Code**
- Screenshot QR code dari terminal
- Share screenshot ke group
- Mahasiswa scan QR code
- Done! ✅

---

## 📱 Cara Mahasiswa Menggunakan

### 1. Buka URL HTTPS
- Tap link yang di-share: `https://xxx.ngrok.io`
- Browser akan langsung buka aplikasi

### 2. Login
- Pilih salah satu account test:
  - **EMP001** / **admin123** → Admin (bisa registrasi karyawan baru)
  - **EMP002** / **manager123** → Manager
  - **EMP003** / **employee123** → Employee

### 3. Test Camera (Auto-start!)
- Setelah login, klik menu **"Absensi"**
- **Camera otomatis nyala!** 🎥
- Browser akan minta permission → **Allow**
- Video feed langsung tampil! ✅

### 4. Test Face Recognition
- Tunggu quality indicator jadi **hijau** ✅
- Klik **"Scan Absensi Sekarang"**
- Face recognition jalan!
- Absensi tercatat! 🎉

---

## 🔧 Alternative Setup (Tanpa ngrok)

### Option A: Local Network HTTP Only

**⚠️ WARNING: Camera TIDAK jalan di mobile dengan HTTP!**

```bash
# 1. Get your local IP
hostname -I

# 2. Share URL ke mahasiswa
# http://192.168.1.100:3000
```

**Limitation:**
- ❌ Camera tidak jalan di mobile (browser block non-HTTPS)
- ✅ Bisa test login & UI
- ✅ Bisa test dari laptop/desktop

---

### Option B: Self-Signed Certificate (Advanced)

**Untuk yang mau setup HTTPS sendiri tanpa ngrok:**

```bash
# 1. Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# 2. Update frontend vite config
# (Complex - not recommended untuk presentasi)
```

**Drawback:**
- ⚠️ Browser akan warning "Not Secure"
- Mahasiswa harus klik "Advanced → Proceed"
- Ribet untuk demo

---

## 🎓 Untuk Presentasi/Demo

### Skenario Terbaik:

1. **Sehari sebelum presentasi:**
   - Setup ngrok dengan script
   - Test dari HP sendiri
   - Pastikan camera jalan
   - Save URL ngrok untuk besok

2. **Hari presentasi:**
   - Jalankan script sebelum mahasiswa datang
   - Generate QR code
   - Display QR code di projector/screen
   - Mahasiswa scan → langsung test!

3. **During Demo:**
   - Show ngrok web interface: `http://localhost:4040`
   - Live monitoring request/response
   - Professional! ✨

---

## 🆚 Perbandingan Method

| Method | Setup | HTTPS | Camera | Best For |
|--------|-------|-------|--------|----------|
| **ngrok** | ⭐⭐⭐ Easy | ✅ Yes | ✅ Yes | **Demo/Presentasi** |
| Local IP | ⭐⭐⭐⭐⭐ Instant | ❌ No | ❌ No | Testing UI only |
| Self-Signed | ⭐ Hard | ⚠️ Warning | ⚠️ Yes* | Advanced users |

**Recommendation:** **Pakai ngrok!** Paling praktis untuk presentasi! ✅

---

## 🐛 Troubleshooting

### Problem 1: "ngrok not found"
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Problem 2: "Camera not working on mobile"
**Check:**
1. ✅ Menggunakan HTTPS URL? (bukan HTTP)
2. ✅ Browser permission granted?
3. ✅ Lighting cukup terang?

**Solution:**
- Pastikan pakai **HTTPS URL** dari ngrok
- Buka di Chrome/Safari mobile
- Allow camera permission

### Problem 3: "Ngrok session expired"
**Cause:** Free tier ngrok session (2 jam)

**Solution:**
```bash
# Restart script
./scripts/start-with-network.sh

# URL akan berubah - share URL baru
```

### Problem 4: "Network Error saat login"
**Check:**
1. Backend running? `sudo supervisorctl status backend`
2. CORS configured? (Already done ✅)
3. URL correct?

**Solution:**
```bash
# Restart all services
sudo supervisorctl restart all

# Check backend logs
tail -f /var/log/supervisor/backend*.log
```

---

## 💡 Pro Tips

### Tip 1: QR Code untuk Akses Cepat
```bash
# Install qrencode
sudo apt install qrencode

# Script sudah auto-generate QR code!
./scripts/start-with-network.sh
```

### Tip 2: Monitor Traffic dengan ngrok Inspector
- Buka: `http://localhost:4040`
- Lihat real-time requests
- Debug issues
- Show ke audience! 😎

### Tip 3: Persistent ngrok URL (Paid)
- Upgrade ngrok → dapat fixed URL
- Tidak perlu share URL baru setiap restart
- Good untuk development

### Tip 4: Test Sebelum Presentasi
```bash
# Test checklist:
# 1. ngrok running? ✅
# 2. Services running? ✅
# 3. Camera works di HP? ✅
# 4. Face recognition works? ✅
# 5. QR code generated? ✅
```

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│   Mahasiswa     │
│   (Mobile)      │
│   📱            │
└────────┬────────┘
         │ HTTPS
         │ (Camera OK! ✅)
         ▼
┌─────────────────┐
│     ngrok       │
│   (Tunnel)      │
│  https://xxx    │
└────────┬────────┘
         │
         │ HTTP (Local)
         ▼
┌─────────────────┐
│   Frontend      │
│   :3000         │
└────────┬────────┘
         │
         │ API
         ▼
┌─────────────────┐
│   Backend       │
│   :8001         │
└─────────────────┘
```

---

## 🔐 Security Notes

### For Demo/Presentation:
- ✅ ngrok free tier is fine
- ✅ Use test accounts (EMP001, EMP002, EMP003)
- ✅ No sensitive data

### For Production:
- ❌ Don't use ngrok free tier
- ✅ Get proper SSL certificate (Let's Encrypt)
- ✅ Use domain name
- ✅ Configure firewall
- ✅ Rate limiting
- ✅ Real user authentication

---

## 🎬 Demo Script Example

**For Presenter:**

1. **Before Demo:**
```bash
# Terminal 1: Start app with network
./scripts/start-with-network.sh

# Note down HTTPS URL
# Example: https://abc123.ngrok.io
```

2. **During Demo:**
```
"Sekarang saya akan demonstrate aplikasi face recognition 
attendance system yang bisa diakses dari mobile device.

[Show QR code on screen]

Silakan scan QR code ini, atau buka URL ini di HP kalian:
https://abc123.ngrok.io

Login dengan:
- Username: EMP001
- Password: admin123

[Wait for students to login]

Sekarang klik menu 'Absensi' di sidebar.
Camera akan otomatis nyala di HP kalian.

[Camera auto-starts on students' phones]

Browser akan minta permission - klik 'Allow'.
Tunggu quality indicator jadi hijau.
Kemudian klik 'Scan Absensi Sekarang'.

[Face recognition works]

Dan... absensi berhasil tercatat! 🎉

Kalian bisa lihat riwayat absensi di sebelah kanan.
"
```

---

## 📞 Support

Jika ada masalah:
1. Check logs: `tail -f /var/log/supervisor/*.log`
2. Restart services: `sudo supervisorctl restart all`
3. Check CORS: Already configured ✅
4. Check ngrok: `curl http://localhost:4040/api/tunnels`

---

## ✅ Checklist untuk Presentasi

**1 Day Before:**
- [ ] ngrok installed & configured
- [ ] Test script: `./scripts/start-with-network.sh`
- [ ] Test dari HP sendiri
- [ ] Camera jalan?
- [ ] Face recognition works?

**Day of Presentation:**
- [ ] Start script early
- [ ] Note down HTTPS URL
- [ ] Generate QR code
- [ ] Test sekali lagi
- [ ] Prepare demo accounts
- [ ] Show ngrok inspector (bonus points!)

**After Demo:**
- [ ] Stop ngrok (Ctrl+C)
- [ ] Backup data if needed
- [ ] Thank students! 🙏

---

## 🎉 That's It!

Aplikasi sekarang bisa diakses dari HP manapun dengan HTTPS!
Camera jalan sempurna! ✅

**Happy Presenting! 🚀**
