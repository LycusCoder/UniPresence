# Dokumentasi Phase 7: Authenticated Attendance Core (The Fix)

## 📅 Status
**BELUM DIKERJAKAN** - Dokumentasi ini adalah panduan untuk implementasi

## 📝 Deskripsi Phase 7

Phase 7 adalah **THE CORE FIX** untuk masalah keamanan absensi. Saat ini, sistem mencocokkan wajah dengan **semua** user di database. Ini memungkinkan user A absen menggunakan wajah user B. 

**Phase 7 mengatasi masalah ini** dengan:
- User harus **login dulu** sebelum bisa absen
- Sistem hanya mencocokkan wajah dengan **encoding milik user yang login**
- Jika wajah tidak cocok dengan akun yang login → **DITOLAK**
- Validasi ketat: **hanya 1 wajah** boleh terdeteksi di frame

## 🎯 Goals

1. **Protect `/api/recognize` endpoint** dengan JWT
2. **1-to-1 Face Matching**: Cocokkan wajah hanya dengan user yang login
3. **Strict Validation**: Tolak jika >1 wajah terdeteksi
4. **Clear Error Messages**: Beri feedback jelas saat wajah tidak cocok
5. **Prevent Spoofing**: User tidak bisa absen pakai wajah orang lain

## 🔧 Perubahan yang Dibutuhkan

### 1. Backend Changes (`/app/backend/server.py`)

#### A. Complete Refactor of `/api/recognize`

```python
@app.route('/api/recognize', methods=['POST'])
@jwt_required()  # ← WAJIB: Protect dengan JWT
def recognize():
    """
    Recognize face and mark attendance
    NEW: Only match against logged-in user's face encoding
    """
    try:
        # Get current logged-in user
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Gambar tidak ditemukan'
            }), 400
        
        image_base64 = data['image']
        
        # Decode image
        img_array, decode_error = decode_base64_image(image_base64)
        if img_array is None:
            return jsonify({
                'status': 'error',
                'message': f'Gagal memproses gambar: {decode_error}',
                'detected': False
            }), 400
        
        # Detect faces
        face_locations = face_recognition.face_locations(img_array)
        
        # STRICT VALIDATION: Must detect exactly 1 face
        if len(face_locations) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Wajah tidak terdeteksi',
                'detected': False
            }), 200
        
        if len(face_locations) > 1:
            return jsonify({
                'status': 'error',
                'message': f'Terdeteksi {len(face_locations)} wajah. Pastikan hanya wajah Anda yang terlihat.',
                'detected': False
            }), 200
        
        # Extract face encoding
        face_encodings = face_recognition.face_encodings(img_array, face_locations)
        
        if len(face_encodings) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Gagal mengekstrak fitur wajah',
                'detected': False
            }), 200
        
        unknown_encoding = face_encodings[0]
        
        # Get ONLY the logged-in user from database
        session = SessionLocal()
        try:
            current_user = session.query(User).filter_by(student_id=current_user_id).first()
            
            if not current_user:
                return jsonify({
                    'status': 'error',
                    'message': 'User tidak ditemukan',
                    'detected': False
                }), 404
            
            # Get the user's face encoding
            known_encoding = np.frombuffer(current_user.face_encoding, dtype=np.float64)
            
            # Compare faces: 1-to-1 matching
            matches = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.6)
            face_distance = face_recognition.face_distance([known_encoding], unknown_encoding)
            
            # If face does NOT match → REJECT
            if not matches[0]:
                return jsonify({
                    'status': 'error',
                    'message': f'Wajah tidak cocok dengan akun {current_user.name}. Silakan gunakan wajah Anda sendiri.',
                    'detected': False,
                    'confidence': float(1 - face_distance[0])
                }), 200
            
            # Face matches! Check if already marked attendance today
            today = datetime.now().date()
            existing_attendance = session.query(Attendance).filter(
                Attendance.student_id == current_user.student_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if existing_attendance:
                return jsonify({
                    'status': 'success',
                    'message': 'Absensi sudah tercatat hari ini',
                    'name': current_user.name,
                    'student_id': current_user.student_id,
                    'already_marked': True,
                    'detected': True,
                    'confidence': float(1 - face_distance[0])
                }), 200
            
            # Mark attendance
            new_attendance = Attendance(student_id=current_user.student_id)
            session.add(new_attendance)
            session.commit()
            
            return jsonify({
                'status': 'success',
                'message': f'Selamat datang, {current_user.name}! Absensi berhasil dicatat.',
                'name': current_user.name,
                'student_id': current_user.student_id,
                'already_marked': False,
                'detected': True,
                'confidence': float(1 - face_distance[0]),
                'timestamp': datetime.now().isoformat()
            }), 200
        
        except Exception as e:
            session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Error: {str(e)}',
                'detected': False
            }), 500
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}',
            'detected': False
        }), 500
```

