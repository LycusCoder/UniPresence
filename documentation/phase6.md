# Dokumentasi Phase 6: Secured & Role-Based Registration

## 📅 Status
**BELUM DIKERJAKAN** - Dokumentasi ini adalah panduan untuk implementasi

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

- [ ] Backend: Tambah `@jwt_required()` decorator di `/api/register`
- [ ] Backend: Role validation (hanya komting/admin)
- [ ] Backend: Test endpoint dengan curl
- [ ] Frontend: State untuk registration method (camera/upload)
- [ ] Frontend: Handler untuk file upload dengan validation
- [ ] Frontend: UI untuk toggle camera/upload
- [ ] Frontend: Send JWT token dalam request header
- [ ] Testing: Register tanpa token → 401
- [ ] Testing: Register dengan student role → 403
- [ ] Testing: Register dengan admin role → 200
- [ ] Testing: Upload foto valid → Success
- [ ] Testing: Upload foto invalid → Error message

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

---

**Status**: 📝 **READY FOR IMPLEMENTATION**

Setelah Phase 6 selesai, lanjut ke Phase 7 untuk implementasi authenticated attendance.
