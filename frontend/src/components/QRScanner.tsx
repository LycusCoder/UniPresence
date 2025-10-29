import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ScanLine, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (qrData: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
  setIsScanning: (value: boolean) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScanSuccess, 
  onScanError,
  isScanning,
  setIsScanning
}) => {
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [error, setError] = useState('');
  const [lastScan, setLastScan] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-region';

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && scannerInitialized) {
        stopScanner();
      }
    };
  }, [scannerInitialized]);

  const startScanner = async () => {
    try {
      setError('');
      console.log('🎥 Starting QR Scanner...');
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerDivId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        config,
        (decodedText, decodedResult) => {
          console.log('✅ QR Code Scanned:', decodedText);
          
          // Prevent duplicate scans
          if (decodedText !== lastScan) {
            setLastScan(decodedText);
            onScanSuccess(decodedText);
            // Auto-stop after successful scan
            stopScanner();
          }
        },
        (errorMessage) => {
          // Ignore continuous scanning errors (normal behavior)
          // Only log actual errors
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.log('🔍 Scanning...', errorMessage);
          }
        }
      );

      setScannerInitialized(true);
      setIsScanning(true);
      console.log('✅ QR Scanner started');
    } catch (err: any) {
      console.error('❌ Error starting scanner:', err);
      
      let errorMsg = 'Gagal mengaktifkan kamera';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setIsScanning(false);
      if (onScanError) {
        onScanError(errorMsg);
      }
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerInitialized) {
        await scannerRef.current.stop();
        console.log('🛑 QR Scanner stopped');
      }
      setScannerInitialized(false);
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      <div className="relative">
        {!isScanning ? (
          // Start Scanner Button
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg mb-4">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Scan QR Code untuk Absensi
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Posisikan QR Code di depan kamera. Sistem akan otomatis mendeteksi dan mencatat absensi Anda.
              </p>
            </div>

            <button
              onClick={startScanner}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-3"
              data-testid="start-qr-scanner-button"
            >
              <Camera className="w-5 h-5" />
              Aktifkan Scanner
            </button>
          </div>
        ) : (
          // Scanner Active
          <div className="relative">
            {/* Scanner Region */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-500">
              <div id={scannerDivId} className="w-full"></div>
              
              {/* Scanning Indicator */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span className="text-white font-semibold text-sm">Scanning...</span>
                </div>
                
                <button
                  onClick={stopScanner}
                  className="bg-red-500/90 backdrop-blur-sm p-2 rounded-xl hover:bg-red-600/90 transition-colors shadow-lg"
                  data-testid="stop-qr-scanner-button"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Scan Lines Animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-400 rounded-2xl">
                  <ScanLine className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full text-blue-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Tips Scanning:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Pastikan QR code terlihat jelas dan tidak blur</li>
                    <li>• Posisikan QR code di tengah area scanner</li>
                    <li>• Pastikan pencahayaan cukup</li>
                    <li>• Jaga jarak 15-30 cm dari kamera</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
