import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AttendanceStatus from '../components/AttendanceStatus';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceRecord {
  id: number;
  name: string;
  employee_id: string;
  department?: string;
  position?: string;
  timestamp: string;
  formatted_time?: string;
}

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recognizedUser, setRecognizedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [refreshAttendance, setRefreshAttendance] = useState(0);
  const [registrationMethod, setRegistrationMethod] = useState<'camera' | 'upload'>('camera');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    loadAttendanceRecords();
    
    return () => {
      stopCamera();
    };
  }, []);

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
    
    if (!file.type.startsWith('image/')) {
      showMessage('File harus berupa gambar (JPG, PNG, dll)', 'error');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showMessage('Ukuran file maksimal 5MB', 'error');
      return;
    }
    
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
    if (!name.trim() || !employeeId.trim()) {
      showMessage('Nama dan NIP harus diisi', 'error');
      return;
    }

    setIsProcessing(true);
    
    let imageData: string | null = null;
    
    if (registrationMethod === 'camera') {
      imageData = captureImage();
      if (!imageData) {
        showMessage('Gagal menangkap gambar dari kamera', 'error');
        setIsProcessing(false);
        return;
      }
    } else {
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
        employee_id: employeeId,
        image: imageData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      showMessage(response.data.message, 'success');
      setName('');
      setEmployeeId('');
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
    const imageData = captureImage();
    if (!imageData) {
      showMessage('Gagal menangkap gambar dari kamera', 'error');
      return;
    }

    setIsProcessing(true);

    try {
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
          setRefreshAttendance(prev => prev + 1);
        } else {
          showMessage(response.data.message, 'success');
        }
        
        setTimeout(() => setRecognizedUser(null), 3000);
      } else if (response.data.status === 'error') {
        showMessage(response.data.message, 'error');
        setRecognizedUser(null);
      }
    } catch (error: any) {
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
      const response = await axios.get(`${BACKEND_URL}/api/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAttendanceRecords(response.data.data || []);
    } catch (error) {
      console.error('Gagal memuat riwayat absensi:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">UP</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                  UniPresence Enterprise
                </h1>
                <p className="text-sm text-gray-600">Sistem Manajemen Karyawan</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right" data-testid="user-info">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.employee_id} • 
                  <span className="ml-1 font-medium text-red-600">
                    {user?.role === 'admin' ? '👑 Admin' : user?.role === 'manager' ? '⭐ Manajer' : '👤 Karyawan'}
                  </span>
                </p>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
                  data-testid="register-button"
                >
                  {isRegistering ? '✕ Batal' : '➕ Daftar Wajah Baru'}
                </button>
              )}
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
                data-testid="logout-button"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="mb-8">
          <AttendanceStatus 
            onStatusChange={setHasAttendedToday} 
            triggerRefresh={refreshAttendance}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">📸</span>
              Kamera Real-Time
            </h2>
            
            <div className="relative" data-testid="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-xl border-4 border-red-500 shadow-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-700 bg-opacity-90 text-white px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-xs text-red-100">{user?.employee_id}</p>
              </div>
              
              {recognizedUser && (
                <div 
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg"
                  data-testid="recognized-name-overlay"
                >
                  ✓ {recognizedUser}
                </div>
              )}
              
              {!isRegistering && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                  👤 Siap untuk scan absensi
                </div>
              )}
            </div>

            {!isRegistering && (
              <div className="mt-6">
                <button
                  onClick={recognizeFace}
                  disabled={isProcessing}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                      <span>Scan Absensi Sekarang</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 text-center mt-3">
                  ✨ Klik tombol di atas untuk scan wajah dan catat absensi
                </p>
              </div>
            )}

            {isRegistering && (
              <div className="mt-6 space-y-4" data-testid="registration-form">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg" data-testid="registration-method-toggle">
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationMethod('camera');
                      setUploadedImage(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                      registrationMethod === 'camera'
                        ? 'bg-red-600 text-white'
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
                        ? 'bg-red-600 text-white'
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                    data-testid="upload-method-button"
                  >
                    📁 Upload Foto
                  </button>
                </div>

                {registrationMethod === 'upload' && (
                  <div data-testid="upload-section">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Foto Wajah
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      data-testid="file-upload-input"
                    />
                    {uploadedImage && (
                      <div className="mt-3" data-testid="upload-preview">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img 
                          src={uploadedImage} 
                          alt="Preview foto yang diupload" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-red-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {registrationMethod === 'camera' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                    placeholder="Masukkan nama lengkap"
                    data-testid="name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                    placeholder="Masukkan NIP (contoh: EMP001)"
                    data-testid="employee-id-input"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-registration-button"
                >
                  {isProcessing ? 'Memproses...' : 'Daftarkan Wajah'}
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200">
              <p className="text-sm text-gray-700">
                <strong className="text-red-700">💡 Tips:</strong> Pastikan wajah terlihat jelas dan pencahayaan cukup. 
                Klik tombol "Scan Absensi Sekarang" untuk memulai pengenalan wajah.
              </p>
            </div>
          </div>

          {/* Attendance Records Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">📋</span>
              Riwayat Absensi Hari Ini
            </h2>
            
            <div className="overflow-x-auto" data-testid="attendance-table">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-500 font-medium">Belum ada riwayat absensi hari ini</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
                      <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Nama</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">NIP</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-colors">
                        <td className="py-4 px-4 text-sm font-semibold text-gray-900">{record.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{record.employee_id}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {record.formatted_time || new Date(record.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
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

export default Dashboard;
