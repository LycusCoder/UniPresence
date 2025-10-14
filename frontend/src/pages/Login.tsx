import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentId.trim() || !password.trim()) {
      setError('NIM dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      await login(studentId, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_smartface-attend-1/artifacts/d59f7jnx_image.png" 
              alt="Logo Universitas" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UniPresence
          </h1>
          <p className="text-gray-600">
            Sistem Absensi Berbasis Face Recognition
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
                <span className="text-xl mr-2">!</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="studentId" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                NIM
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan NIM"
                data-testid="login-student-id-input"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan password"
                data-testid="login-password-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="login-submit-button"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          {/* Test Accounts Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Akun Test:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Admin:</strong> ADMIN001 / admin123</p>
              <p><strong>Komting:</strong> KOMTING001 / komting123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