### 2. Frontend Changes (`/app/frontend/src/App.tsx`)

#### A. Update `recognizeFace` Function

```typescript
const recognizeFace = async () => {
  // Only run recognition if user is authenticated
  if (!isAuthenticated || !token) {
    return;
  }
  
  const imageData = captureImage();
  if (!imageData) return;

  try {
    // Include JWT token in recognize request
    const response = await axios.post(`${BACKEND_URL}/api/recognize`, {
      image: imageData
    }, {
      headers: {
        'Authorization': `Bearer ${token}`  // ← PENTING!
      }
    });

    if (response.data.detected && response.data.name) {
      setRecognizedUser(response.data.name);
      
      if (!response.data.already_marked) {
        showMessage(`${response.data.message}`, 'success');
        loadAttendanceRecords();
      }
      
      setTimeout(() => setRecognizedUser(null), 3000);
    } else if (response.data.status === 'error') {
      // Show error message if face doesn't match
      showMessage(response.data.message, 'error');
    } else {
      setRecognizedUser(null);
    }
  } catch (error: any) {
    // Handle authentication errors
    if (error.response?.status === 401) {
      showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
      logout();
    } else if (error.response?.data?.message) {
      showMessage(error.response.data.message, 'error');
    }
    setRecognizedUser(null);
  }
};
```

#### B. Update useEffect for Continuous Recognition

```typescript
useEffect(() => {
  // Only start camera and recognition if authenticated
  if (isAuthenticated) {
    startCamera();
    loadAttendanceRecords();
  }
  
  return () => {
    stopCamera();
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
    }
  };
}, [isAuthenticated]);  // ← Re-run when auth status changes
```

#### C. Add User Identification Overlay

```tsx
{/* Camera Container */}
<div className="relative" data-testid="camera-container">
  <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    className="w-full rounded-lg border-2 border-blue-600"
  />
  <canvas ref={canvasRef} className="hidden" />
  
  {/* User Info Overlay */}
  <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
    <p className="text-sm font-semibold">{user?.name}</p>
    <p className="text-xs text-gray-300">{user?.student_id}</p>
  </div>
  
  {/* Recognized Name Overlay */}
  {recognizedUser && (
    <div 
      className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg"
      data-testid="recognized-name-overlay"
    >
      ✓ {recognizedUser}
    </div>
  )}
  
  {/* Detection Status */}
  {!isRegistering && (
    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
      🔍 Mendeteksi wajah {user?.name}...
    </div>
  )}
</div>
```

## 🧪 Cara Testing Phase 7

### 1. Test Backend: 1-to-1 Matching

#### Scenario 1: Wajah Cocok (Happy Path)
```bash
# Login sebagai User A
USER_A_TOKEN=$(curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | jq -r '.access_token')

# Ambil foto User A dan kirim untuk recognize
curl -X POST http://localhost:8001/api/recognize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{
    "image": "<base64_foto_user_A>"
  }'
```
**Expected**: 
```json
{
  "status": "success",
  "message": "Selamat datang, Administrator! Absensi berhasil dicatat.",
  "detected": true,
  "already_marked": false
}
```

#### Scenario 2: Wajah TIDAK Cocok (Security Test)
```bash
# Login sebagai User A
USER_A_TOKEN=$(curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | jq -r '.access_token')

# Kirim foto User B (bukan User A!)
curl -X POST http://localhost:8001/api/recognize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{
    "image": "<base64_foto_user_B>"
  }'
```
**Expected**: 
```json
{
  "status": "error",
  "message": "Wajah tidak cocok dengan akun Administrator. Silakan gunakan wajah Anda sendiri.",
  "detected": false,
  "confidence": 0.35
}
```

