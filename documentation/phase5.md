# Dokumentasi Phase 5: Foundation of Security (Auth & Roles)

## 📅 Tanggal Pengerjaan
14 Oktober 2025

## 📝 Deskripsi Perubahan

Phase 5 mengimplementasikan sistem autentikasi berbasis JWT (JSON Web Token) dan Role-Based Access Control (RBAC) untuk UniPresence. Ini adalah fondasi keamanan yang memungkinkan user login dengan password dan membatasi akses berdasarkan role (student, komting, admin).

### Perubahan Utama:

#### 1. **Backend (Flask + SQLite)**
- ✅ Menambahkan kolom `password` (hashed dengan bcrypt) dan `role` ke model `User`
- ✅ Mengimplementasikan JWT authentication dengan Flask-JWT-Extended
- ✅ Membuat endpoint `/api/login` untuk autentikasi user
- ✅ Membuat endpoint `/api/me` (protected) untuk mendapatkan info user yang login
- ✅ Membuat seed script untuk create akun admin dan komting default

#### 2. **Frontend (React + TypeScript)**
- ✅ Membuat `AuthContext` untuk state management autentikasi global
- ✅ Membuat komponen `Login.tsx` dengan UI modern
- ✅ Implementasi role-based UI: tombol "Daftar Wajah Baru" hanya muncul untuk komting/admin
- ✅ Menambahkan tombol logout dan user info di header
- ✅ Persistent authentication dengan localStorage

#### 3. **Database Migration**
- ✅ Upgrade schema `users` table dengan kolom baru:
  - `password` (VARCHAR, nullable): Password hash dengan bcrypt
  - `role` (VARCHAR, default='student'): User role untuk RBAC

## 📂 File yang Dibuat/Dimodifikasi

### Backend Files:
```
/app/backend/
├── models.py                    [BARU] - Database models (User, Attendance)
├── seed.py                      [BARU] - Script untuk create akun default
├── server.py                    [MODIFIED] - Tambah endpoint login, me, dan JWT config
└── instance/attendance.db       [MODIFIED] - Schema upgrade otomatis
```

### Frontend Files:
```
/app/frontend/src/
├── contexts/
│   └── AuthContext.tsx          [BARU] - Global auth state management
├── pages/
│   └── Login.tsx                [BARU] - Halaman login
├── main.tsx                     [MODIFIED] - Wrap app dengan AuthProvider
└── App.tsx                      [MODIFIED] - Role-based UI, logout button
```

## 🔐 Akun Default yang Dibuat

Seed script telah membuat 2 akun default:

| Role    | NIM/Student ID | Password    | Nama           |
|---------|----------------|-------------|----------------|
| Admin   | ADMIN001       | admin123    | Administrator  |
| Komting | KOMTING001     | komting123  | Ketua Komting  |

**Catatan**: Password ini hanya untuk development. Di production, harus diganti segera!

## 🧪 Cara Testing

### 1. Test Backend API

#### Test Login Endpoint:
```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "ADMIN001",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Login berhasil",
  "access_token": "eyJhbGc...",
  "user": {
    "student_id": "ADMIN001",
    "name": "Administrator",
    "role": "admin"
  }
}
```

#### Test Get Current User (Protected Endpoint):
```bash
# Ganti <TOKEN> dengan access_token dari response login
curl -X GET http://localhost:8001/api/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected Response:**
```json
{
  "status": "success",
  "user": {
    "student_id": "ADMIN001",
    "name": "Administrator",
    "role": "admin",
    "created_at": "2025-10-14T00:26:47.167682"
  }
}
```

### 2. Test Frontend

1. Buka browser ke `http://localhost:3000` (atau URL preview Emergent)
2. Halaman login akan muncul otomatis
3. Login dengan akun test:
   - **Admin**: ADMIN001 / admin123
   - **Komting**: KOMTING001 / komting123
4. Setelah login berhasil:
   - User info muncul di header (nama, NIM, role)
   - Tombol "Daftar Wajah Baru" muncul (untuk admin/komting)
   - Tombol "Logout" muncul di header
5. Test role-based access:
   - Login sebagai student (buat user baru): tombol "Daftar Wajah Baru" TIDAK muncul
   - Login sebagai admin/komting: tombol "Daftar Wajah Baru" muncul

### 3. Test Logout
1. Klik tombol "Logout"
2. Akan redirect ke halaman login
3. Token JWT dihapus dari localStorage
4. Coba akses halaman utama: akan redirect ke login lagi

## 🔧 Konfigurasi JWT

JWT Secret Key disimpan di `server.py`:
```python
app.config['JWT_SECRET_KEY'] = 'unipresence-secret-key-2024-change-this-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
```

**PENTING**: Ubah `JWT_SECRET_KEY` di production dengan string random yang aman!

## 🐛 Known Issues & Troubleshooting

### Issue 1: "face_recognition module not found"
**Solusi**: Install dependencies yang dibutuhkan:
```bash
cd /app/backend
pip install Flask Flask-CORS Flask-JWT-Extended passlib sqlalchemy face_recognition setuptools
```

### Issue 2: Login API gagal dengan CORS error
**Solusi**: Pastikan CORS sudah dikonfigurasi dengan benar di `server.py`:
```python
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:3000", "http://localhost:5173"],
    "allow_headers": ["Content-Type", "Authorization"]
}})
```

### Issue 3: Token expired
**Solusi**: Token valid selama 24 jam. Setelah expired, user harus login ulang.

## ✅ Checklist Testing Phase 5

- [x] Backend dapat start tanpa error
- [x] Endpoint `/api/login` berfungsi dan mengembalikan JWT token
- [x] Endpoint `/api/me` protected dan memerlukan JWT token
- [x] Password hashed dengan bcrypt (tidak plain text)
- [x] Frontend dapat login dengan akun test
- [x] User info muncul di header setelah login
- [x] Tombol logout berfungsi dan menghapus token
- [x] Role-based UI: tombol register hanya muncul untuk admin/komting
- [x] Persistent auth: refresh page tidak logout user

## 🚀 Langkah Selanjutnya (Phase 6)

Phase 6 akan mengimplementasikan **Secured & Role-Based Registration**:
- Protect endpoint `/api/register` dengan JWT
- Hanya komting/admin yang bisa register user baru
- Tambah opsi upload foto atau gunakan kamera real-time
- Validasi lebih ketat untuk registrasi wajah

## 📌 Catatan Teknis

### Password Hashing
- Menggunakan `passlib.hash.bcrypt` dengan salt otomatis
- Hash disimpan di database, plain password TIDAK disimpan
- Verifikasi menggunakan `bcrypt.verify(plain_password, hashed_password)`

### JWT Token Structure
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "sub": "ADMIN001",           // student_id
  "name": "Administrator",     // additional claim
  "role": "admin",             // additional claim
  "exp": 1760489041           // expiration timestamp
}
```

### State Management
- Frontend menggunakan React Context API (`AuthContext`)
- Token disimpan di localStorage untuk persistent auth
- Axios default header di-set otomatis setelah login

---

**Status Phase 5**: ✅ **COMPLETE & TESTED**

Semua fitur Phase 5 sudah diimplementasikan dan tested. Ready untuk review dan lanjut ke Phase 6!
