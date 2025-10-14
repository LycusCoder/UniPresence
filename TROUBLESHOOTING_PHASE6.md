# Troubleshooting Phase 6 - UniPresence

## 🔴 Masalah yang Ditemukan

### 1. ✅ SOLVED: Missing Import `get_jwt`
**Status**: ✅ DIPERBAIKI

**Error**:
```
NameError: name 'get_jwt' is not defined
```

**Solusi** (Sudah diterapkan):
```python
# File: /app/backend/server.py line 3
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
```

---

### 2. ✅ SOLVED: CORS Issue - 500 Error dengan Missing CORS Header
**Status**: ✅ DIPERBAIKI

**Error dari Browser**:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8001/api/register. 
(Reason: CORS header 'Access-Control-Allow-Origin' missing). 
Status code: 500.
```

**Solusi** (Sudah diterapkan di `/app/backend/server.py`):
```python
# CORS Configuration - Updated for better preflight handling
CORS(app, 
     resources={r"/api/*": {
         "origins": ["http://localhost:3000", "http://localhost:5173"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

# Additional CORS error handler for 500 errors
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ["http://localhost:3000", "http://localhost:5173"]:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
```

**Penjelasan Fix**:
- Menambahkan `supports_credentials: True` untuk cookie/auth
- Menambahkan `@app.after_request` handler untuk memastikan CORS headers ada di semua response termasuk error 500
- Menambahkan `expose_headers` untuk Authorization header

---

### 3. ⚠️ ONGOING: face_recognition Installation Issue
**Status**: ⚠️ PERLU INSTALASI MANUAL

**Error**:
```
Please install `face_recognition_models` with this command before using `face_recognition`:
pip install git+https://github.com/ageitgey/face_recognition_models
```

Dan juga:
```
ModuleNotFoundError: No module named 'pkg_resources'
```

**Root Cause**:
- Package `face_recognition_models` tidak terinstall dengan benar
- Missing dependency `pkg_resources` (dari setuptools)

**Solusi untuk Anda**:

#### Opsi 1: Install dengan setuptools (RECOMMENDED)
```bash
# 1. Install setuptools terlebih dahulu
pip install setuptools

# 2. Install face_recognition dari scratch
pip uninstall -y face-recognition face_recognition_models dlib
pip install dlib
pip install face-recognition

# 3. Restart backend
sudo supervisorctl restart backend

# 4. Test
curl http://localhost:8001/api/health
```

#### Opsi 2: Install secara manual
```bash
# 1. Install dependencies system
apt-get update
apt-get install -y cmake build-essential libopenblas-dev liblapack-dev

# 2. Install setuptools
pip install setuptools

# 3. Install dari git
pip install git+https://github.com/ageitgey/face_recognition_models
pip install face-recognition

# 4. Restart
sudo supervisorctl restart backend
```

#### Opsi 3: Gunakan conda (jika tersedia)
```bash
conda install -c conda-forge face_recognition
```

---

### 4. ✅ TESTED: Backend JWT Protection Working
**Status**: ✅ BERHASIL

Menurut checklist Anda:
- ✅ Testing: Register tanpa token → 401 
- ✅ Testing: Register dengan student role → 403
- ✅ Testing: Register dengan admin role → 200

**Code yang sudah bekerja** (`/app/backend/server.py` line 196-205):
```python
# 1. Ambil claims (termasuk role) dari token JWT
claims = get_jwt()
user_role = claims.get('role')

# 2. Lakukan Role Validation
if user_role not in ['admin', 'komting']:
    return jsonify({
        'status': 'error',
        'message': 'Akses ditolak. Hanya Admin atau Komting yang dapat mendaftarkan wajah.'
    }), 403 # HTTP 403 Forbidden
```

---

### 5. ⏳ PENDING: Frontend Upload Testing
**Status**: ⏳ MENUNGGU BACKEND BERJALAN

**Yang masih perlu ditest**:
- [ ] Upload foto valid → Success
- [ ] Upload foto invalid → Error message

**Cara Testing setelah backend berjalan**:
1. Login sebagai admin (`ADMIN001` / `admin123`)
2. Klik "Daftar Wajah Baru"
3. Pilih tab "📁 Upload Foto"
4. Upload foto wajah (.jpg, .png)
5. Isi Nama dan NIM
6. Klik "Daftarkan Wajah"

**Expected**:
- Preview foto muncul setelah upload
- Error jika file > 5MB
- Error jika bukan file image
- Success jika semua valid

---

## 📋 Checklist Status Terkini

### Backend
- [x] `@jwt_required()` decorator di `/api/register` 
- [x] Role validation (hanya komting/admin)
- [x] Import `get_jwt` ditambahkan
- [x] CORS configuration diperbaiki
- [ ] face_recognition dependencies terinstall dengan benar

### Frontend  
- [x] State untuk registration method (camera/upload)
- [x] Handler untuk file upload dengan validation
- [x] UI untuk toggle camera/upload
- [x] Send JWT token dalam request header

### Testing
- [x] Register tanpa token → 401
- [x] Register dengan student role → 403  
- [x] Register dengan admin role → 200
- [ ] Upload foto valid → Success (waiting backend)
- [ ] Upload foto invalid → Error message (waiting backend)

---

## 🔧 Quick Commands untuk Testing

### Check Backend Status
```bash
sudo supervisorctl status backend
tail -n 50 /var/log/supervisor/backend.err.log
```

### Check jika face_recognition berfungsi
```bash
cd /app/backend
python -c "import face_recognition; print('✓ face_recognition OK')"
```

### Test Backend Health
```bash
curl http://localhost:8001/api/health
# Expected: {"status":"ok","message":"Server is running"}
```

### Test Register Endpoint (setelah backend jalan)
```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Test register (perlu foto Base64 yang valid)
# Akan test di browser saja karena perlu capture/upload foto
```

### Restart All Services
```bash
sudo supervisorctl restart all
```

---

## 📝 Summary

### ✅ Yang Sudah Bekerja:
1. Backend JWT protection dengan role validation
2. Frontend UI dengan toggle camera/upload
3. File upload handler dengan validation (type & size)
4. CORS configuration untuk cross-origin requests
5. JWT token dikirim dalam Authorization header

### ⚠️ Yang Masih Perlu Diperbaiki:
1. **face_recognition installation** - Perlu install setuptools + reinstall face_recognition
2. **Upload testing** - Menunggu backend berjalan untuk test upload functionality

### 🎯 Next Steps:
1. Fix face_recognition installation (lihat Opsi 1 di atas)
2. Restart backend dan verify health endpoint
3. Test upload foto dari browser
4. Verify error messages untuk invalid files

---

**Last Updated**: 14 Oktober 2025
