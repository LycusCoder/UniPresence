import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceRecord {
  id: number;
  name: string;
  employee_id: string;
  timestamp: string;
  formatted_time?: string;
}

function AttendanceSimple() {
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
  const [attendanceTime, setAttendanceTime] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('🎬 [Init] Component mounted, starting camera...');
    checkAttendanceStatus();
    startCamera();
    loadAttendanceRecords();
    
    return () => {
      console.log('🛑 [Cleanup] Component unmounting, stopping camera...');
      stopCamera();
    };
  }, []);

  const checkAttendanceStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.status === 'success' && response.data.attended) {
        setHasAttendedToday(true);
        setAttendanceTime(response.data.formatted_time || response.data.attendance_time);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const startCamera = async () => {
    console.log('🎥 [Camera] Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ [Camera] Stream obtained');
      
      if (videoRef.current) {
        console.log('✅ [Camera] Video ref exists, attaching stream');
        videoRef.current.srcObject = stream;
        showMessage('✅ Kamera berhasil dihidupkan!', 'success');
      } else {
        console.error('❌ [Camera] Video ref is null');
        showMessage('Error: Video element tidak ditemukan', 'error');
      }
    } catch (error: any) {
      console.error('❌ [Camera] Error:', error);
      let errorMessage = 'Gagal mengakses kamera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Izin kamera ditolak. Mohon klik "Allow".';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Kamera tidak ditemukan.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Kamera sedang digunakan aplikasi lain.';
      } else {
        errorMessage += error.message || 'Error tidak diketahui.';
      }
      
      showMessage(errorMessage, 'error');
    }
  };

  const stopCamera = () => {
    console.log('🛑 [Camera] Stopping camera...');
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log('🛑 [Camera] Stopping track:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
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
    console.log(`📢 [Message] ${type.toUpperCase()}:`, msg);
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleRegister = async () => {
    if (!name.trim() || !employeeId.trim()) {
      showMessage('Nama dan NIP harus diisi', 'error');
      return;
    }

    setIsProcessing(true);
    const imageData = captureImage();
    
    if (!imageData) {
      showMessage('Gagal menangkap gambar dari kamera', 'error');
      setIsProcessing(false);
      return;
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
      setIsRegistering(false);
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
          showMessage('🎉 Absensi berhasil dicatat!', 'success');
          loadAttendanceRecords();
          checkAttendanceStatus();
          
          // Auto close camera after 2 seconds
          setTimeout(() => {
            console.log('✅ [Auto] Closing camera after successful attendance');
            stopCamera();
            setRecognizedUser(null);
          }, 2000);
        } else {
          showMessage('ℹ️ Anda sudah absen hari ini.', 'success');
          setTimeout(() => setRecognizedUser(null), 3000);
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header - Modern & Clean */}
      <header className="bg-white border-b border-gray-200 shadow-lg backdrop-blur-sm bg-white/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-3xl shadow-lg transform hover:scale-105 transition-transform">
                📸
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-orange-600 bg-clip-text text-transparent">
                  Face Attendance
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Sistem Absensi Pintar dengan AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Info Card */}
              <div className="hidden sm:block bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-xl border border-red-200">
                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.employee_id}</p>
              </div>
              
              {/* Register Button - Admin/Manager Only */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  {isRegistering ? '✕ Batal' : '➕ Daftar'}
                </button>
              )}
              
              {/* Back to Dashboard */}
              <Link
                to="/"
                className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2"
              >
                <span className="hidden sm:inline">🏠 Dashboard</span>
                <span className="sm:hidden">🏠</span>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <span className="hidden sm:inline">🚪 Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Message Display - Enhanced */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-2xl shadow-lg border-2 animate-in slide-in-from-top duration-300 ${
              messageType === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300' 
                : 'bg-gradient-to-r from-red-50 to-orange-50 text-red-800 border-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{messageType === 'success' ? '✓' : '⚠️'}</span>
              <span className="font-semibold">{message}</span>
            </div>
          </div>
        )}

        {/* Attendance Status - Beautiful Card */}
        {hasAttendedToday && (
          <div className="mb-8 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl p-6 shadow-2xl text-white transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl animate-bounce">
                ✓
              </div>
              <div>
                <p className="font-bold text-xl mb-1">Anda Sudah Absen Hari Ini! 🎉</p>
                <p className="text-green-100 text-sm flex items-center gap-2">
                  <span className="font-medium">Waktu:</span> {attendanceTime}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Camera Section - Premium Design */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">📸</span>
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Live Camera
                </span>
              </h2>
              {!isRegistering && (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-red-700">LIVE</span>
                </div>
              )}
            </div>
            
            <div className="relative group" data-testid="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-2xl border-4 border-red-500 shadow-2xl transform group-hover:scale-[1.01] transition-transform"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* User Info Overlay - Glassmorphism */}
              <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20">
                <p className="text-sm font-bold drop-shadow-lg">{user?.name}</p>
                <p className="text-xs text-white/90 drop-shadow">{user?.employee_id}</p>
              </div>
              
              {/* Recognized Name Overlay - Success Animation */}
              {recognizedUser && (
                <div 
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl animate-in zoom-in duration-300"
                  data-testid="recognized-name-overlay"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✓</span>
                    <span>{recognizedUser}</span>
                  </div>
                </div>
              )}
              
              {/* Detection Status - Corner Badge */}
              {!isRegistering && (
                <div className="absolute bottom-4 left-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Siap Scan</span>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Absensi Button - Hero Style */}
            {!isRegistering && (
              <div className="mt-8 space-y-4">
                <button
                  onClick={recognizeFace}
                  disabled={isProcessing}
                  className="w-full px-8 py-5 bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white rounded-2xl font-bold text-lg hover:from-red-700 hover:via-red-800 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl hover:shadow-red-500/50 transform hover:-translate-y-1 active:scale-95"
                  data-testid="scan-attendance-button"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📸</span>
                      <span>Scan Absensi Sekarang</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-center text-gray-500 flex items-center justify-center gap-2">
                  <span>✨</span>
                  <span>Pastikan wajah terlihat jelas untuk hasil optimal</span>
                </p>
              </div>
            )}

            {/* Registration Form - Modern Style */}
            {isRegistering && (
              <div className="mt-8 space-y-4" data-testid="registration-form">
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl">
                  <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                    <span className="text-xl">📸</span>
                    <span>Posisikan wajah di tengah frame dengan pencahayaan yang baik</span>
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                      placeholder="Masukkan nama lengkap"
                      data-testid="name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      NIP
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                      placeholder="Masukkan NIP"
                      data-testid="employee-id-input"
                    />
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                    data-testid="submit-registration-button"
                  >
                    {isProcessing ? 'Memproses...' : '✓ Daftarkan Wajah'}
                  </button>
                </div>
              </div>
            )}

            {/* Info Box - Elegant */}
            {!isRegistering && (
              <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-2">Tips untuk Hasil Terbaik:</p>
                    <ul className="text-xs text-blue-800 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Pastikan pencahayaan cukup terang</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Hadapkan wajah langsung ke kamera</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Hindari menggunakan masker atau kacamata hitam</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Records Section - Premium Design */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">📋</span>
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Riwayat Hari Ini
                </span>
              </h2>
              <div className="bg-red-50 px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-red-700">{attendanceRecords.length} Hadir</span>
              </div>
            </div>
            
            <div className="overflow-hidden" data-testid="attendance-table">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="text-7xl mb-4 animate-pulse">📊</div>
                  <p className="text-gray-500 font-bold text-lg">Belum Ada Absensi</p>
                  <p className="text-gray-400 text-sm mt-2">Riwayat akan muncul setelah ada yang absen</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {attendanceRecords.map((record, index) => (
                    <div 
                      key={record.id} 
                      className="p-5 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-2xl border-2 border-red-100 hover:border-red-300 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {record.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{record.name}</h3>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">NIP:</span> {record.employee_id}
                            </p>
                          </div>
                        </div>
                        <span className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                          <span>✓</span>
                          <span>Hadir</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/50 px-3 py-2 rounded-lg">
                        <span className="text-base">🕐</span>
                        <span className="font-medium">
                          {record.formatted_time || formatTimestamp(record.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Custom Scrollbar & Animations */}
      <style>{`
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top {
          animation: slide-in-from-top 0.3s ease-out;
        }
        
        .zoom-in {
          animation: zoom-in 0.3s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ef4444, #f97316);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #dc2626, #ea580c);
        }
      `}</style>
    </div>
  );
}

export default AttendanceSimple;
