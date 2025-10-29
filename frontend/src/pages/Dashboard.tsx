import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import DashboardContent from '../components/DashboardContent';
import FaceQualityIndicator from '../components/FaceQualityIndicator';

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

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState<string>('');
  
  // Attendance page states
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recognizedUser, setRecognizedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<'camera' | 'upload'>('camera');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Face quality states
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [maskDetection, setMaskDetection] = useState<MaskDetection | null>(null);
  const [qualityRecommendation, setQualityRecommendation] = useState<string>('');
  const [isQualityAcceptable, setIsQualityAcceptable] = useState<boolean>(false);
  const [isCheckingQuality, setIsCheckingQuality] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check attendance status on mount
  useEffect(() => {
    checkAttendanceStatus();
    loadAttendanceRecords();
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
    console.log('🎥 [Camera] Starting camera initialization...');
    console.log('🎥 [Camera] User:', user?.name, '| Employee ID:', user?.employee_id);
    console.log('🎥 [Camera] Current URL:', window.location.href);
    console.log('🎥 [Camera] Protocol:', window.location.protocol);
    
    setIsCameraLoading(true);
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ [Camera] getUserMedia not supported in this browser');
      setIsCameraLoading(false);
      showMessage('Browser Anda tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Firefox.', 'error');
      return;
    }

    // Check HTTPS requirement for network access
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
    const isHttps = window.location.protocol === 'https:';
    
    if (!isLocalhost && !isHttps) {
      console.warn('⚠️ [Camera] Camera access from network requires HTTPS!');
      console.warn('⚠️ [Camera] Current protocol:', window.location.protocol);
      console.warn('⚠️ [Camera] Try accessing via localhost instead of IP address');
      showMessage('⚠️ Akses kamera via network memerlukan HTTPS. Gunakan https:// atau akses via localhost.', 'error');
      setIsCameraLoading(false);
      return;
    }

    try {
      console.log('🎥 [Camera] Requesting camera permission...');
      
      // Stop any existing stream first
      stopCamera();
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ [Camera] Camera permission granted');
      console.log('✅ [Camera] Stream obtained:', stream.id);
      console.log('✅ [Camera] Video tracks:', stream.getVideoTracks().length);
      
      // Wait for video element to be ready
      let retries = 0;
      while (!videoRef.current && retries < 10) {
        console.log('⏳ [Camera] Waiting for video element...', retries);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!videoRef.current) {
        console.error('❌ [Camera] Video ref is null after waiting');
        setIsCameraLoading(false);
        showMessage('Error: Video element tidak siap. Coba refresh halaman.', 'error');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      console.log('🎥 [Camera] Video ref exists, attaching stream...');
      const video = videoRef.current;
      
      // Set attributes for better mobile support
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;
      
      // Attach stream
      video.srcObject = stream;
      
      // Create a promise to handle both metadata loaded and timeout
      const startPlayback = async () => {
        try {
          // Wait for metadata or timeout
          await Promise.race([
            new Promise((resolve) => {
              video.onloadedmetadata = () => {
                console.log('🎥 [Camera] Video metadata loaded');
                console.log('🎥 [Camera] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
                resolve(true);
              };
            }),
            new Promise((resolve) => setTimeout(() => {
              console.log('⏰ [Camera] Metadata timeout, attempting play anyway');
              resolve(true);
            }, 2000))
          ]);
          
          // Try to play the video
          console.log('🎥 [Camera] Attempting to play video...');
          await video.play();
          
          console.log('✅ [Camera] Video playing successfully');
          console.log('✅ [Camera] User:', user?.name, 'camera activated');
          setIsCameraOn(true);
          setIsCameraLoading(false);
          showMessage('✅ Kamera berhasil dihidupkan!', 'success');
          
          // Start quality checking after camera is on
          startQualityChecking();
          
        } catch (playError: any) {
          console.error('❌ [Camera] Failed to play video:', playError);
          console.error('❌ [Camera] Error details:', playError.message, playError.name);
          
          // Try one more time after a short delay
          console.log('🔄 [Camera] Retrying play...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            await video.play();
            console.log('✅ [Camera] Video playing on retry');
            setIsCameraOn(true);
            setIsCameraLoading(false);
            showMessage('✅ Kamera berhasil dihidupkan!', 'success');
            startQualityChecking();
          } catch (retryError: any) {
            console.error('❌ [Camera] Retry failed:', retryError);
            setIsCameraLoading(false);
            showMessage('Gagal menjalankan video kamera. Coba klik tombol lagi.', 'error');
            // Clean up
            stream.getTracks().forEach(track => track.stop());
          }
        }
      };
      
      // Add error handler for video element
      video.onerror = (err) => {
        console.error('❌ [Camera] Video element error:', err);
        setIsCameraLoading(false);
        showMessage('Error pada video element', 'error');
      };
      
      // Start playback
      await startPlayback();
      
    } catch (error: any) {
      console.error('❌ [Camera] Camera access error:', error);
      console.error('❌ [Camera] Error name:', error.name);
      console.error('❌ [Camera] Error message:', error.message);
      console.error('❌ [Camera] User:', user?.name);
      
      setIsCameraLoading(false);
      
      let errorMessage = 'Gagal mengakses kamera. ';
      
      if (error.name === 'NotAllowedError') {
        console.error('❌ [Camera] Permission denied by user');
        errorMessage += 'Izin kamera ditolak. Mohon klik "Allow" saat browser meminta izin kamera.';
      } else if (error.name === 'NotFoundError') {
        console.error('❌ [Camera] No camera device found');
        errorMessage += 'Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.';
      } else if (error.name === 'NotReadableError') {
        console.error('❌ [Camera] Camera already in use');
        errorMessage += 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.';
      } else if (error.name === 'OverconstrainedError') {
        console.error('❌ [Camera] Camera constraints not satisfied');
        errorMessage += 'Kamera tidak mendukung pengaturan yang diminta.';
      } else if (error.name === 'SecurityError') {
        console.error('❌ [Camera] Security error - likely HTTPS required');
        errorMessage += 'Error keamanan. Akses kamera memerlukan HTTPS atau localhost.';
      } else {
        console.error('❌ [Camera] Unknown error:', error);
        errorMessage += error.message || 'Error tidak diketahui.';
      }
      
      showMessage(errorMessage, 'error');
    }
  };

  const stopCamera = () => {
    console.log('🛑 [Camera] Stopping camera...');
    console.log('🛑 [Camera] User:', user?.name);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      console.log('🛑 [Camera] Stopping', tracks.length, 'tracks');
      tracks.forEach(track => {
        console.log('🛑 [Camera] Stopping track:', track.kind, track.label);
        track.stop();
      });
      
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      
      // Stop quality checking
      stopQualityChecking();
      
      // Reset quality states
      setQualityMetrics(null);
      setMaskDetection(null);
      setQualityRecommendation('');
      setIsQualityAcceptable(false);
      
      console.log('✅ [Camera] Camera stopped successfully');
      showMessage('Kamera dimatikan', 'success');
    } else {
      console.warn('⚠️ [Camera] No active camera to stop');
    }
  };

  const startQualityChecking = () => {
    // Check quality every 3 seconds
    qualityCheckIntervalRef.current = setInterval(() => {
      checkFaceQuality();
    }, 3000);
    // Initial check after 1 second
    setTimeout(() => checkFaceQuality(), 1000);
  };

  const stopQualityChecking = () => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
      qualityCheckIntervalRef.current = null;
    }
  };

  const checkFaceQuality = async () => {
    if (!isCameraOn || isCheckingQuality || !videoRef.current) {
      console.log('⏭️ [Quality] Skipping quality check:', {
        isCameraOn,
        isCheckingQuality,
        hasVideoRef: !!videoRef.current
      });
      return;
    }
    
    console.log('🔍 [Quality] Starting face quality check...');
    console.log('🔍 [Quality] User:', user?.name);
    
    const imageData = captureImage();
    if (!imageData) {
      console.error('❌ [Quality] Failed to capture image');
      return;
    }

    console.log('🔍 [Quality] Image captured, sending to backend...');
    setIsCheckingQuality(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/face/analyze`, {
        image: imageData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ [Quality] Backend response:', response.data.status);

      if (response.data.status === 'success') {
        console.log('✅ [Quality] Quality metrics:', response.data.quality_metrics);
        console.log('✅ [Quality] Overall score:', response.data.quality_metrics?.overall_score);
        console.log('✅ [Quality] Acceptable:', response.data.quality_acceptable);
        
        setQualityMetrics(response.data.quality_metrics);
        setMaskDetection(response.data.mask_detection);
        setQualityRecommendation(response.data.recommendation);
        setIsQualityAcceptable(response.data.quality_acceptable);
      } else {
        console.warn('⚠️ [Quality] Face not detected');
        // If face not detected, reset quality
        setQualityMetrics(null);
        setMaskDetection(null);
        setQualityRecommendation('Wajah tidak terdeteksi. Posisikan wajah Anda di depan kamera.');
        setIsQualityAcceptable(false);
      }
    } catch (error: any) {
      // Silently fail quality check, don't show error to user
      console.error('❌ [Quality] Quality check error:', error);
      console.error('❌ [Quality] Error details:', error.message);
    } finally {
      setIsCheckingQuality(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopQualityChecking();
    };
  }, []);

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
    
    // Error messages stay longer (8 seconds), success messages shorter (4 seconds)
    const duration = type === 'error' ? 8000 : 4000;
    
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, duration);
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
          showMessage('🎉 Absensi berhasil dicatat! Kamera akan dimatikan.', 'success');
          loadAttendanceRecords();
          checkAttendanceStatus(); // Refresh attendance status
          
          // Close camera after 2 seconds
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardContent
            userName={user?.name || ''}
            hasAttendedToday={hasAttendedToday}
            attendanceTime={attendanceTime}
            onNavigateToAttendance={() => setActiveTab('attendance')}
          />
        );

      case 'attendance':
        return renderAttendanceContent();

      case 'chat':
        return renderChatPlaceholder();

      case 'documents':
      case 'reports':
      case 'settings':
        return renderComingSoon();

      default:
        return <DashboardContent userName={user?.name || ''} hasAttendedToday={hasAttendedToday} attendanceTime={attendanceTime} onNavigateToAttendance={() => setActiveTab('attendance')} />;
    }
  };

  const renderAttendanceContent = () => (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem Absensi</h1>
        <p className="text-gray-600">Kelola absensi karyawan dengan teknologi face recognition</p>
      </div>

      {message && (
        <div 
          className={`mb-6 p-4 rounded-xl ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          data-testid="message-display"
        >
          <div className="flex items-center gap-3">
            {messageType === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">📸</span>
              Kamera Face Recognition
            </h2>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all text-sm"
                data-testid="register-button"
              >
                {isRegistering ? '✕ Batal' : '➕ Daftar Wajah'}
              </button>
            )}
          </div>
          
          <div className="relative mb-4" data-testid="camera-container">
            {isCameraLoading ? (
              <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center border-4 border-blue-500 animate-pulse">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white font-bold text-lg">🎥 Menghidupkan Kamera...</p>
                  <p className="text-blue-200 text-sm mt-2">Mohon tunggu sebentar</p>
                </div>
              </div>
            ) : isCameraOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl border-4 border-red-500 shadow-lg"
                />
                {recognizedUser && (
                  <div 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg"
                    data-testid="recognized-name-overlay"
                  >
                    ✓ {recognizedUser}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-4 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Kamera Off</p>
                  <p className="text-gray-400 text-sm mt-1">Klik tombol di bawah untuk menghidupkan</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Controls */}
          <div className="space-y-3">
            {!isCameraOn ? (
              <button
                onClick={startCamera}
                disabled={isCameraLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCameraLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menghidupkan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Hidupkan Kamera
                  </>
                )}
              </button>
            ) : (
              <>
                {!isRegistering && (
                  <button
                    onClick={recognizeFace}
                    disabled={isProcessing || !isQualityAcceptable}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
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
                )}
                <button
                  onClick={stopCamera}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Matikan Kamera
                </button>
              </>
            )}
          </div>

          {/* Face Quality Indicator - Real-time Feedback */}
          {isCameraOn && !isRegistering && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analisis Kualitas Wajah
              </h3>
              
              {isCheckingQuality && !qualityMetrics ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Menganalisis wajah...</p>
                  </div>
                </div>
              ) : qualityMetrics ? (
                <FaceQualityIndicator
                  qualityMetrics={qualityMetrics}
                  maskDetection={maskDetection || undefined}
                  recommendation={qualityRecommendation}
                  isAcceptable={isQualityAcceptable}
                  showDetails={true}
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Posisikan wajah Anda di depan kamera</p>
                  <p className="text-gray-400 text-xs mt-1">Analisis otomatis akan dimulai...</p>
                </div>
              )}

              {/* Quality Tips */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">💡 Tips untuk Kualitas Terbaik:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Pastikan pencahayaan ruangan cukup terang</li>
                      <li>• Hadapkan wajah langsung ke kamera</li>
                      <li>• Lepas masker, kacamata hitam, atau topi</li>
                      <li>• Jaga jarak 30-50 cm dari kamera</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          {isRegistering && isCameraOn && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4" data-testid="registration-form">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
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
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                data-testid="submit-registration-button"
              >
                {isProcessing ? 'Memproses...' : 'Daftarkan Wajah'}
              </button>
            </div>
          )}
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-3xl">📋</span>
            Riwayat Absensi Hari Ini
          </h2>
          
          <div className="overflow-x-auto" data-testid="attendance-table">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 font-medium">Belum ada riwayat absensi</p>
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
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
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
    </div>
  );

  const renderChatPlaceholder = () => (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6">
          <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Fitur Chat</h3>
        <p className="text-gray-600 mb-6">Real-time chat dengan rekan kerja</p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Segera Hadir
        </div>
      </div>
    </div>
  );

  const renderComingSoon = () => (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6">
          <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Fitur Dalam Pengembangan</h3>
        <p className="text-gray-600">Fitur ini akan segera tersedia</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={user?.name || ''}
        userRole={user?.role || ''}
        employeeId={user?.employee_id || ''}
        onLogout={logout}
        hasAttendedToday={hasAttendedToday}
      />
      {renderContent()}
    </div>
  );
}

export default Dashboard;
