# Dokumentasi Phase 6: Secured & Role-Based Registration

## 📅 Status
**✅ SELESAI DIKERJAKAN** - Tanggal: 2025

## 📝 Ringkasan Implementasi
Phase 6 telah berhasil diimplementasikan dengan perubahan berikut:
1. ✅ Backend endpoint `/api/register` dilindungi dengan `@jwt_required()`
2. ✅ Role validation: Hanya user dengan role `komting` atau `admin` yang dapat mendaftarkan user baru
3. ✅ Frontend: Tombol "Daftar Wajah Baru" hanya muncul untuk admin/komting
4. ✅ Frontend: Menambahkan opsi upload foto sebagai alternatif dari webcam
5. ✅ Frontend: Toggle UI antara Camera dan Upload dengan preview
6. ✅ JWT token disertakan dalam request header untuk autentikasi

## 📝 Deskripsi Phase 6

Phase 6 mengimplementasikan **proteksi endpoint registrasi** dengan JWT dan **role-based access control**. Hanya user dengan role `komting` atau `admin` yang dapat mendaftarkan wajah user baru. Selain itu, ditambahkan fitur upload foto sebagai alternatif dari webcam real-time.

## 🎯 Goals

1. **Protect `/api/register` endpoint** dengan JWT authentication
2. **Role-based access**: Hanya admin/komting yang bisa register user baru
3. **Upload foto option**: Selain webcam, user bisa upload foto dari file
4. **Refactor models.py**: Clean code dengan memisahkan models dari server.py
5. **Validasi ketat**: Pastikan hanya 1 wajah terdeteksi saat registrasi

## 🔧 Perubahan yang Dibutuhkan

### 1. Backend Changes (`/app/backend/server.py`)

#### A. Protect Register Endpoint
```python
# SEBELUM (Phase 5):
@app.route('/api/register', methods=['POST'])
def register():
    # ... existing code ...

# SESUDAH (Phase 6):
@app.route('/api/register', methods=['POST'])
@jwt_required()  # ← Tambahkan decorator JWT
def register():
    # Get current user from JWT
    current_user_id = get_jwt_identity()
    
    session = SessionLocal()
    try:
        # Check user role
        current_user = session.query(User).filter_by(student_id=current_user_id).first()
        
        if not current_user:
            return jsonify({
                'status': 'error',
                'message': 'User tidak ditemukan'
            }), 401
        
        # Role validation: only komting/admin can register
        if current_user.role not in ['komting', 'admin']:
            return jsonify({
                'status': 'error',
                'message': 'Anda tidak memiliki akses untuk mendaftarkan user baru'
            }), 403
        
        # Continue with existing registration logic...
        data = request.get_json()
        # ... rest of the code ...
```

#### B. Improve Image Decoding (Support File Upload)
```python
def decode_base64_image(base64_string):
    """
    Decode base64 string to numpy array
    Supports both webcam stream and file upload
    Returns: (numpy_array, error_string)
    """
    try:
        # Remove data URL prefix if present
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        # Decode base64
        img_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        img = Image.open(io.BytesIO(img_data))
        
        # Convert to RGB (face_recognition requires RGB)
        img_rgb = img.convert('RGB')
        
        # Convert to numpy array
        img_array = np.array(img_rgb)
        
        return img_array, None
    except Exception as e:
        error_msg = f"Error decoding image: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        return None, error_msg
```

### 2. Frontend Changes

#### A. Update `App.tsx` - Add Upload Photo Option

```typescript
// State untuk registration method
const [registrationMethod, setRegistrationMethod] = useState<'camera' | 'upload'>('camera');
const [uploadedImage, setUploadedImage] = useState<string | null>(null);

// Handler untuk file upload
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    showMessage('File harus berupa gambar', 'error');
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showMessage('Ukuran file maksimal 5MB', 'error');
    return;
  }
  
  // Convert to base64
  const reader = new FileReader();
  reader.onloadend = () => {
    setUploadedImage(reader.result as string);
  };
  reader.readAsDataURL(file);
};

// Update handleRegister untuk support upload
const handleRegister = async () => {
  if (!name.trim() || !studentId.trim()) {
    showMessage('Nama dan NIM harus diisi', 'error');
    return;
  }

  setIsProcessing(true);
  
  let imageData: string | null;
  
  if (registrationMethod === 'camera') {
    imageData = captureImage();
  } else {
    imageData = uploadedImage;
  }
  
  if (!imageData) {
    showMessage('Gambar tidak tersedia', 'error');
    setIsProcessing(false);
    return;
  }

  try {
    // Include JWT token in request
    const response = await axios.post(`${BACKEND_URL}/api/register`, {
      name,
      student_id: studentId,
      image: imageData
    }, {
      headers: {
        'Authorization': `Bearer ${token}` // JWT token from AuthContext
      }
    });

    showMessage(response.data.message, 'success');
    setName('');
    setStudentId('');
    setUploadedImage(null);
    setIsRegistering(false);
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Gagal mendaftarkan wajah';
    showMessage(errorMsg, 'error');
  } finally {
    setIsProcessing(false);
  }
};
```

