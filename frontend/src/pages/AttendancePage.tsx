import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import FaceQualityIndicator from '../components/FaceQualityIndicator';
import { 
  Camera, 
  Video, 
  VideoOff,
  Scan,
  CheckCircle2,
  XCircle,
  UserPlus,
  X,
  ClipboardList,
  Clock,
  User,
  Building2,
  Eye,
  Loader2,
  Info
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceRecord {
  id: number;
  name: string;
  employee_id: string;
  department?: string;
  position?: string;
  timestamp: string;
  formatted_time?: string;
  check_in_type?: string;
  confidence_score?: number;
}

interface QualityMetrics {
  overall_score: number;
  blur_score: number;
  brightness_score: number;
  size_score: number;
  angle_score: number;
  face_dimensions?: {
    width: number;
    height: number;
  };
}

interface MaskDetection {
  detected: boolean;
  confidence: number;
  reason: string;
}

interface QualityResult {
  status: string;
  message: string;
  quality_metrics?: QualityMetrics;
  mask_detection?: MaskDetection;
  is_acceptable?: boolean;
  recommendation?: string;
}

function AttendancePage() {
  const { user, token, logout } = useAuth();
  
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStartingCameraRef = useRef(false);
  
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const [qualityCheckInterval, setQualityCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState<string>('');
  const [recognizedUser, setRecognizedUser] = useState<string | null>(null);
  
  // Multi-Photo Registration States
  const [isCapturingMulti, setIsCapturingMulti] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const TOTAL_PHOTOS = 3;
  const PHOTO_DELAY_MS = 3000; // 3 seconds between photos

  useEffect(() => {
    return () => {
      // Only cleanup if camera is not currently starting (prevents StrictMode race condition)
      if (!isStartingCameraRef.current) {
        stopCamera();
      }
      if (qualityCheckInterval) {
        clearInterval(qualityCheckInterval);
      }
    };
  }, []);

  useEffect(() => {
    checkAttendanceStatus();
    loadAttendanceRecords();
    
    // Auto-start camera saat halaman load (kecuali mode registrasi)
    if (!isRegistering) {
      console.log('🚀 [Auto-Start] Starting camera automatically...');
      setTimeout(() => {
        startCamera();
      }, 500); // Small delay untuk mounting
    }
  }, []);

  const startCamera = async () => {
    console.log('🎥 [Camera] Starting camera...');
    isStartingCameraRef.current = true; // Set guard
    setIsCameraLoading(true);
    
    try {
      // Set isCameraOn TRUE dulu agar video element di-render
      setIsCameraOn(true);
      
      // Wait sebentar untuk video element mounting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ [Camera] Stream obtained successfully');
      
      if (!videoRef.current) {
        console.error('❌ [Camera] Video ref is null');
        showMessage('Error: Video element tidak tersedia. Silakan coba lagi.', 'error');
        stream.getTracks().forEach(track => track.stop());
        setIsCameraOn(false);
        setIsCameraLoading(false);
        isStartingCameraRef.current = false; // Release guard
        return;
      }
      
      // Assign stream ke video element
      videoRef.current.srcObject = stream;
      console.log('✅ [Camera] Stream assigned to video element');
      
      // Explicitly play the video (required for some browsers)
      try {
        await videoRef.current.play();
        console.log('✅ [Camera] Video playback started');
      } catch (playError) {
        console.warn('⚠️ [Camera] Auto-play might be blocked:', playError);
      }
      
      showMessage('✅ Kamera berhasil dinyalakan!', 'success');
      
      // Start real-time quality checking setelah 1 detik
      setTimeout(() => {
        const interval = setInterval(() => {
          checkFaceQualityRealtime();
        }, 3000);
        setQualityCheckInterval(interval);
        console.log('✅ [Camera] Quality monitoring started');
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ [Camera] Error:', error);
      setIsCameraOn(false);
      
      let errorMessage = 'Gagal mengakses kamera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Izin kamera ditolak. Mohon izinkan akses kamera.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Kamera tidak ditemukan di perangkat Anda.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Kamera sedang digunakan oleh aplikasi lain.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Akses kamera via network memerlukan HTTPS.';
      } else {
        errorMessage += error.message || 'Error tidak diketahui.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setIsCameraLoading(false);
      isStartingCameraRef.current = false; // Release guard
    }
  };

  const stopCamera = () => {
    console.log('🛑 [Camera] Stopping camera...');
    
    if (qualityCheckInterval) {
      clearInterval(qualityCheckInterval);
      setQualityCheckInterval(null);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log('🛑 [Camera] Stopping track:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOn(false);
    setQualityResult(null);
    showMessage('Kamera dimatikan', 'success');
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ [Capture] Video or canvas ref is null');
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('❌ [Capture] Video not ready');
      return null;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ [Capture] Cannot get canvas context');
      return null;
    }
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const checkFaceQualityRealtime = async () => {
    if (!isCameraOn || isCheckingQuality) return;
    
    const imageData = captureImage();
    if (!imageData) return;
    
    setIsCheckingQuality(true);
    
    try {
      const response = await axios.post<QualityResult>(
        `${BACKEND_URL}/api/face/analyze`,
        { image: imageData, check_mask: true },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success' || response.data.status === 'warning') {
        setQualityResult(response.data);
      } else {
        setQualityResult(null);
      }
    } catch (error: any) {
      console.error('Error checking face quality:', error);
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const checkAttendanceStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.status === 'success' && response.data.attended) {
        setHasAttendedToday(true);
        setAttendanceTime(response.data.formatted_time || response.data.timestamp);
      }
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }
  };

  const recognizeFace = async () => {
    if (!qualityResult?.is_acceptable) {
      showMessage('⚠️ Kualitas wajah belum memenuhi standar. Perbaiki posisi dan pencahayaan.', 'error');
      return;
    }
    
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.status === 'success' && response.data.detected) {
        setRecognizedUser(response.data.name);
        
        if (!response.data.already_marked) {
          showMessage(`🎉 Absensi berhasil dicatat! Selamat datang, ${response.data.name}`, 'success');
          loadAttendanceRecords();
          checkAttendanceStatus();
          
          setTimeout(() => {
            stopCamera();
            setRecognizedUser(null);
          }, 2000);
        } else {
          showMessage('ℹ️ Anda sudah absen hari ini.', 'success');
          setTimeout(() => setRecognizedUser(null), 3000);
        }
      } else {
        showMessage(response.data.message || 'Wajah tidak dikenali', 'error');
        setRecognizedUser(null);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        logout();
      } else {
        showMessage(error.response?.data?.message || 'Gagal melakukan pengenalan wajah', 'error');
      }
      setRecognizedUser(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setAttendanceRecords(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  // Multi-Photo Capture Functions
  const startMultiPhotoCapture = () => {
    if (!regName.trim() || !regEmployeeId.trim()) {
      showMessage('Nama dan NIP harus diisi sebelum memulai', 'error');
      return;
    }
    
    setCapturedPhotos([]);
    setCurrentPhotoIndex(0);
    setIsCapturingMulti(true);
    setCountdown(3);
    
    // Start countdown for first photo
    startCountdownForPhoto(0);
  };
  
  const startCountdownForPhoto = (photoIndex: number) => {
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        capturePhotoAtIndex(photoIndex);
      }
    }, 1000);
  };
  
  const capturePhotoAtIndex = (photoIndex: number) => {
    const imageData = captureImage();
    
    if (!imageData) {
      showMessage(`Gagal menangkap foto ke-${photoIndex + 1}`, 'error');
      setIsCapturingMulti(false);
      return;
    }
    
    // Add photo to array
    setCapturedPhotos(prev => [...prev, imageData]);
    
    // Check if we need more photos
    if (photoIndex + 1 < TOTAL_PHOTOS) {
      setCurrentPhotoIndex(photoIndex + 1);
      // Wait PHOTO_DELAY_MS then start countdown for next photo
      setTimeout(() => {
        startCountdownForPhoto(photoIndex + 1);
      }, PHOTO_DELAY_MS);
    } else {
      // All photos captured!
      setIsCapturingMulti(false);
      setCountdown(0);
      showMessage(`✅ ${TOTAL_PHOTOS} foto berhasil diambil! Silakan review dan submit.`, 'success');
    }
  };
  
  const retakePhoto = (photoIndex: number) => {
    setCountdown(3);
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        
        const imageData = captureImage();
        if (imageData) {
          // Replace photo at index
          setCapturedPhotos(prev => {
            const newPhotos = [...prev];
            newPhotos[photoIndex] = imageData;
            return newPhotos;
          });
          showMessage(`✅ Foto ke-${photoIndex + 1} berhasil diambil ulang!`, 'success');
        } else {
          showMessage('Gagal menangkap gambar', 'error');
        }
        setCountdown(0);
      }
    }, 1000);
  };
  
  const cancelMultiPhotoCapture = () => {
    setCapturedPhotos([]);
    setCurrentPhotoIndex(0);
    setIsCapturingMulti(false);
    setCountdown(0);
  };

  const handleRegisterMultiPhoto = async () => {
    if (capturedPhotos.length !== TOTAL_PHOTOS) {
      showMessage(`Diperlukan ${TOTAL_PHOTOS} foto untuk registrasi`, 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/register`, {
        name: regName,
        employee_id: regEmployeeId,
        images: capturedPhotos  // Send array of 3 images
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      showMessage(response.data.message, 'success');
      setRegName('');
      setRegEmployeeId('');
      setCapturedPhotos([]);
      setIsRegistering(false);
      loadAttendanceRecords();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal mendaftarkan wajah', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
    // Legacy single photo registration (for backward compatibility)
    if (!regName.trim() || !regEmployeeId.trim()) {
      showMessage('Nama dan NIP harus diisi', 'error');
      return;
    }

    if (!qualityResult?.is_acceptable) {
      showMessage('⚠️ Kualitas wajah belum memenuhi standar untuk registrasi', 'error');
      return;
    }

    const imageData = captureImage();
    if (!imageData) {
      showMessage('Gagal menangkap gambar dari kamera', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/register`, {
        name: regName,
        employee_id: regEmployeeId,
        image: imageData
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      showMessage(response.data.message, 'success');
      setRegName('');
      setRegEmployeeId('');
      setIsRegistering(false);
      loadAttendanceRecords();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Gagal mendaftarkan wajah', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar activeTab="attendance" setActiveTab={() => {}} />
      
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
          {message && (
            <div 
              className={`p-4 rounded-xl shadow-lg border-2 ${
                messageType === 'success' 
                  ? 'bg-green-50 text-green-800 border-green-300' 
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {messageType === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                <span className="font-semibold">{message}</span>
              </div>
            </div>
          )}

          {hasAttendedToday && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl text-white">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-xl">Anda Sudah Absen Hari Ini!</p>
                  <p className="text-green-100 flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{attendanceTime}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  if (!isRegistering && !isCameraOn) {
                    startCamera();
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg flex items-center gap-2"
              >
                {isRegistering ? (
                  <><X className="w-5 h-5" /> Batal Registrasi</>
                ) : (
                  <><UserPlus className="w-5 h-5" /> Daftar Karyawan Baru</>
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-7 h-7 text-red-600" />
                  <span>Kamera</span>
                </h2>
                {isCameraOn && !isRegistering && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                    <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-red-700">LIVE</span>
                  </div>
                )}
              </div>
              
              <div className="relative mb-6">
                {!isCameraOn ? (
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                    <VideoOff className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">Kamera Mati</p>
                    <p className="text-gray-400 text-sm mt-1">Nyalakan kamera untuk memulai</p>
                  </div>
                ) : (
                  <div className="relative group">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-xl border-4 border-red-500 shadow-2xl"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-xs text-white/80">{user?.employee_id}</p>
                    </div>
                    
                    {recognizedUser && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{recognizedUser}</span>
                      </div>
                    )}
                    
                    {isCheckingQuality && (
                      <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 animate-pulse" />
                        <span>Memeriksa...</span>
                      </div>
                    )}
                    
                    {/* Multi-Photo Capture Countdown Overlay */}
                    {(isCapturingMulti || countdown > 0) && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                        <div className="text-center">
                          {countdown > 0 ? (
                            <>
                              <div className="text-9xl font-bold text-white animate-bounce mb-4">
                                {countdown}
                              </div>
                              <p className="text-xl text-white font-semibold mb-2">
                                Foto {currentPhotoIndex + 1} dari {TOTAL_PHOTOS}
                              </p>
                              <p className="text-sm text-white/80">
                                Hadapkan wajah ke kamera & tetap diam
                              </p>
                            </>
                          ) : (
                            <>
                              <Camera className="w-16 h-16 text-white animate-pulse mb-4 mx-auto" />
                              <p className="text-xl text-white font-semibold">
                                Menangkap foto {currentPhotoIndex + 1}...
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {!isCameraOn ? (
                  <button
                    onClick={startCamera}
                    disabled={isCameraLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                  >
                    {isCameraLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menghidupkan Kamera...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5" />
                        <span>Nyalakan Kamera</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopCamera}
                      className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                    >
                      <VideoOff className="w-5 h-5" />
                      <span>Matikan Kamera</span>
                    </button>
                    
                    {isRegistering ? (
                      <div className="space-y-4 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                        {!isCapturingMulti && capturedPhotos.length === 0 ? (
                          /* Step 1: Input Form */
                          <>
                            <div className="flex items-start gap-2 text-red-800 text-sm">
                              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <p>Sistem akan mengambil <strong>3 foto otomatis</strong> dengan jeda 3 detik untuk akurasi maksimal</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                placeholder="Masukkan nama lengkap"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                NIP
                              </label>
                              <input
                                type="text"
                                value={regEmployeeId}
                                onChange={(e) => setRegEmployeeId(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                placeholder="Masukkan NIP"
                              />
                            </div>
                            
                            <button
                              onClick={startMultiPhotoCapture}
                              disabled={!regName.trim() || !regEmployeeId.trim()}
                              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Camera className="w-5 h-5" />
                              <span>Mulai Ambil 3 Foto</span>
                            </button>
                          </>
                        ) : isCapturingMulti || countdown > 0 ? (
                          /* Step 2: Capturing Photos with Countdown */
                          <div className="text-center py-6">
                            <div className="mb-4">
                              <p className="text-lg font-bold text-gray-900 mb-2">
                                Foto {currentPhotoIndex + 1} dari {TOTAL_PHOTOS}
                              </p>
                              <div className="flex justify-center gap-2 mb-4">
                                {[...Array(TOTAL_PHOTOS)].map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`h-2 w-16 rounded-full ${
                                      idx < capturedPhotos.length
                                        ? 'bg-green-500'
                                        : idx === currentPhotoIndex
                                        ? 'bg-red-500 animate-pulse'
                                        : 'bg-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {countdown > 0 ? (
                              <div className="relative">
                                <div className="text-8xl font-bold text-red-600 animate-bounce">
                                  {countdown}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                  Bersiap... Hadapkan wajah ke kamera
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 text-green-600">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-lg font-semibold">Menangkap...</span>
                              </div>
                            )}
                            
                            <button
                              onClick={cancelMultiPhotoCapture}
                              className="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                            >
                              Batalkan
                            </button>
                          </div>
                        ) : capturedPhotos.length === TOTAL_PHOTOS ? (
                          /* Step 3: Review & Submit */
                          <>
                            <div className="flex items-start gap-2 text-green-800 text-sm bg-green-100 p-3 rounded-lg">
                              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <p><strong>3 foto berhasil diambil!</strong> Silakan review dan submit registrasi.</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              {capturedPhotos.map((photo, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={photo}
                                    alt={`Foto ${idx + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg border-2 border-green-500"
                                  />
                                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                                    Foto {idx + 1}
                                  </div>
                                  <button
                                    onClick={() => retakePhoto(idx)}
                                    disabled={countdown > 0}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                    title="Ambil ulang"
                                  >
                                    <Camera className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            {countdown > 0 && (
                              <div className="text-center py-4">
                                <div className="text-4xl font-bold text-red-600 animate-bounce">
                                  {countdown}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Mengambil ulang...</p>
                              </div>
                            )}
                            
                            <div className="flex gap-3">
                              <button
                                onClick={cancelMultiPhotoCapture}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
                              >
                                Batal
                              </button>
                              <button
                                onClick={handleRegisterMultiPhoto}
                                disabled={isProcessing || countdown > 0}
                                className="flex-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Memproses...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-5 h-5" />
                                    <span>Daftarkan Sekarang</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        onClick={recognizeFace}
                        disabled={isProcessing || !qualityResult?.is_acceptable}
                        className="w-full px-6 py-5 bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:via-red-800 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <Scan className="w-6 h-6" />
                            <span>Scan Absensi Sekarang</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              {isCameraOn && qualityResult && (
                <div className="mt-6">
                  <FaceQualityIndicator
                    qualityMetrics={qualityResult.quality_metrics}
                    maskDetection={qualityResult.mask_detection}
                    recommendation={qualityResult.recommendation}
                    isAcceptable={qualityResult.is_acceptable}
                    showDetails={true}
                  />
                </div>
              )}

              {isCameraOn && !isRegistering && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-2">Tips Kualitas Terbaik:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>Pastikan pencahayaan cukup terang dan merata</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>Hadapkan wajah langsung ke kamera</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>Lepas masker, kacamata hitam, atau topi</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>Jaga jarak ideal 40-60 cm dari kamera</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-7 h-7 text-red-600" />
                  <span>Riwayat Absensi</span>
                </h2>
                <div className="bg-red-50 px-3 py-1.5 rounded-full">
                  <span className="text-xs font-bold text-red-700">{attendanceRecords.length} Hadir</span>
                </div>
              </div>
              
              <div className="max-h-[700px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold text-lg">Belum Ada Absensi</p>
                    <p className="text-gray-400 text-sm mt-2">Riwayat akan muncul setelah ada yang absen</p>
                  </div>
                ) : (
                  attendanceRecords.map((record) => (
                    <div 
                      key={record.id}
                      className="p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-100 hover:border-red-300 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            {record.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{record.name}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{record.employee_id}</span>
                            </p>
                          </div>
                        </div>
                        <span className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hadir</span>
                        </span>
                      </div>
                      
                      {(record.department || record.position) && (
                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                          {record.department && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {record.department}
                            </span>
                          )}
                          {record.position && (
                            <span>• {record.position}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/50 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {record.formatted_time || formatTimestamp(record.timestamp)}
                        </span>
                        {record.confidence_score && (
                          <span className="ml-auto text-green-600 font-semibold">
                            {record.confidence_score}% match
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
