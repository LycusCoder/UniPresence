import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceStatusProps {
  onStatusChange: (attended: boolean) => void;
  triggerRefresh?: number;
}

const AttendanceStatus = ({ onStatusChange, triggerRefresh }: AttendanceStatusProps) => {
  const [attended, setAttended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    checkAttendance();
  }, [triggerRefresh]);

  const checkAttendance = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setAttended(response.data.attended);
        setTimestamp(response.data.timestamp || null);
        onStatusChange(response.data.attended);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-24 rounded-lg" data-testid="attendance-status-loading"></div>
    );
  }

  return (
    <div 
      className={`p-6 rounded-lg border-2 ${
        attended 
          ? 'bg-green-50 border-green-500' 
          : 'bg-orange-50 border-orange-500'
      }`}
      data-testid="attendance-status"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Status Absensi Hari Ini
          </h3>
          {attended ? (
            <div className="mt-2">
              <p className="text-green-700 font-medium" data-testid="attendance-status-attended">✓ Sudah Absen</p>
              {timestamp && (
                <p className="text-sm text-gray-600 mt-1">
                  Waktu: {new Date(timestamp).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-orange-700 font-medium mt-2" data-testid="attendance-status-not-attended">
              ! Belum Absen - Gunakan kamera untuk absen
            </p>
          )}
        </div>
        
        <div className={`text-5xl ${
          attended ? 'text-green-500' : 'text-orange-500'
        }`}>
          {attended ? '✓' : '!'}
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatus;
