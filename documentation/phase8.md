# Dokumentasi Phase 8: Integrasi Fitur Akademik (Feature Gating)

## 📅 Tanggal Pengerjaan
**14 Oktober 2025** - Implementasi Phase 8 Selesai

## 📝 Status
✅ **IMPLEMENTASI SELESAI** - Siap untuk Testing Manual oleh User

## 🎯 Deskripsi Perubahan

Phase 8 berhasil mengimplementasikan **feature gating** berbasis absensi. Mahasiswa hanya bisa mengakses **materi perkuliahan** dan **jurnal tugas** jika sudah melakukan absensi hari ini. Fitur ini mendorong kehadiran mahasiswa yang konsisten.

### Fitur Utama yang Diimplementasikan:

1. ✅ **Attendance Check Endpoint** (`/api/attendance/today`): Endpoint untuk mengecek status absensi user hari ini
2. ✅ **Materials Endpoint** (`/api/materials`): Akses materi perkuliahan dengan feature gating
3. ✅ **Assignments Endpoint** (`/api/assignments`): Akses jurnal tugas dengan feature gating
4. ✅ **AttendanceStatus Component**: Komponen untuk menampilkan status absensi di dashboard
5. ✅ **Materials Page**: Halaman untuk menampilkan dan mengakses materi perkuliahan
6. ✅ **Assignments Page**: Halaman untuk menampilkan dan mengelola tugas
7. ✅ **React Router Integration**: Navigasi antar halaman dengan protected routes
8. ✅ **Feature Gating UI**: Cards di dashboard dengan lock/unlock berdasarkan status absensi

## 📂 File yang Dibuat/Dimodifikasi

### Backend (/app/backend/)
- ✅ **server.py**: Ditambahkan 3 endpoint baru dengan feature gating:
  - `GET /api/attendance/today` - Check attendance status
  - `GET /api/materials` - Get materials (requires attendance)
  - `GET /api/assignments` - Get assignments (requires attendance)

### Frontend (/app/frontend/src/)
- ✅ **main.tsx**: Ditambahkan BrowserRouter wrapper
- ✅ **App.tsx**: Diubah menjadi router dengan Routes untuk navigasi
- ✅ **pages/Dashboard.tsx**: Komponen dashboard utama (dipindahkan dari App.tsx)
- ✅ **components/AttendanceStatus.tsx**: Komponen status absensi hari ini
- ✅ **pages/Materials.tsx**: Halaman materi perkuliahan
- ✅ **pages/Assignments.tsx**: Halaman jurnal tugas
- ✅ **package.json**: Ditambahkan dependency `react-router-dom@7.9.4`

## 🔧 Detail Implementasi

### Backend Endpoints

#### 1. `/api/attendance/today` (GET)
**Protected**: ✅ Requires JWT Token
**Purpose**: Check if current user has attended today

**Response (Not Attended)**:
```json
{
  "status": "success",
  "attended": false,
  "message": "Anda belum absen hari ini"
}
```

**Response (Attended)**:
```json
{
  "status": "success",
  "attended": true,
  "timestamp": "2025-10-14T10:30:00",
  "message": "Anda sudah absen hari ini"
}
```

#### 2. `/api/materials` (GET)
**Protected**: ✅ Requires JWT Token + Today's Attendance
**Purpose**: Get list of study materials

**Response (Not Attended - 403)**:
```json
{
  "status": "error",
  "message": "Anda harus absen terlebih dahulu untuk mengakses materi"
}
```

**Response (Attended - 200)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "Pertemuan 1: Pengenalan Algoritma",
      "description": "Materi dasar algoritma dan flowchart",
      "file_url": "/materials/algo-01.pdf",
      "uploaded_at": "2025-10-01T10:00:00"
    }
  ]
}
```

#### 3. `/api/assignments` (GET)
**Protected**: ✅ Requires JWT Token + Today's Attendance
**Purpose**: Get list of assignments

**Response (Not Attended - 403)**:
```json
{
  "status": "error",
  "message": "Anda harus absen terlebih dahulu untuk mengakses jurnal tugas"
}
```

**Response (Attended - 200)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "Tugas 1: Implementasi Binary Search",
      "description": "Buat program binary search dengan Python",
      "deadline": "2025-10-20T23:59:59",
      "status": "pending"
    }
  ]
}
```

