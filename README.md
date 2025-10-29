# UniPresence - Sistem Absensi Berbasis Face Recognition & QR Code

Aplikasi web absensi cerdas dengan dual method: Face Recognition & QR Code Scanner, menggunakan FastAPI backend dan React TypeScript frontend.

## 🎯 Fitur Utama

### Attendance Methods
- ✅ **Face Recognition** - Deteksi wajah real-time dengan quality checking
- ✅ **QR Code Scanner** - Scan QR code untuk absensi cepat
- ✅ **Dual Tabs Interface** - Switch antara Face & QR mode

### Face Recognition Features
- ✅ Multi-photo registration (3 foto otomatis untuk akurasi tinggi)
- ✅ Real-time face quality checking (blur, brightness, angle)
- ✅ Advanced mask detection (4 detection methods)
- ✅ Live quality indicator dengan recommendations
- ✅ Confidence score untuk setiap recognition

### QR Code Features
- ✅ Encrypted QR code dengan HMAC signature
- ✅ Time-based expiry validation
- ✅ In-memory caching untuk performance
- ✅ Professional E-Card dengan QR code
- ✅ HTML5-QRCode scanner dengan auto-detect

### System Features
- ✅ Role-based access (Admin, Manager, Employee)
- ✅ Attendance restriction (1x per hari)
- ✅ Real-time attendance records
- ✅ Feature gating (absen dulu baru bisa akses settings)
- ✅ Modern UI dengan Tailwind CSS
- ✅ Responsive design

## 🛠️ Tech Stack

**Backend:**
- Python 3.11
- FastAPI
- face_recognition (dengan dlib)
- OpenCV (untuk mask detection)
- SQLAlchemy + SQLite
- QRCode generator dengan encryption
- HMAC-SHA256 security

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Axios
- html5-qrcode
- qrcode.react
- lucide-react icons

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Yarn (recommended) atau npm
- Webcam (untuk Face Recognition)
- Ngrok (optional, untuk internet access)
- CMake (untuk building dlib)

## 🚀 Quick Start

### Option 1: Auto Launcher (Recommended) ⭐

```bash
# Single command - auto install dependencies & start all
./start_services.sh
```

**Features:**
- ✅ Auto-detect Python environment (Conda/System)
- ✅ Always install/update dependencies (pip & yarn)
- ✅ Interactive Ngrok setup
- ✅ Auto-cleanup old processes
- ✅ Colored output dengan error handling
- ✅ Service verification

**Ngrok Mode:**
Saat ditanya Ngrok:
- **Pilih 1 (Ya)** → Frontend akan auto-update menggunakan Ngrok backend URL
- **Pilih 2 (Tidak)** → Mode localhost saja

### Option 2: Manual Setup

#### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

#### Frontend
```bash
cd frontend
yarn install
yarn dev
```

## 🌐 Ngrok Integration (Internet Access)

Script `start_services.sh` punya built-in Ngrok support:

### Setup Ngrok:
```bash
# 1. Install ngrok
# Download dari: https://ngrok.com/download

# 2. Configure authtoken
ngrok config add-authtoken 1tierMCZzGM9F2RriYyLZedwOdx_icpo71rmPCut1E2xqBKz

# 3. Run script
./start_services.sh
# Pilih: 1 (Ya - Ngrok)
```

### Apa yang Terjadi:
1. Backend start di `http://localhost:8001`
2. Ngrok create tunnel: `https://abc123.ngrok.io` → `localhost:8001`
3. Frontend `.env` auto-update ke: `VITE_BACKEND_URL=https://abc123.ngrok.io`
4. Frontend restart dengan ngrok URL
5. **Sekarang aplikasi bisa diakses dari internet dengan aman!**

### Benefits:
- 🌍 Share URL ke teman/dosen untuk demo
- 📱 Test dari HP/tablet di jaringan berbeda
- 🔒 HTTPS encryption otomatis dari ngrok
- 📊 Dashboard monitoring di `http://localhost:4040`

### Restore Config:
Saat Ctrl+C, script otomatis restore `.env` ke localhost.

## 📡 API Endpoints

### Authentication
```
POST /api/login
POST /api/register-user
```

