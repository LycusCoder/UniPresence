import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceRecord {
  id: number;
  name: string;
  student_id: string;
  timestamp: string;
}

function App() {
  const { user, token, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recognizedUser, setRecognizedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Phase 6: Registration method and upload support
  const [registrationMethod, setRegistrationMethod] = useState<'camera' | 'upload'>('camera');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only start camera if authenticated
    if (isAuthenticated) {
      startCamera();
      loadAttendanceRecords();
    }
    
    return () => {
      stopCamera();
    };
  }, [isAuthenticated]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      showMessage('Gagal mengakses kamera. Pastikan izin kamera diaktifkan.', 'error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('File harus berupa gambar (JPG, PNG, dll)', 'error');
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
      showMessage('Foto berhasil diupload. Silakan lengkapi data lainnya.', 'success');
    };
    reader.onerror = () => {
      showMessage('Gagal membaca file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!name.trim() || !studentId.trim()) {
      showMessage('Nama dan NIM harus diisi', 'error');
      return;
    }

    setIsProcessing(true);
    
    let imageData: string | null = null;
    
    // Get image based on registration method
    if (registrationMethod === 'camera') {
      imageData = captureImage();
      if (!imageData) {
        showMessage('Gagal menangkap gambar dari kamera', 'error');
        setIsProcessing(false);
        return;
      }
    } else {
      // Upload method
      if (!uploadedImage) {
        showMessage('Silakan upload foto terlebih dahulu', 'error');
        setIsProcessing(false);
        return;
      }
      imageData = uploadedImage;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/register`, {
        name,
        student_id: studentId,
        image: imageData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      showMessage(response.data.message, 'success');
      setName('');
      setStudentId('');
      setUploadedImage(null);
      setIsRegistering(false);
      setRegistrationMethod('camera');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mendaftarkan wajah';
      showMessage(errorMsg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const recognizeFace = async () => {
    // Check authentication
    if (!isAuthenticated || !token) {
      showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
      logout();
      return;
    }

    const imageData = captureImage();
    if (!imageData) {
      showMessage('Gagal menangkap gambar dari kamera', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Include JWT token in request (PHASE 7)
      const response = await axios.post(`${BACKEND_URL}/api/recognize`, {
        image: imageData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success' && response.data.detected) {
        setRecognizedUser(response.data.name);
        
        if (!response.data.already_marked) {
          showMessage(response.data.message, 'success');
          loadAttendanceRecords();
        } else {
          showMessage(response.data.message, 'success');
        }
        
        setTimeout(() => setRecognizedUser(null), 3000);
      } else if (response.data.status === 'error') {
        // Show error message from backend
        showMessage(response.data.message, 'error');
        setRecognizedUser(null);
      }
    } catch (error: any) {
      // Handle authentication errors
      if (error.response?.status === 401) {
        showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        logout();
      } else if (error.response?.data?.message) {
        showMessage(error.response.data.message, 'error');
      } else {
        showMessage('Gagal melakukan pengenalan wajah. Silakan coba lagi.', 'error');
      }
      setRecognizedUser(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance`);
      setAttendanceRecords(response.data.data || []);
    } catch (error) {
      console.error('Gagal memuat riwayat absensi:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_smartface-attend-1/artifacts/d59f7jnx_image.png" 
                alt="Logo Universitas" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">
                  Sistem Absensi Berbasis Face Recognition
                </h1>
                <p className="text-sm text-gray-600">Universitas Harkat Negeri</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="text-right" data-testid="user-info">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.student_id} • {user?.role}</p>
              </div>
              
              {/* Register Button - Show for komting/admin only */}
              {(user?.role === 'admin' || user?.role === 'komting') && (
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  data-testid="register-button"
                >
                  {isRegistering ? 'Batal' : 'Daftar Wajah Baru'}
                </button>
              )}
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                data-testid="logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Message Display */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-lg ${
              messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            data-testid="message-display"
          >
            <div className="flex items-center">
              <span className="text-xl mr-2">{messageType === 'success' ? '✓' : '⚠️'}</span>
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
              Kamera Real-Time
            </h2>
            
            <div className="relative" data-testid="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg border-2 border-primary"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* User Info Overlay - Show logged-in user */}
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
                  👤 Siap untuk scan absensi
                </div>
              )}
            </div>

            {/* Scan Absensi Button - PHASE 7: Explicit manual trigger */}
            {!isRegistering && (
              <div className="mt-6">
                <button
                  onClick={recognizeFace}
                  disabled={isProcessing}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  data-testid="scan-attendance-button"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📸</span>
                      <span>Scan Absensi</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 text-center mt-3">
                  Klik tombol di atas untuk melakukan scan wajah dan mencatat absensi
                </p>
              </div>
            )}

            {/* Registration Form */}
            {isRegistering && (
              <div className="mt-6 space-y-4" data-testid="registration-form">
                {/* Registration Method Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg" data-testid="registration-method-toggle">
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationMethod('camera');
                      setUploadedImage(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                      registrationMethod === 'camera'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                    data-testid="camera-method-button"
                  >
                    📷 Gunakan Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationMethod('upload')}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                      registrationMethod === 'upload'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                    data-testid="upload-method-button"
                  >
                    📁 Upload Foto
                  </button>
                </div>

                {/* Upload Photo Section */}
                {registrationMethod === 'upload' && (
                  <div data-testid="upload-section">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Foto Wajah
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="file-upload-input"
                    />
                    {uploadedImage && (
                      <div className="mt-3" data-testid="upload-preview">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img 
                          src={uploadedImage} 
                          alt="Preview foto yang diupload" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Camera Instructions */}
                {registrationMethod === 'camera' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📸 Posisikan wajah Anda di depan kamera, pastikan pencahayaan cukup dan wajah terlihat jelas.
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Masukkan nama lengkap"
                    data-testid="name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIM
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Masukkan NIM"
                    data-testid="student-id-input"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-registration-button"
                >
                  {isProcessing ? 'Memproses...' : 'Daftarkan Wajah'}
                </button>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>💡 Tips:</strong> Pastikan wajah terlihat jelas dan pencahayaan cukup. 
                Klik tombol "Scan Absensi" untuk memulai pengenalan wajah.
              </p>
            </div>
          </div>

          {/* Attendance Records Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
              Riwayat Absensi Hari Ini
            </h2>
            
            <div className="overflow-x-auto" data-testid="attendance-table">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Belum ada riwayat absensi</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Nama</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">NIM</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm text-gray-900">{record.name}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{record.student_id}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{formatTimestamp(record.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
