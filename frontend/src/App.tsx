import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceRecord {
  id: number;
  name: string;
  student_id: string;
  timestamp: string;
}

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recognizedUser, setRecognizedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera();
    loadAttendanceRecords();
    
    return () => {
      stopCamera();
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
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
      
      // Start continuous recognition
      recognitionIntervalRef.current = window.setInterval(() => {
        if (!isRegistering && !isProcessing) {
          recognizeFace();
        }
      }, 2000);
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

  const handleRegister = async () => {
    if (!name.trim() || !studentId.trim()) {
      showMessage('Nama dan NIM harus diisi', 'error');
      return;
    }

    setIsProcessing(true);
    const imageData = captureImage();
    
    if (!imageData) {
      showMessage('Gagal menangkap gambar', 'error');
      setIsProcessing(false);
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/register`, {
        name,
        student_id: studentId,
        image: imageData
      });

      showMessage(response.data.message, 'success');
      setName('');
      setStudentId('');
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
    if (!imageData) return;

    try {
      const response = await axios.post(`${BACKEND_URL}/api/recognize`, {
        image: imageData
      });

      if (response.data.detected && response.data.name) {
        setRecognizedUser(response.data.name);
        if (!response.data.already_marked) {
          showMessage(`Selamat datang, ${response.data.name}! Absensi tercatat.`, 'success');
          loadAttendanceRecords();
        }
        setTimeout(() => setRecognizedUser(null), 3000);
      } else {
        setRecognizedUser(null);
      }
    } catch (error) {
      // Silently fail for recognition - don't show error messages for continuous recognition
      setRecognizedUser(null);
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
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="px-6 py-2 bg-white text-primary border border-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors duration-200"
              data-testid="register-button"
            >
              {isRegistering ? 'Batal' : 'Daftar Wajah Baru'}
            </button>
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
              
              {/* Recognized Name Overlay */}
              {recognizedUser && (
                <div 
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-lg"
                  data-testid="recognized-name-overlay"
                >
                  {recognizedUser}
                </div>
              )}
              
              {/* Detection Status */}
              {!isRegistering && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                  🔍 Mendeteksi wajah...
                </div>
              )}
            </div>

            {/* Registration Form */}
            {isRegistering && (
              <div className="mt-6 space-y-4" data-testid="registration-form">
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
                Sistem akan mendeteksi wajah secara otomatis setiap 2 detik.
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