### Face Recognition
```
POST /api/register          # Register new face (multi-photo)
POST /api/recognize         # Recognize face & mark attendance
POST /api/face/analyze      # Check face quality + mask detection
```

### QR Code
```
GET  /api/employee/qrcode/{employee_id}  # Generate QR code
POST /api/attendance/qr                   # Mark attendance via QR
```

### Attendance
```
GET /api/attendance         # Get all attendance records
GET /api/attendance/today   # Check today's attendance status
```

### User Management
```
GET  /api/profile
PUT  /api/profile
PUT  /api/change-password
```

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py                 # FastAPI main server
│   ├── models.py                 # SQLAlchemy models
│   ├── config.py                 # Configuration
│   ├── requirements.txt          # Python dependencies
│   └── utils/
│       ├── mask_detection_cv.py  # Mask detection (OpenCV)
│       └── qrcode_generator.py   # QR code with encryption
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AttendancePageDualTabs.tsx  # Face + QR tabs
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Login.tsx
│   │   ├── components/
│   │   │   ├── ECard.tsx              # E-Card with QR
│   │   │   ├── QRScanner.tsx          # QR scanner
│   │   │   ├── FaceQualityIndicator.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── .env
├── start_services.sh         # Auto launcher v5.0
└── README.md
```

## 💡 Usage Guide

### 1. Registrasi Karyawan Baru (Admin Only)
1. Login sebagai Admin/Manager
2. Buka halaman **Attendance**
3. Klik **"Daftar Karyawan Baru"**
4. Pilih tab **Face Recognition**
5. Isi Nama & NIP
6. Klik **"Mulai Ambil 3 Foto"**
7. Sistem akan auto-capture 3 foto dengan countdown
8. Review foto → Klik **"Daftarkan Sekarang"**

### 2. Absensi via Face Recognition
1. Buka halaman **Attendance**
2. Tab **Face Recognition** (default)
3. Pastikan wajah terlihat jelas di kamera
4. Tunggu quality indicator hijau
5. Klik **"Scan Absensi Sekarang"**
6. Sistem akan recognize & mark attendance

### 3. Absensi via QR Code
1. Buka halaman **Attendance**
2. Switch ke tab **QR Code**
3. Klik **"Aktifkan Scanner"**
4. Scan QR code dari E-Card karyawan
5. Attendance otomatis tercatat

### 4. Download E-Card (dengan QR Code)
1. Login sebagai karyawan
2. Buka **Dashboard** atau **Settings**
3. Lihat section **E-Card**
4. Klik **"Download E-Card"**
5. E-Card berisi QR code untuk quick attendance

### 5. Demo via Internet (Ngrok)
```bash
# Start dengan Ngrok
./start_services.sh
# Pilih: 1 (Ya)

# Share ngrok URL ke audience
# https://abc123.ngrok.io
```

## 🔧 Troubleshooting

### Dependencies tidak terinstall
```bash
# Manual install
cd backend && pip install -r requirements.txt
cd frontend && yarn install
```

### Port sudah digunakan
```bash
# Kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:8001 | xargs kill -9
```

### Ngrok issues
```bash
ngrok version           # Check installation
ngrok config check      # Check authtoken
```

### Camera tidak terdeteksi
- Pastikan browser punya camera permission
- Use HTTPS atau localhost
- Check browser settings

### Face recognition tidak akurat
- Pencahayaan cukup terang
- Wajah langsung ke kamera
- Lepas masker/kacamata
- Jarak 40-60 cm
- Tunggu quality indicator hijau

## 📊 Logs & Debugging

```bash
# View logs
tail -f /tmp/unipresence_backend.log
tail -f /tmp/unipresence_frontend.log
tail -f /tmp/unipresence_ngrok.log

# Check services
lsof -i :8001  # Backend
lsof -i :3000  # Frontend
lsof -i :4040  # Ngrok
```

## 📄 License

MIT License - UniPresence Project 2024
  \"name\": \"Nama Lengkap\",
  \"student_id\": \"20231001\",
  \"detected\": true,
  \"already_marked\": false,
  \"timestamp\": \"2024-10-13T11:20:00\"
}
```

