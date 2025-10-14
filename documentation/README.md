# 📚 UniPresence v2.0 - Dokumentasi Project

## 🎯 Ringkasan Project

**UniPresence** adalah sistem absensi berbasis face recognition dengan keamanan tingkat lanjut menggunakan JWT authentication dan role-based access control (RBAC). Sistem ini dirancang untuk mencegah abuse dan memastikan hanya mahasiswa yang benar-benar hadir yang bisa melakukan absensi.

## 🏗️ Tech Stack

### Backend
- **Framework**: Flask 3.1.2
- **Database**: SQLite + SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended (JWT tokens)
- **Face Recognition**: face_recognition library (dlib-based)
- **Password Hashing**: passlib (bcrypt)

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API

## 📋 Development Phases

### ✅ Phase 1-4: Initial Development
**Status**: ✅ COMPLETE

Basic face recognition system implementation.

---

### ✅ Phase 5: Foundation of Security (Auth & Roles)
**Status**: ✅ COMPLETE

**Implemented**:
- JWT authentication system
- Login/logout functionality
- User roles (student, komting, admin)
- Role-based UI rendering
- Persistent authentication dengan localStorage

---

### ✅ Phase 6: Secured & Role-Based Registration
**Status**: ✅ COMPLETE

**Implemented**:
- JWT-protected registration endpoint (`@jwt_required()`)
- Role-based access (hanya komting/admin yang bisa register)
- Upload foto sebagai alternatif webcam
- Enhanced validation (file size, type, face detection)
- Toggle UI antara Camera dan Upload

---

### ✅ Phase 7: Authenticated Attendance Core (The Fix)
**Status**: ✅ COMPLETE & TESTED

**Implemented**:
- JWT-protected attendance endpoint (`@jwt_required()`)
- **1-to-1 face matching** (security fix: user HANYA bisa absen dengan wajahnya sendiri)
- Strict validation (tolak jika >1 wajah terdeteksi)
- Descriptive error messages untuk security failures
- Manual scan dengan tombol eksplisit "Scan Absensi"
- User info overlay di kamera
- Remove continuous auto-scan (better UX & performance)

**Security Impact**:
- 🔒 Prevents spoofing (User A tidak bisa absen pakai wajah User B)
- 🔒 Anti-bypass dengan multiple faces validation
- 🔒 Requires authentication untuk semua attendance operations

---

### 📝 Phase 8: Integrasi Fitur Akademik (Feature Gating)
**Status**: PENDING IMPLEMENTATION

**Fitur**:
- Attendance check endpoint (`/api/attendance/today`)
- Feature gating untuk materials & assignments
- Dashboard dengan status absensi
- Mock pages untuk materi dan jurnal tugas

**Goals**:
- Mendorong mahasiswa untuk hadir dengan insentif akses materi
- Integrate attendance dengan academic features
- Enhance user engagement

**Dokumentasi**: [phase8.md](./phase8.md)

---

## 🔐 Default Accounts

Setelah menjalankan seed script (`python seed.py`), 2 akun berikut akan dibuat:

| Role    | Student ID | Password    | Nama           |
|---------|------------|-------------|----------------|
| Admin   | ADMIN001   | admin123    | Administrator  |
| Komting | KOMTING001 | komting123  | Ketua Komting  |

**⚠️ WARNING**: Ganti password ini sebelum deployment ke production!

## 🚀 Quick Start Guide

### 1. Setup Backend

```bash
cd /app/backend

# Install dependencies
pip install Flask Flask-CORS Flask-JWT-Extended passlib sqlalchemy face_recognition setuptools

# Run seed script (create default accounts)
python seed.py

# Start server
python server.py
```

### 2. Setup Frontend

```bash
cd /app/frontend

# Install dependencies (if needed)
yarn install

# Start dev server
yarn dev
```

### 3. Access Application

- **Frontend**: http://localhost:3000 (atau Emergent preview URL)
- **Backend API**: http://localhost:8001
- **Health Check**: http://localhost:8001/api/health

## 📂 Project Structure

```
/app/
├── backend/
│   ├── instance/
│   │   └── attendance.db          # SQLite database
│   ├── models.py                  # Database models (User, Attendance)
│   ├── seed.py                    # Seed script untuk default accounts
│   ├── server.py                  # Main Flask app dengan endpoints
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.tsx          # Login page
│   │   │   ├── Materials.tsx      # Materials page (Phase 8)
│   │   │   └── Assignments.tsx    # Assignments page (Phase 8)
│   │   ├── components/
│   │   │   └── AttendanceStatus.tsx  # Status component (Phase 8)
│   │   ├── App.tsx                # Main app component
│   │   └── main.tsx               # Entry point
│   └── package.json               # Node dependencies
│
└── documentation/
    ├── README.md                  # This file (Project overview)
    └── phase8.md                  # Phase 8 docs (PENDING)
```