#### Scenario 3: Multiple Faces Detected
```bash
# Kirim foto dengan 2 wajah
curl -X POST http://localhost:8001/api/recognize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "image": "<base64_foto_2_orang>"
  }'
```
**Expected**: 
```json
{
  "status": "error",
  "message": "Terdeteksi 2 wajah. Pastikan hanya wajah Anda yang terlihat.",
  "detected": false
}
```

### 2. Test Frontend: Complete User Flow

1. **Login sebagai User A (ADMIN001)**
2. **Lihat kamera real-time**: Overlay menampilkan nama user A
3. **Deteksi wajah User A**: 
   - Wajah cocok → "Selamat datang, Administrator!"
   - Overlay hijau muncul dengan nama
   - Absensi tercatat
4. **Coba deteksi lagi**: "Absensi sudah tercatat hari ini"
5. **Test dengan wajah User B**:
   - Suruh teman berdiri di depan kamera
   - Wajah tidak cocok → Error message muncul
   - Absensi TIDAK tercatat

## 🔒 Security Benefits Phase 7

### SEBELUM Phase 7:
```
User A login → Sistem scan semua wajah di DB
             → User B's face detected
             → ❌ User A berhasil absen pakai wajah User B (BUG!)
```

### SESUDAH Phase 7:
```
User A login → Sistem hanya scan wajah User A
             → User B's face detected
             → ✅ DITOLAK: "Wajah tidak cocok dengan akun User A"
             → User A TIDAK bisa absen pakai wajah User B
```

## ✅ Checklist Phase 7

- [ ] Backend: Tambah `@jwt_required()` di `/api/recognize`
- [ ] Backend: Ekstrak `student_id` dari JWT token
- [ ] Backend: Query HANYA user yang login (bukan semua users)
- [ ] Backend: 1-to-1 face comparison
- [ ] Backend: Validasi hanya 1 wajah terdeteksi
- [ ] Backend: Error message jelas saat wajah tidak cocok
- [ ] Frontend: Include JWT token dalam recognize request
- [ ] Frontend: Handle 401 error (redirect ke login)
- [ ] Frontend: Display user info overlay di kamera
- [ ] Frontend: Show error message saat wajah tidak cocok
- [ ] Testing: Login User A → Scan wajah A → Success ✓
- [ ] Testing: Login User A → Scan wajah B → Rejected ✓
- [ ] Testing: Multiple faces → Rejected ✓
- [ ] Testing: No token → 401 Unauthorized ✓

## 🐛 Troubleshooting

### Issue 1: Wajah selalu "tidak cocok" meskipun benar
**Penyebab**: Tolerance terlalu ketat atau encoding rusak
**Solusi**: 
1. Check tolerance value (default: 0.6)
2. Verify face encoding di database
3. Re-register wajah dengan foto yang lebih jelas

### Issue 2: "Unauthorized" terus menerus
**Penyebab**: JWT token expired atau tidak valid
**Solusi**: 
```typescript
// Check token expiry
const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auto logout if expired
if (isTokenExpired()) {
  logout();
}
```

### Issue 3: Camera tidak start setelah login
**Penyebab**: useEffect dependency tidak include `isAuthenticated`
**Solusi**: Update dependency array:
```typescript
useEffect(() => {
  if (isAuthenticated) {
    startCamera();
  }
  return () => stopCamera();
}, [isAuthenticated]);  // ← Add this
```

## 📌 Catatan Penting

1. **Face Tolerance**: Default 0.6 adalah balance antara security dan usability. Jika terlalu ketat (< 0.5), valid user bisa ditolak.
2. **Multiple Faces**: Validasi ini mencegah screenshot dengan banyak orang untuk spoof sistem.
3. **Error Messages**: Beri feedback jelas agar user tahu kenapa absensi ditolak.
4. **Token Expiry**: JWT token expired setelah 24 jam (Phase 5 config). Implement auto-refresh atau re-login.

---

**Status**: 📝 **READY FOR IMPLEMENTATION**

Phase 7 adalah **critical security fix**. Tanpa ini, sistem absensi bisa di-abuse. Prioritaskan implementasi phase ini!
