import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ChartBar,
  User,
  Camera,
  MessageCircle,
  FileText,
  Megaphone,
  Info,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface AttendanceStats {
  today: boolean;
  this_week: number;
  this_month: number;
  attendance_time?: string;
  formatted_time?: string;
}

function DashboardPage() {
  const { user } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendanceStats();
  }, []);

  const loadAttendanceStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.status === 'success') {
        setAttendanceStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar activeTab="dashboard" setActiveTab={() => {}} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8">
          {/* Hero Welcome Section */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    {getCurrentGreeting()}, {user?.name}! 
                    <span className="text-4xl">👋</span>
                  </h1>
                  <p className="text-red-100 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {getCurrentDate()}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-6xl font-bold opacity-20">
                    {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Attendance Status Banner */}
              {loading ? (
                <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse">
                  <div className="h-12 bg-white/10 rounded-xl"></div>
                </div>
              ) : attendanceStats?.today ? (
                <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Anda sudah absen hari ini</p>
                      <p className="text-red-100 text-sm">
                        Waktu absen: {attendanceStats.formatted_time || attendanceStats.attendance_time || '08:00'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 bg-amber-500/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-300/30">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center animate-pulse flex-shrink-0">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Anda belum absen hari ini</p>
                        <p className="text-red-100 text-sm">Silakan lakukan absensi untuk mengakses semua fitur</p>
                      </div>
                    </div>
                    <Link
                      to="/attendance"
                      className="px-6 py-3 bg-white text-red-700 rounded-xl font-bold hover:bg-red-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Absen Sekarang
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Kehadiran Bulan Ini */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <ChartBar className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Kehadiran Bulan Ini</p>
              {loading ? (
                <div className="h-10 bg-green-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{attendanceStats?.this_month || 0} Hari</p>
              )}
            </div>

            {/* Minggu Ini */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Minggu Ini</p>
              {loading ? (
                <div className="h-10 bg-blue-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{attendanceStats?.this_week || 0} / 5 Hari</p>
              )}
            </div>

            {/* Info Profil */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <User className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-2">Profil Karyawan</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">NIP:</span> {user?.employee_id}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Dept:</span> {user?.department || '-'}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Jabatan:</span> {user?.position || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Fitur & Layanan */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-600" />
              Fitur & Layanan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature Cards */}
              {[
                {
                  title: 'Dokumen Karyawan',
                  description: 'Akses dokumen, slip gaji, dan sertifikat',
                  icon: FileText,
                  color: 'from-purple-500 to-purple-700',
                  locked: !attendanceStats?.today
                },
                {
                  title: 'Laporan Absensi',
                  description: 'Lihat riwayat dan statistik kehadiran',
                  icon: TrendingUp,
                  color: 'from-blue-500 to-blue-700',
                  locked: !attendanceStats?.today
                },
                {
                  title: 'Tim Saya',
                  description: 'Lihat anggota tim dan status kehadiran',
                  icon: User,
                  color: 'from-green-500 to-green-700',
                  locked: !attendanceStats?.today
                },
                {
                  title: 'Pengajuan Cuti',
                  description: 'Ajukan cuti, izin, dan sakit',
                  icon: Calendar,
                  color: 'from-pink-500 to-pink-700',
                  locked: !attendanceStats?.today
                }
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 ${
                      feature.locked ? 'opacity-60' : 'transform hover:-translate-y-1 cursor-pointer'
                    }`}
                  >
                    {feature.locked && (
                      <div className="absolute top-4 right-4 bg-gray-100 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    
                    {feature.locked && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Absen dulu untuk akses
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Info className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  💡 Tips Hari Ini
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Jangan lupa untuk melakukan absensi setiap hari sebelum pukul 09:00. 
                  Absensi tepat waktu membantu Anda mengakses semua fitur dan layanan perusahaan dengan lancar!
                </p>
              </div>
            </div>
          </div>

          {/* Pengumuman */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-red-600" />
              Pengumuman
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sistem Absensi Baru</h3>
                  <p className="text-sm text-gray-600">
                    Selamat datang di sistem absensi berbasis face recognition. 
                    Pastikan wajah Anda terlihat jelas saat scan.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Fitur Baru: Quality Indicator</h3>
                  <p className="text-sm text-gray-600">
                    Sistem sekarang menampilkan indikator kualitas wajah secara real-time 
                    untuk memastikan absensi yang akurat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