#### B. Update Registration Form UI

```tsx
{isRegistering && (
  <div className="mt-6 space-y-4" data-testid="registration-form">
    {/* Registration Method Toggle */}
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => setRegistrationMethod('camera')}
        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
          registrationMethod === 'camera'
            ? 'bg-blue-600 text-white'
            : 'bg-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        Gunakan Kamera
      </button>
      <button
        type="button"
        onClick={() => setRegistrationMethod('upload')}
        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
          registrationMethod === 'upload'
            ? 'bg-blue-600 text-white'
            : 'bg-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        Upload Foto
      </button>
    </div>
    
    {/* Upload Photo Section */}
    {registrationMethod === 'upload' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Foto Wajah
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        {uploadedImage && (
          <div className="mt-2">
            <img 
              src={uploadedImage} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    )}
    
    {/* Name Input */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Nama Lengkap
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="Masukkan nama lengkap"
        data-testid="name-input"
      />
    </div>
    
    {/* Student ID Input */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        NIM
      </label>
      <input
        type="text"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="Masukkan NIM"
        data-testid="student-id-input"
      />
    </div>
    
    <button
      onClick={handleRegister}
      disabled={isProcessing}
      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      data-testid="submit-registration-button"
    >
      {isProcessing ? 'Memproses...' : 'Daftarkan Wajah'}
    </button>
  </div>
)}
```

## 📂 File yang Dibuat/Dimodifikasi

### Backend Changes
**File: `/app/backend/server.py`**
- Line 191-218: Menambahkan `@jwt_required()` decorator dan role validation pada endpoint `/api/register`
- Role check: Hanya user dengan `role: 'komting'` atau `role: 'admin'` yang dapat mendaftarkan user baru
- Error response: 401 jika user tidak ditemukan, 403 jika user tidak memiliki akses

**Fungsi `decode_base64_image`** (sudah ada, tidak perlu diubah):
- Sudah mendukung Base64 dari webcam maupun file upload
- Dapat menerima format dengan atau tanpa prefix `data:image/jpeg;base64,`

### Frontend Changes
**File: `/app/frontend/src/App.tsx`**

**State baru (Line 27-28):**
```typescript
const [registrationMethod, setRegistrationMethod] = useState<'camera' | 'upload'>('camera');
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
```

**Fungsi baru `handleFileUpload` (Line 95-120):**
- Validasi tipe file (harus image)
- Validasi ukuran file (maksimal 5MB)
- Convert file ke Base64
- Menampilkan pesan sukses/error

**Update `handleRegister` (Line 133-173):**
- Mendukung 2 metode: camera dan upload
- Mengirim JWT token dalam header Authorization
- Reset state setelah berhasil

**UI Updates (Line 346-410):**
- Toggle button untuk memilih Camera atau Upload
- File input dengan preview untuk upload method
- Instruksi untuk camera method
- Preview image untuk uploaded photo

## 🧪 Cara Testing Phase 6

### 1. Test Backend Protection

#### Test 1: Register TANPA token (should fail)
```bash
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "student_id": "123456",
    "image": "data:image/jpeg;base64,..."
  }'
```
**Expected**: `401 Unauthorized` atau `Missing Authorization Header`

#### Test 2: Register dengan token student (should fail)
```bash
# Login sebagai student
TOKEN=$(curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "STUDENT001", "password": "student123"}' \
  | jq -r '.access_token')

# Try to register (should be rejected)
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "New Student",
    "student_id": "999999",
    "image": "data:image/jpeg;base64,..."
  }'
```
**Expected**: `403 Forbidden` dengan message "Anda tidak memiliki akses"

#### Test 3: Register dengan token admin (should success)
```bash
# Login sebagai admin
ADMIN_TOKEN=$(curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "ADMIN001", "password": "admin123"}' \
  | jq -r '.access_token')

# Register new user (should work)
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "New Student",
    "student_id": "202401001",
    "image": "data:image/jpeg;base64,..."
  }'
```
**Expected**: `200 OK` dengan message "Wajah berhasil terdaftar"

### 2. Test Frontend

1. **Login sebagai student**: Tombol "Daftar Wajah Baru" TIDAK muncul ✓
2. **Login sebagai admin/komting**: Tombol "Daftar Wajah Baru" muncul ✓
3. **Klik tombol register**: Form muncul dengan 2 tab (Kamera / Upload)
4. **Test Upload foto**: 
   - Upload file non-image → Error message
   - Upload file > 5MB → Error message
   - Upload foto valid → Preview muncul
