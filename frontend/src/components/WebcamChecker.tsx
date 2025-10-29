import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const WebcamChecker: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const checkWebcam = async () => {
    setStatus('checking');
    setMessage('Checking webcam access...');

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      setStream(mediaStream);

      // Wait for video element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Get list of devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      setStatus('success');
      setMessage(`✅ Webcam working! Found ${videoDevices.length} camera(s)`);

    } catch (error: any) {
      console.error('Webcam error:', error);
      setStatus('error');

      let errorMsg = 'Failed to access webcam';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Camera access denied. Please allow camera access in browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found. Please connect a camera.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Camera is already in use by another application.';
      } else if (error.message) {
        errorMsg = error.message;
      }

      setMessage(`❌ ${errorMsg}`);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    setMessage('');
    setDevices([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Webcam Checker</h2>
            <p className="text-sm text-gray-600">Test your webcam before attendance</p>
          </div>
        </div>

        {/* Video Preview */}
        <div className="mb-6">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Click "Test Webcam" to start</p>
                </div>
              </div>
            )}
            {status === 'checking' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                  <p className="text-white">Checking camera access...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
            status === 'success' 
              ? 'bg-green-50 border-green-300' 
              : status === 'error'
              ? 'bg-red-50 border-red-300'
              : 'bg-blue-50 border-blue-300'
          }`}>
            {status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />}
            {status === 'checking' && <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />}
            <p className={`text-sm font-medium ${
              status === 'success' 
                ? 'text-green-800' 
                : status === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Device List */}
        {devices.length > 0 && (
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Available Cameras:
            </h3>
            <ul className="space-y-2">
              {devices.map((device, index) => (
                <li key={device.deviceId} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700 font-medium">
                    {device.label || `Camera ${index + 1}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'idle' || status === 'error' ? (
            <button
              onClick={checkWebcam}
              disabled={status === 'checking'}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="test-webcam-button"
            >
              <Camera className="w-5 h-5" />
              Test Webcam
            </button>
          ) : (
            <button
              onClick={stopWebcam}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              data-testid="stop-webcam-button"
            >
              <XCircle className="w-5 h-5" />
              Stop Webcam
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Troubleshooting Tips:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Make sure camera is not being used by another app</li>
                <li>• Check browser camera permissions in settings</li>
                <li>• Try refreshing the page if camera doesn't work</li>
                <li>• Use Chrome/Firefox for best compatibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamChecker;
