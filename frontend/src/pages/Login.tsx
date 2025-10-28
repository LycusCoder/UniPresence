import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!employeeId.trim() || !password.trim()) {
      setError('NIP dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      await login(employeeId, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">UP</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UniPresence Enterprise
          </h1>
          <p className="text-gray-600">
            Sistem Manajemen Karyawan
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Login
          </h2>

          {error && (
            <div 
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              data-testid="error-message"
            >
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="employeeId" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan NIP (contoh: EMP001)"
                data-testid="login-employee-id-input"
                disabled={loading}
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan password"
                data-testid="login-password-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              data-testid="login-submit-button"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          {/* Test Accounts Info */}
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">👤 Akun Test:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Admin:</strong> EMP001 / admin123</p>
              <p><strong>Manajer:</strong> EMP002 / manager123</p>
              <p><strong>Karyawan:</strong> EMP003 / employee123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