5. **Submit registration**: Harus berhasil dengan JWT token included

## ✅ Checklist Phase 6

- [x] Backend: Tambah `@jwt_required()` decorator di `/api/register`
- [x] Backend: Role validation (hanya komting/admin)
- [x] Frontend: State untuk registration method (camera/upload)
- [x] Frontend: Handler untuk file upload dengan validation
- [x] Frontend: UI untuk toggle camera/upload
- [x] Frontend: Send JWT token dalam request header
- [ ] Testing: Register tanpa token → 401 (Untuk user testing)
- [ ] Testing: Register dengan student role → 403 (Untuk user testing)
- [ ] Testing: Register dengan admin role → 200 (Untuk user testing)
- [ ] Testing: Upload foto valid → Success (Untuk user testing)
- [ ] Testing: Upload foto invalid → Error message (Untuk user testing)

## 🐛 Troubleshooting

### Issue 1: "Missing Authorization Header"
**Penyebab**: Frontend tidak mengirim token JWT
**Solusi**: Pastikan header Authorization di-set dengan benar:
```typescript
axios.post(url, data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Issue 2: "403 Forbidden" meskipun user adalah admin
**Penyebab**: Role tidak ter-set dengan benar di database
**Solusi**: Check role di database:
```bash
sqlite3 /app/backend/instance/attendance.db "SELECT student_id, role FROM users;"
```

### Issue 3: Upload foto gagal
**Penyebab**: File size terlalu besar atau format tidak didukung
**Solusi**: Tambahkan validasi di frontend:
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/jpg

## 📌 Catatan Penting

1. **JWT Token**: Pastikan token di-include dalam **semua** request yang memerlukan autentikasi
2. **Role Management**: Role harus di-set saat user dibuat (default: 'student')
3. **Image Validation**: Tetap validate di backend meskipun sudah di frontend
4. **Error Handling**: Berikan error message yang jelas untuk setiap kasus (unauthorized, forbidden, validation error)

## 🔑 Akun Testing yang Tersedia

Untuk melakukan testing, Anda dapat menggunakan akun-akun berikut (sudah di-seed):

```bash
# Jalankan seed script untuk membuat akun testing
cd /app/backend
python seed.py
```

**Akun yang tersedia:**
- **Admin**: `ADMIN001` / `admin123` (role: admin) ✅ Dapat mendaftar user
- **Komting**: `KOMTING001` / `komting123` (role: komting) ✅ Dapat mendaftar user  
- **Student**: Buat user baru melalui registrasi (role: student) ❌ Tidak dapat mendaftar user

## 📋 Panduan Testing Manual

### 1. Test Role-Based Access
1. Login sebagai **Student** → Tombol "Daftar Wajah Baru" **TIDAK MUNCUL**
2. Login sebagai **Admin** atau **Komting** → Tombol "Daftar Wajah Baru" **MUNCUL**

### 2. Test Camera Registration (Admin/Komting)
1. Klik tombol "Daftar Wajah Baru"
2. Pastikan toggle "📷 Gunakan Kamera" aktif (default)
3. Isi Nama dan NIM
4. Klik "Daftarkan Wajah"
5. **Expected**: Berhasil mendaftar dengan foto dari webcam

### 3. Test Upload Registration (Admin/Komting)
1. Klik tombol "Daftar Wajah Baru"
2. Klik toggle "📁 Upload Foto"
3. Klik "Upload Foto Wajah" dan pilih file image
4. **Expected**: Preview foto muncul
5. Isi Nama dan NIM
6. Klik "Daftarkan Wajah"
7. **Expected**: Berhasil mendaftar dengan foto yang diupload

### 4. Test Upload Validation
1. Upload file **non-image** (misalnya .txt atau .pdf)
   - **Expected**: Error "File harus berupa gambar"
2. Upload foto **> 5MB**
   - **Expected**: Error "Ukuran file maksimal 5MB"
3. Upload foto valid tanpa isi Nama/NIM
   - **Expected**: Error "Nama dan NIM harus diisi"

### 5. Test Backend Protection (Opsional - via curl/Postman)
```bash
# Test 1: Register tanpa token
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "student_id": "123", "image": "data:image/jpeg;base64,..."}'
# Expected: 401 Unauthorized

# Test 2: Get token dari student dan coba register
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "STUDENT_ID", "password": "PASSWORD"}'
# Gunakan token untuk register
# Expected: 403 Forbidden
```

---

**Status**: 📝 **IMPLEMENTATION COMPLETE - READY FOR USER TESTING**

Implementasi Phase 6 sudah selesai. Silakan lakukan testing sesuai panduan di atas.
