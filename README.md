# UniPresence - Sistem Absensi Berbasis Face Recognition

Aplikasi web absensi cerdas dengan deteksi wajah real-time menggunakan Python Flask dan React TypeScript.

## 🎯 Fitur Utama

- ✅ Deteksi wajah real-time menggunakan face_recognition library
- ✅ Overlay nama pengguna di atas wajah terdeteksi
- ✅ Registrasi wajah baru dengan form yang mudah
- ✅ Riwayat absensi otomatis
- ✅ UI minimalis dengan tema maroon Universitas Harkat Negeri
- ✅ Pencatatan absensi otomatis hanya sekali per hari

## 🛠️ Tech Stack

**Backend:**
- Python 3.11
- Flask 2.3.3
- face_recognition 1.3.0 (dengan dlib)
- SQLAlchemy 2.0.23
- SQLite database

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS (tema maroon #8B0000)
- Axios untuk API calls

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Yarn
- CMake (untuk building dlib)
- Webcam

## 🚀 Setup & Installation

### Backend Setup

```bash
cd /app/backend

# Install dependencies
pip install -r requirements.txt

# Start backend server
python server.py
```

Backend akan berjalan di `http://localhost:8001`

### Frontend Setup

```bash
cd /app/frontend

# Install dependencies
yarn install

# Start development server
yarn dev
```

Frontend akan berjalan di `http://localhost:3000`

### Start Both Services

```bash
# From project root
bash /app/start_services.sh
```

## 📡 API Endpoints

### 1. Health Check
```
GET /api/health
Response: { \"status\": \"ok\", \"message\": \"Server is running\" }
```

### 2. Register New Face
```
POST /api/register
Body: {
  \"name\": \"Nama Lengkap\",
  \"student_id\": \"20231001\",
  \"image\": \"base64_image_string\"
}
Response: { \"status\": \"success\", \"message\": \"Wajah berhasil terdaftar!\" }
```

### 3. Recognize Face
```
POST /api/recognize
Body: {
  \"image\": \"base64_image_string\"
}
Response: {
  \"status\": \"success\",
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