## 🔑 Key Endpoints

### Authentication
- `POST /api/login` - Login user dan dapatkan JWT token
- `GET /api/me` (🔒 protected) - Get current user info

### User Management
- `POST /api/register` (🔒 protected, admin/komting only) - Register new user face
- `GET /api/users` - Get all registered users

### Attendance
- `POST /api/recognize` (🔒 protected, **Phase 7: 1-to-1 matching**) - Face recognition dan mark attendance
- `GET /api/attendance` - Get all attendance records

### Health Check
- `GET /api/health` - Server health check

## 🧪 Testing

### Backend Testing (cURL)

```bash
# Login
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}'

# Get current user (with token)
curl -X GET http://localhost:8001/api/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Frontend Testing

1. Open browser ke http://localhost:3000
2. Login dengan akun test
3. Verify:
   - User info muncul di header
   - Tombol logout visible
   - Role-based buttons (register untuk admin/komting)

## 🐛 Common Issues & Solutions

### Issue 1: "face_recognition module not found"
```bash
pip install setuptools face_recognition
```

### Issue 2: Backend tidak start
Check logs:
```bash
tail -50 /var/log/supervisor/backend.err.log
```

### Issue 3: Frontend CORS error
Pastikan CORS config di `server.py` include frontend URL:
```python
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:3000", "http://localhost:5173"]
}})
```

## 📊 Database Schema

### Table: `users`
| Column        | Type    | Description                      |
|---------------|---------|----------------------------------|
| id            | INTEGER | Primary key                      |
| name          | VARCHAR | User full name                   |
| student_id    | VARCHAR | Unique student ID (NIM)          |
| password      | VARCHAR | Hashed password (bcrypt)         |
| role          | VARCHAR | User role (student/komting/admin)|
| face_encoding | BLOB    | 128-dim face encoding (numpy)    |
| created_at    | DATETIME| Timestamp                        |

### Table: `attendance`
| Column     | Type    | Description                |
|------------|---------|----------------------------|
| id         | INTEGER | Primary key                |
| student_id | VARCHAR | Foreign key to users       |
| timestamp  | DATETIME| Attendance timestamp       |

## 🔒 Security Features

### ✅ Implemented (Phase 5-7)
- ✅ JWT-based authentication
- ✅ Password hashing dengan bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Protected endpoints (`@jwt_required()`)
- ✅ Token expiry (24 hours)
- ✅ JWT-protected registration (komting/admin only)
- ✅ JWT-protected attendance endpoint
- ✅ **1-to-1 face matching** (anti-spoofing)
- ✅ Strict single-face validation (anti-bypass)
- ✅ Descriptive security error messages

### 📝 Planned (Phase 8+)
- Feature gating based on attendance
- Rate limiting untuk API endpoints
- Audit logging untuk security events
- Token refresh mechanism

## 📈 Future Enhancements

### Short-term (Phase 6-8)
- ✅ Complete all pending phases
- Implement real file storage (AWS S3)
- Add materials & assignments upload (untuk dosen)
- Improve error handling & logging

### Long-term
- Multi-class support (berbeda kelas, mata kuliah)
- Schedule-based attendance (sesuai jadwal kuliah)
- Analytics dashboard (untuk dosen)
- Mobile app (React Native)
- Real-time notifications
- Blockchain-based attendance proof

## 🤝 Contributing

### Development Workflow

1. **Pilih phase** yang akan dikerjakan (lihat status di atas)
2. **Baca dokumentasi** phase tersebut di folder `/app/documentation/`
3. **Implement** sesuai panduan
4. **Test** mengikuti test scenarios di dokumentasi
5. **Update status** di dokumentasi ini

### Code Style

- Backend: Follow PEP 8 (Python)
- Frontend: Use ESLint + Prettier
- Commit messages: `[PHASE-X] Description`

## 📞 Support

Jika ada pertanyaan atau issue:

1. Check dokumentasi phase yang relevan
2. Lihat section Troubleshooting
3. Check GitHub issues (jika ada repo)

## 📝 License

[Specify license here]

---

**Last Updated**: October 14, 2025  
**Current Status**: Phase 7 Complete ✅ → Ready for Phase 8  
**Security Level**: 🔒 HIGH (JWT + 1-to-1 Face Matching + Anti-Spoofing)  
**Contributors**: [LycusCoder]