### 4. Get Attendance Records
```
GET /api/attendance
Response: {
  \"status\": \"success\",
  \"data\": [
    {
      \"id\": 1,
      \"name\": \"Nama Lengkap\",
      \"student_id\": \"20231001\",
      \"timestamp\": \"2024-10-13T11:20:00\"
    }
  ]
}
```

### 5. Get All Users
```
GET /api/users
Response: {
  \"status\": \"success\",
  \"data\": [
    {
      \"id\": 1,
      \"name\": \"Nama Lengkap\",
      \"student_id\": \"20231001\",
      \"created_at\": \"2024-10-13T10:00:00\"
    }
  ]
}
```

## 🎨 UI Features

### Header
- Logo Universitas Harkat Negeri
- Judul: \"Sistem Absensi Berbasis Face Recognition\"
- Tombol \"Daftar Wajah Baru\"

### Kamera Real-Time
- Live webcam feed
- Auto-detection setiap 2 detik
- Overlay nama di atas wajah terdeteksi
- Border maroon (#8B0000) untuk kotak deteksi

### Form Registrasi
- Input: Nama Lengkap
- Input: NIM
- Tombol: Daftarkan Wajah
- Validasi: Hanya 1 wajah per registrasi

### Riwayat Absensi
- Tabel minimalis dengan kolom:
  - Nama
  - NIM
  - Waktu Kehadiran
- Auto-refresh setelah absensi berhasil

## 🔒 Security Features

- Face encoding disimpan dalam format binary
- Tolerance matching: 0.6 (untuk akurasi optimal)
- Validasi: Hanya 1 wajah per frame saat registrasi
- Absensi: Maksimal 1x per hari per user

## 🗄️ Database Structure

### Table: users
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| name | STRING | Nama lengkap |
| student_id | STRING | NIM (unique) |
| face_encoding | BINARY | Face embedding (128-d vector) |
| created_at | DATETIME | Timestamp pendaftaran |

### Table: attendance
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| student_id | STRING | Foreign key ke users.student_id |
| timestamp | DATETIME | Waktu absensi (default: now) |

## 📝 Usage Flow

### Registrasi Wajah Baru
1. Klik tombol \"Daftar Wajah Baru\"
2. Isi Nama Lengkap dan NIM
3. Pastikan wajah terlihat jelas di kamera
4. Klik \"Daftarkan Wajah\"
5. Sistem akan menyimpan face encoding ke database

### Absensi Otomatis
1. Wajah terdeteksi setiap 2 detik secara otomatis
2. Jika wajah cocok dengan database:
   - Nama muncul di atas wajah (overlay)
   - Absensi tercatat otomatis (jika belum hari ini)
   - Notifikasi sukses muncul
3. Riwayat absensi ter-update otomatis

## ⚠️ Troubleshooting

### Kamera tidak muncul
- Pastikan browser memiliki izin akses kamera
- Cek apakah kamera sudah digunakan aplikasi lain

### Wajah tidak terdeteksi
- Pastikan pencahayaan cukup
- Wajah harus menghadap kamera
- Jarak ideal: 50-150 cm dari kamera

### Backend error \"face_recognition_models not found\"
```bash
pip install face-recognition-models setuptools
```

### Frontend CORS error
- Pastikan backend running di port 8001
- Cek VITE_BACKEND_URL di /app/frontend/.env

## 📊 Performance Tips

- Face recognition berjalan setiap 2 detik (dapat disesuaikan)
- Database SQLite cocok untuk <1000 users
- Untuk >1000 users, gunakan PostgreSQL
- Tolerance 0.6 memberikan balance antara akurasi dan false negatives

## 🎓 Educational Context

Proyek ini mengintegrasikan konsep **Citra Digital**:
- Face Detection: Haar Cascade Classifier
- Face Recognition: Deep Learning (CNN-based)
- Image Processing: Grayscale conversion, histogram equalization
- Feature Extraction: 128-dimensional face embeddings

## 🌐 Deployment

### Local Development
```bash
bash /app/start_services.sh
```

### Production (dengan Gunicorn)
```bash
cd /app/backend
gunicorn --bind 0.0.0.0:8001 --workers 4 server:app
```

## 📄 License

Proprietary - Universitas Harkat Negeri

## 👨‍💻 Developer

Developed with @LycusCoder for Universitas Harkat Negeri

---

**Last Updated:** October 2025