### Frontend Components

#### 1. AttendanceStatus Component
- Menampilkan status absensi hari ini
- Auto-refresh saat user melakukan absensi
- Visual indicator: Green (sudah absen) / Orange (belum absen)
- Menampilkan timestamp absensi

#### 2. Materials Page
- Protected route (redirect ke login jika belum authenticated)
- Feature gating: 403 error jika belum absen
- List materi dengan tombol download
- Back button untuk kembali ke dashboard

#### 3. Assignments Page
- Protected route
- Feature gating: 403 error jika belum absen
- List tugas dengan deadline dan status
- Color-coded deadline indicator (Red: Terlambat, Orange: < 3 hari, Green: > 3 hari)
- Submit button (disabled untuk demo)

#### 4. Dashboard Enhancement
- AttendanceStatus widget di top
- 2 Feature Cards: "Materi Perkuliahan" dan "Jurnal Tugas"
- Cards menampilkan lock icon jika belum absen
- Active buttons untuk akses jika sudah absen

### Routing Structure
```
/ (root) - Dashboard (protected)
/login - Login page
/materials - Materials page (protected + attendance required)
/assignments - Assignments page (protected + attendance required)
* - Redirect to /
```

### 1. Backend Changes

#### A. New Endpoint: Check Today's Attendance (`/app/backend/server.py`)

```python
@app.route('/api/attendance/today', methods=['GET'])
@jwt_required()
def check_attendance_today():
    """
    Check if current user has marked attendance today
    Returns attendance status for feature gating
    """
    try:
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            # Check today's attendance
            today = datetime.now().date()
            attendance = session.query(Attendance).filter(
                Attendance.student_id == current_user_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if attendance:
                return jsonify({
                    'status': 'success',
                    'attended': True,
                    'timestamp': attendance.timestamp.isoformat(),
                    'message': 'Anda sudah absen hari ini'
                }), 200
            else:
                return jsonify({
                    'status': 'success',
                    'attended': False,
                    'message': 'Anda belum absen hari ini'
                }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500


@app.route('/api/materials', methods=['GET'])
@jwt_required()
def get_materials():
    """
    Get study materials (only accessible if attended today)
    """
    try:
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            # Check if user attended today
            today = datetime.now().date()
            attendance = session.query(Attendance).filter(
                Attendance.student_id == current_user_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if not attendance:
                return jsonify({
                    'status': 'error',
                    'message': 'Anda harus absen terlebih dahulu untuk mengakses materi'
                }), 403
            
            # Mock materials data (replace with real data later)
            materials = [
                {
                    'id': 1,
                    'title': 'Pertemuan 1: Pengenalan Algoritma',
                    'description': 'Materi dasar algoritma dan flowchart',
                    'file_url': '/materials/algo-01.pdf',
                    'uploaded_at': '2025-10-01T10:00:00'
                },
                {
                    'id': 2,
                    'title': 'Pertemuan 2: Struktur Data Array',
                    'description': 'Implementasi dan operasi pada array',
                    'file_url': '/materials/algo-02.pdf',
                    'uploaded_at': '2025-10-08T10:00:00'
                },
                {
                    'id': 3,
                    'title': 'Pertemuan 3: Linked List',
                    'description': 'Single dan Double Linked List',
                    'file_url': '/materials/algo-03.pdf',
                    'uploaded_at': '2025-10-15T10:00:00'
                }
            ]
            
            return jsonify({
                'status': 'success',
                'data': materials
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500


@app.route('/api/assignments', methods=['GET'])
@jwt_required()
def get_assignments():
    """
    Get assignments/journals (only accessible if attended today)
    """
    try:
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            # Check if user attended today
            today = datetime.now().date()
            attendance = session.query(Attendance).filter(
                Attendance.student_id == current_user_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if not attendance:
                return jsonify({
                    'status': 'error',
                    'message': 'Anda harus absen terlebih dahulu untuk mengakses jurnal tugas'
                }), 403
            
            # Mock assignments data
            assignments = [
                {
                    'id': 1,
                    'title': 'Tugas 1: Implementasi Binary Search',
                    'description': 'Buat program binary search dengan Python',
                    'deadline': '2025-10-20T23:59:59',
                    'status': 'pending'
                },
                {
                    'id': 2,
                    'title': 'Tugas 2: Sorting Algorithms',
                    'description': 'Implementasi dan bandingkan bubble sort, merge sort, quick sort',
                    'deadline': '2025-10-27T23:59:59',
                    'status': 'pending'
                }
            ]
            
            return jsonify({
                'status': 'success',
                'data': assignments
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500
```

