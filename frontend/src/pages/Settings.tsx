import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

function Settings() {
  const { user, token, logout } = useAuth();
  
  // Profile state
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  // Attendance check
  const [hasAttended, setHasAttended] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
    checkAttendanceStatus();
  }, [user]);

  const checkAttendanceStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setHasAttended(response.data.attended);
    } catch (error) {
      console.error('Error checking attendance:', error);
      setHasAttended(false);
    } finally {
      setCheckingAttendance(false);
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showMessage('Nama tidak boleh kosong', 'error');
      return;
    }
    
    setIsUpdatingProfile(true);
    
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/profile`,
        { name: name.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      showMessage(response.data.message, 'success');
      setIsEditingName(false);
      
      // Update user context if needed (you may need to add a refresh function in AuthContext)
    } catch (error: any) {
      if (error.response?.status === 403) {
        showMessage(error.response.data.message || 'Anda harus absen terlebih dahulu', 'error');
      } else if (error.response?.status === 401) {
        showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        logout();
      } else {
        showMessage(error.response?.data?.message || 'Gagal memperbarui profil', 'error');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      showMessage('Semua field password harus diisi', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('Password baru minimal 6 karakter', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage('Password baru dan konfirmasi tidak cocok', 'error');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/change-password`,
        {
          old_password: oldPassword,
          new_password: newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      showMessage(response.data.message, 'success');
      
      // Clear password fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.response?.status === 403) {
        showMessage(error.response.data.message || 'Anda harus absen terlebih dahulu', 'error');
      } else if (error.response?.status === 401) {
        if (error.response.data.message?.includes('salah')) {
          showMessage('Password lama salah', 'error');
        } else {
          showMessage('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
          logout();
        }
      } else {
        showMessage(error.response?.data?.message || 'Gagal mengubah password', 'error');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (checkingAttendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_smartface-attend-1/artifacts/d59f7jnx_image.png" 
                alt="Logo Universitas" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
                <p className="text-sm text-gray-600">UniPresence</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                data-testid="back-to-dashboard-link"
              >
                ← Kembali ke Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                data-testid="logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Feature Gating Warning */}
        {!hasAttended && (
          <div 
            className="mb-6 p-6 bg-orange-50 border-2 border-orange-300 rounded-xl"
            data-testid="attendance-warning"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔒</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-1">
                  Akses Terbatas
                </h3>
                <p className="text-orange-800">
                  Anda harus melakukan absensi terlebih dahulu untuk mengakses fitur pengaturan akun.
                  Silakan kembali ke dashboard dan scan absensi Anda.
                </p>
                <Link 
                  to="/"
                  className="inline-block mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  📸 Pergi ke Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-xl ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800 border-2 border-green-300' 
                : 'bg-red-50 text-red-800 border-2 border-red-300'
            }`}
            data-testid="message-display"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{messageType === 'success' ? '✓' : '⚠️'}</span>
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100" data-testid="user-info-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">NIM: {user?.student_id}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {user?.role === 'admin' ? '👑 Admin' : user?.role === 'komting' ? '⭐ Komting' : '👤 Mahasiswa'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100" data-testid="profile-settings-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Edit Profil
            </h3>
          </div>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!hasAttended || (!isEditingName && !isUpdatingProfile)}
                    className={`flex-1 px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                      !hasAttended 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                        : isEditingName 
                        ? 'border-blue-500 focus:ring-2 focus:ring-blue-200' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Masukkan nama lengkap"
                    data-testid="name-input"
                  />
                  {!isEditingName ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      disabled={!hasAttended}
                      className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                        hasAttended
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      data-testid="edit-name-button"
                    >
                      ✏️ Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        data-testid="save-name-button"
                      >
                        {isUpdatingProfile ? '...' : '✓'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false);
                          setName(user?.name || '');
                        }}
                        disabled={isUpdatingProfile}
                        className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50"
                        data-testid="cancel-edit-button"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Password Change Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100" data-testid="password-change-card">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Ganti Password
          </h3>
          
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={!hasAttended}
                  className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                    !hasAttended 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  placeholder="Masukkan password lama"
                  data-testid="old-password-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!hasAttended}
                  className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                    !hasAttended 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  data-testid="new-password-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!hasAttended}
                  className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                    !hasAttended 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  placeholder="Konfirmasi password baru"
                  data-testid="confirm-password-input"
                />
              </div>

              <button
                type="submit"
                disabled={!hasAttended || isChangingPassword}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-colors ${
                  hasAttended
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                data-testid="change-password-button"
              >
                {isChangingPassword ? 'Memproses...' : '🔒 Ubah Password'}
              </button>
            </div>
          </form>

          {/* Password Tips */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips Keamanan:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Password minimal 6 karakter</li>
              <li>Gunakan kombinasi huruf, angka, dan simbol</li>
              <li>Jangan gunakan password yang mudah ditebak</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
