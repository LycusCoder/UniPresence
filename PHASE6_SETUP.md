# Phase 6 Setup & Testing Guide

## ✅ Status Implementasi
**SELESAI** - Semua kode sudah diimplementasikan

## 📦 Instalasi Dependencies yang Dibutuhkan

### Backend Dependencies (Harus diinstall untuk testing)

```bash
# 1. Install system dependencies (sudah dilakukan)
apt-get update
apt-get install -y cmake build-essential libopenblas-dev liblapack-dev

# 2. Install Python packages
cd /app/backend
pip install Flask-Cors  # ✅ Sudah terinstall
pip install Pillow      # ✅ Sudah terinstall

# 3. Install face_recognition (PERLU DIINSTALL - memakan waktu)
# CATATAN: Instalasi ini membutuhkan waktu 5-10 menit
pip install face-recognition

# Atau install dlib terlebih dahulu, lalu face-recognition
pip install dlib
pip install face-recognition

# 4. Restart backend setelah install
sudo supervisorctl restart backend
```

### Verifikasi Instalasi
```bash
# Test import
cd /app/backend
python -c "import face_recognition; print('✓ face_recognition terinstall')"

# Test server health
curl http://localhost:8001/api/health
# Expected: {"status":"ok","message":"Server is running"}
```

## 🎯 Perubahan yang Sudah Diimplementasikan

### Backend (`/app/backend/server.py`)
✅ Line 191-218: Endpoint `/api/register` dilindungi dengan:
- `@jwt_required()` decorator
- Role validation (hanya admin/komting)
- Error 401 jika user tidak ditemukan
- Error 403 jika role tidak valid (student mencoba register)

### Frontend (`/app/frontend/src/App.tsx`)
✅ Line 27-28: State baru untuk registration method
✅ Line 95-120: Handler `handleFileUpload` dengan validasi
✅ Line 133-173: Update `handleRegister` dengan JWT token & dual method
✅ Line 346-410: UI baru dengan toggle Camera/Upload

## 🧪 Cara Testing

### 1. Seed Database (Buat Akun Testing)
```bash
cd /app/backend
python seed.py
```

**Akun yang tersedia:**
- Admin: `ADMIN001` / `admin123` (dapat register user)
- Komting: `KOMTING001` / `komting123` (dapat register user)

### 2. Test Scenarios

#### A. Test Role-Based Access (UI)
1. Buka aplikasi di browser
2. Login sebagai admin → Button "Daftar Wajah Baru" **MUNCUL** ✓
3. Logout, login sebagai student → Button **TIDAK MUNCUL** ✓

#### B. Test Camera Registration
1. Login sebagai admin/komting
2. Klik "Daftar Wajah Baru"
3. Toggle "📷 Gunakan Kamera" (default aktif)
4. Isi nama & NIM
5. Klik "Daftarkan Wajah"
6. **Expected**: Sukses dengan foto dari kamera

#### C. Test Upload Registration
1. Login sebagai admin/komting
2. Klik "Daftar Wajah Baru"
3. Klik toggle "📁 Upload Foto"
4. Upload foto wajah (.jpg/.png)
5. Lihat preview foto
6. Isi nama & NIM
7. Klik "Daftarkan Wajah"
8. **Expected**: Sukses dengan foto yang diupload

#### D. Test Validasi Upload
1. Upload file non-image → Error "File harus berupa gambar"
2. Upload file > 5MB → Error "Ukuran file maksimal 5MB"
3. Klik "Daftarkan Wajah" tanpa upload foto → Error "Silakan upload foto"

### 3. Test Backend Protection (Optional - via curl)

```bash
# Test 1: Register WITHOUT token
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "student_id": "999999",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
# Expected: {"msg": "Missing Authorization Header"}

# Test 2: Login as admin, then register
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Use token to register (should work)
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "New Student",
    "student_id": "202401001",
    "image": "data:image/jpeg;base64,..."
  }'
# Expected: {"status": "success", "message": "Wajah ... berhasil terdaftar!"}
```

## 📝 Checklist Testing

- [ ] face_recognition terinstall (lihat section Instalasi)
- [ ] Backend server running (check: `curl localhost:8001/api/health`)
- [ ] Frontend running (check: `curl localhost:5173`)
- [ ] Seed database executed (akun ADMIN001 & KOMTING001 tersedia)
- [ ] Login sebagai student → Button "Daftar Wajah Baru" TIDAK muncul
- [ ] Login sebagai admin → Button "Daftar Wajah Baru" MUNCUL
- [ ] Test camera registration → Sukses
- [ ] Test upload registration → Sukses dengan preview
- [ ] Test upload validasi → Error message muncul
- [ ] Test register tanpa JWT token → 401
- [ ] Test register dengan student role → 403

## 🐛 Troubleshooting

### Backend tidak start
```bash
# Check error logs
tail -n 50 /var/log/supervisor/backend.err.log

# Common issue: face_recognition not installed
# Solution: Install dependencies (see section Instalasi)
```

### Frontend tidak start
```bash
# Check status
sudo supervisorctl status frontend

# Check logs
tail -n 30 /var/log/supervisor/frontend.err.log

# Restart if needed
sudo supervisorctl restart frontend
```

### Upload foto tidak berfungsi
- Pastikan browser support FileReader API (modern browsers)
- Check console browser untuk error JavaScript
- Pastikan file yang diupload adalah image (.jpg, .png, dll)

## 📚 Dokumentasi Lengkap
Lihat `/app/documentation/phase6.md` untuk dokumentasi detail implementasi.

---
**Status**: ✅ **Implementation Complete - Ready for Testing**