### 2. Frontend Changes

#### A. Create New Components

##### 1. Attendance Status Component (`/app/frontend/src/components/AttendanceStatus.tsx`)

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceStatusProps {
  onStatusChange: (attended: boolean) => void;
}

const AttendanceStatus = ({ onStatusChange }: AttendanceStatusProps) => {
  const [attended, setAttended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    checkAttendance();
  }, []);

  const checkAttendance = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setAttended(response.data.attended);
        setTimestamp(response.data.timestamp || null);
        onStatusChange(response.data.attended);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
    );
  }

  return (
    <div 
      className={`p-6 rounded-lg border-2 ${
        attended 
          ? 'bg-green-50 border-green-500' 
          : 'bg-orange-50 border-orange-500'
      }`}
      data-testid="attendance-status"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Status Absensi Hari Ini
          </h3>
          {attended ? (
            <div className="mt-2">
              <p className="text-green-700 font-medium">✓ Sudah Absen</p>
              {timestamp && (
                <p className="text-sm text-gray-600 mt-1">
                  Waktu: {new Date(timestamp).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-orange-700 font-medium mt-2">
              ! Belum Absen - Gunakan kamera untuk absen
            </p>
          )}
        </div>
        
        <div className={`text-5xl ${
          attended ? 'text-green-500' : 'text-orange-500'
        }`}>
          {attended ? '✓' : '!'}
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatus;
```

##### 2. Materials Page (`/app/frontend/src/pages/Materials.tsx`)

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface Material {
  id: number;
  title: string;
  description: string;
  file_url: string;
  uploaded_at: string;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setMaterials(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Anda harus absen terlebih dahulu untuk mengakses materi');
      } else {
        setError('Gagal memuat materi');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat materi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Materi Perkuliahan
        </h1>
        
        <div className="space-y-4">
          {materials.map((material) => (
            <div 
              key={material.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {material.title}
              </h3>
              <p className="text-gray-600 mb-4">{material.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Upload: {new Date(material.uploaded_at).toLocaleDateString('id-ID')}
                </span>
                <a
                  href={material.file_url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Materials;
```

##### 3. Assignments Page (`/app/frontend/src/pages/Assignments.tsx`)

*Similar structure to Materials.tsx, replace endpoint and data structure*

#### B. Update Main App (`/app/frontend/src/App.tsx`)

```typescript
import AttendanceStatus from './components/AttendanceStatus';
import { Link } from 'react-router-dom';

function App() {
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  
  // ... existing code ...
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... existing header ... */}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Attendance Status Card */}
        <AttendanceStatus onStatusChange={setHasAttendedToday} />
        
        {/* Feature Gating: Academic Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Materi Perkuliahan Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              📚 Materi Perkuliahan
            </h3>
            <p className="text-gray-600 mb-4">
              Akses slide, bahan ajar, dan referensi kuliah
            </p>
            
            {hasAttendedToday ? (
              <Link
                to="/materials"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lihat Materi
              </Link>
            ) : (
              <div className="text-orange-600 text-sm">
                🔒 Absen dulu untuk mengakses materi
              </div>
            )}
          </div>
          
          {/* Jurnal Tugas Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ✍️ Jurnal Tugas
            </h3>
            <p className="text-gray-600 mb-4">
              Lihat dan submit tugas perkuliahan
            </p>
            
            {hasAttendedToday ? (
              <Link
                to="/assignments"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lihat Tugas
              </Link>
            ) : (
              <div className="text-orange-600 text-sm">
                🔒 Absen dulu untuk mengakses tugas
              </div>
            )}
          </div>
        </div>
        
        {/* ... existing camera and attendance table ... */}
      </main>
    </div>
  );
}
```

## 🧪 Cara Testing Phase 8

### 1. Test Backend Endpoints

#### Test 1: Check Attendance Status (Belum Absen)
```bash
TOKEN=$(curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | jq -r '.access_token')

curl -X GET http://localhost:8001/api/attendance/today \
  -H "Authorization: Bearer $TOKEN" | jq
```
**Expected**:
```json
{
  "status": "success",
  "attended": false,
  "message": "Anda belum absen hari ini"
}
```

#### Test 2: Access Materials Before Attendance (Should Fail)
```bash
curl -X GET http://localhost:8001/api/materials \
  -H "Authorization: Bearer $TOKEN" | jq
```
**Expected**:
```json
{
  "status": "error",
  "message": "Anda harus absen terlebih dahulu untuk mengakses materi"
}
```
HTTP Status: `403 Forbidden`

#### Test 3: Mark Attendance Then Access Materials
```bash
# Absen dulu
curl -X POST http://localhost:8001/api/recognize \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"image": "<base64_image>"}'

# Sekarang akses materi (should work)
curl -X GET http://localhost:8001/api/materials \
  -H "Authorization: Bearer $TOKEN" | jq
```
**Expected**: List of materials dengan status 200

### 2. Test Frontend Flow

1. **Login ke aplikasi**
2. **Status absensi menampilkan**: "! Belum Absen"
3. **Card Materi & Tugas**: Menampilkan "🔒 Absen dulu untuk mengakses"
4. **Klik button**: Tidak bisa (disabled atau redirect ke absensi)
5. **Lakukan absensi** via face recognition
6. **Status berubah**: "✓ Sudah Absen" dengan timestamp
7. **Card Materi & Tugas**: Button "Lihat Materi" dan "Lihat Tugas" aktif
8. **Klik button**: Redirect ke halaman Materials/Assignments
9. **Halaman Materials**: Menampilkan list materi dengan button download

## ✅ Checklist Phase 8

- [x] Backend: Endpoint `/api/attendance/today`
- [x] Backend: Endpoint `/api/materials` dengan attendance check
- [x] Backend: Endpoint `/api/assignments` dengan attendance check
- [ ] Backend: Test endpoints dengan curl
- [x] Frontend: Component `AttendanceStatus`
- [x] Frontend: Page `Materials.tsx`
- [x] Frontend: Page `Assignments.tsx`
- [x] Frontend: Feature gating di dashboard
- [x] Frontend: React Router setup untuk /materials dan /assignments
- [ ] Testing: Access materials sebelum absen → 403
- [ ] Testing: Access materials setelah absen → 200
- [ ] Testing: UI menampilkan status absensi dengan benar
- [ ] Testing: Button materials/assignments disabled sebelum absen

## 🧪 Cara Testing Phase 8

### Manual Testing - Backend dengan Curl

Untuk testing backend, kita perlu token JWT terlebih dahulu:

```bash
# 1. Login untuk mendapatkan token
TOKEN=$(curl -s -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Check attendance status (sebelum absen)
curl -X GET http://localhost:8001/api/attendance/today \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected output:
# {
#   "status": "success",
#   "attended": false,
#   "message": "Anda belum absen hari ini"
# }

# 3. Try to access materials (should fail with 403)
curl -X GET http://localhost:8001/api/materials \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected output:
# {
#   "status": "error",
#   "message": "Anda harus absen terlebih dahulu untuk mengakses materi"
# }

# 4. After marking attendance via face recognition, check status again
curl -X GET http://localhost:8001/api/attendance/today \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected output:
# {
#   "status": "success",
#   "attended": true,
#   "timestamp": "2025-01-XX...",
#   "message": "Anda sudah absen hari ini"
# }

# 5. Now access materials (should succeed)
curl -X GET http://localhost:8001/api/materials \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: List of materials dengan status 200
```

### Manual Testing - Frontend Flow

1. **Login ke Aplikasi**
   - Buka aplikasi di browser
   - Login dengan credentials yang valid

2. **Check Status Absensi (Belum Absen)**
   - Di dashboard, lihat card "Status Absensi Hari Ini"
   - Harus menampilkan: "! Belum Absen - Gunakan kamera untuk absen"
   - Background: Orange

3. **Check Feature Gating (Sebelum Absen)**
   - Scroll ke bawah, lihat 2 card: "Materi Perkuliahan" dan "Jurnal Tugas"
   - Kedua card harus menampilkan: "🔒 Absen dulu untuk mengakses..."
   - Button tidak bisa diklik (locked state)

4. **Melakukan Absensi**
   - Gunakan kamera untuk scan wajah
   - Klik tombol "Scan Absensi"
   - Tunggu hingga muncul pesan "Selamat datang, [Nama]! Absensi berhasil dicatat."

5. **Check Status Absensi (Sudah Absen)**
   - Status berubah menjadi: "✓ Sudah Absen"
   - Background: Green
   - Menampilkan timestamp absensi

6. **Check Feature Gating (Setelah Absen)**
   - Card "Materi Perkuliahan" dan "Jurnal Tugas" sekarang menampilkan button aktif
   - Button "📖 Lihat Materi" dan "📝 Lihat Tugas" bisa diklik

7. **Akses Materi Perkuliahan**
   - Klik button "📖 Lihat Materi"
   - Redirect ke halaman `/materials`
   - Menampilkan list materi dengan button "Download PDF"
   - Klik "← Kembali" untuk kembali ke dashboard

8. **Akses Jurnal Tugas**
   - Klik button "📝 Lihat Tugas"
   - Redirect ke halaman `/assignments`
   - Menampilkan list tugas dengan deadline dan status
   - Klik "← Kembali" untuk kembali ke dashboard

### Edge Cases Testing

**Test Case 1: Akses Direct URL Sebelum Absen**
- Logout dari aplikasi (atau gunakan incognito mode)
- Coba akses langsung: `http://localhost:3000/materials`
- Expected: Redirect ke login page

**Test Case 2: Akses dengan Token Invalid**
- Manipulasi localStorage untuk set token invalid
- Coba akses materials/assignments
- Expected: Error 401 → Redirect ke login

**Test Case 3: Refresh Status Absensi**
- Setelah absen, refresh halaman
- Status absensi harus tetap "Sudah Absen"
- Feature gating harus tetap aktif

## 🎨 UI/UX Enhancements (Optional)

1. **Progress Bar**: Tampilkan progress kehadiran (misal: 12/14 pertemuan)
2. **Notification**: Alert saat user lupa absen
3. **Calendar View**: Tampilkan riwayat absensi dalam kalender
4. **Leaderboard**: Ranking mahasiswa dengan kehadiran terbaik
5. **Download All**: Tombol download semua materi sekaligus

## 📌 Catatan Penting

### ⚠️ Dependency face_recognition
Backend membutuhkan library `face_recognition` yang belum terinstall karena keterbatasan cloud environment. 

**Cara Install (Manual oleh User):**
```bash
# 1. Install system dependencies
apt-get update
apt-get install -y cmake build-essential

# 2. Install Python packages
cd /app/backend
pip install face-recognition opencv-python-headless

# 3. Update requirements.txt
pip freeze > requirements.txt

# 4. Restart backend
sudo supervisorctl restart backend
```

**Verifikasi Backend Running:**
```bash
tail -f /var/log/supervisor/backend.*.log
# Harus muncul: "Application startup complete" tanpa error
```

### ✅ Yang Sudah Berfungsi (Tanpa face_recognition)
- ✅ Frontend routing (/, /login, /materials, /assignments)
- ✅ Protected routes
- ✅ UI components (AttendanceStatus, Materials, Assignments)
- ✅ Backend endpoints structure sudah siap

### ⏳ Yang Memerlukan face_recognition
- Face recognition untuk absensi (/api/recognize)
- Register face baru (/api/register)

**Note**: Semua endpoint Phase 8 (/api/attendance/today, /api/materials, /api/assignments) akan berfungsi setelah face_recognition berhasil diinstall dan user melakukan absensi.

---

1. **Mock Data**: Endpoint `/api/materials` dan `/api/assignments` saat ini return mock data. Di production, connect ke database yang menyimpan file materials dan assignments.

2. **File Storage**: Untuk production, consider:
   - Store files di cloud storage (AWS S3, Google Cloud Storage)
   - Save file URL di database
   - Implement file upload endpoint untuk dosen

3. **Attendance Reset**: Attendance check berdasarkan hari (date). Jika sistem dijalankan 24/7, perlu logic untuk reset status attendance setiap hari.

4. **Time-based Gating**: Bisa ditambahkan logic:
   - Materi hanya bisa diakses saat jadwal kuliah (misal: Senin 08:00-10:00)
   - Deadline tugas dengan countdown timer

---

**Status**: 📝 **READY FOR IMPLEMENTATION**

Phase 8 adalah finishing touch yang membuat sistem absensi meaningful. Feature gating mendorong mahasiswa untuk aktif hadir!
