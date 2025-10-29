# 🎓 PANDUAN PRESENTASI - UniPresence Enterprise

## 📱 Cara Akses dari HP Mahasiswa (QUICK START)

### Step 1: Setup ngrok (Sekali aja!)

```bash
# 1. Buka browser, daftar di: https://ngrok.com/
# 2. Login → Dashboard → Your Authtoken
# 3. Copy authtoken
# 4. Jalankan di terminal:

ngrok config add-authtoken YOUR_TOKEN_DISINI
```

---

### Step 2: Start Aplikasi (Setiap Presentasi)

```bash
cd /app
./scripts/start-with-network.sh
```

**Akan muncul:**
```
✅ HTTPS URL (untuk Mobile/Camera):
   https://abc123.ngrok.io    ← SHARE INI KE MAHASISWA!

📱 QR Code untuk akses cepat:
[QR CODE MUNCUL DI TERMINAL]
```

---

### Step 3: Share ke Mahasiswa

**Option 1: Share URL**
- Copy URL `https://xxx.ngrok.io`
- Share via WhatsApp/Telegram

**Option 2: QR Code**
- Screenshot QR code di terminal
- Share screenshot
- Mahasiswa scan → done!

---

### Step 4: Login & Test

**Mahasiswa buka URL → Login:**
- **EMP001** / **admin123** (Admin)
- **EMP002** / **manager123** (Manager)  
- **EMP003** / **employee123** (Employee)

**Test Camera:**
1. Klik menu "Absensi"
2. Camera auto-start! 🎥
3. Allow permission
4. Tunggu indicator hijau
5. Klik "Scan Absensi"
6. Done! ✅

---

## 🚨 PENTING untuk Presentasi

### Sehari Sebelum:
- [ ] Setup ngrok
- [ ] Test dari HP sendiri
- [ ] Pastikan camera jalan

### Hari Presentasi:
- [ ] Start script 15 menit sebelum
- [ ] Note down HTTPS URL
- [ ] Share URL/QR ke mahasiswa
- [ ] Ready to demo! 🎉

---

## 🐛 Troubleshooting

**Camera tidak jalan?**
- ✅ Pastikan pakai HTTPS URL (bukan HTTP!)
- ✅ Allow camera permission di browser
- ✅ Lighting cukup terang

**Ngrok expired?**
- Free tier: 2 jam per session
- Restart script → URL baru
- Share URL baru ke mahasiswa

---

## 💡 Pro Tips

1. **Buka ngrok inspector:** `http://localhost:4040`
   - Monitor real-time requests
   - Show to audience (impressive!)

2. **Test sebelum presentasi:**
   - Login dari HP sendiri
   - Pastikan camera works
   - Test face recognition

3. **Backup plan:**
   - Screenshot working app
   - Prepare demo video
   - Just in case! 😅

---

## 📞 Quick Commands

```bash
# Start with network
./scripts/start-with-network.sh

# Check services
sudo supervisorctl status all

# Restart services
sudo supervisorctl restart all

# Check logs
tail -f /var/log/supervisor/backend*.log
tail -f /var/log/supervisor/frontend*.log
```

---

**Selamat Presentasi! 🚀**

Untuk detail lengkap, baca: `/app/docs/NETWORK-ACCESS-GUIDE.md`
