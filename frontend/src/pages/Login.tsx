import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  // Fade-in animation on mount
  useEffect(() => {
    setMounted(true);
    // Load remember me preference
    const savedEmployeeId = localStorage.getItem('rememberedEmployeeId');
    if (savedEmployeeId) {
      setEmployeeId(savedEmployeeId);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!employeeId.trim() || !password.trim()) {
      setError(t('login.errorRequired'));
      return;
    }

    setLoading(true);
    try {
      await login(employeeId, password);
      
      // Save employee ID if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmployeeId', employeeId);
      } else {
        localStorage.removeItem('rememberedEmployeeId');
      }
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo and Title */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-block p-5 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl mb-4 transform transition-all duration-500 hover:scale-105 hover:rotate-3">
            <div className="h-20 w-20 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl font-extrabold text-white drop-shadow-lg">UP</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 via-red-700 to-red-900 bg-clip-text text-transparent drop-shadow-sm">
              {t('login.title')}
            </h1>
            <p className="text-gray-600 font-medium text-lg">
              {t('login.subtitle')}
            </p>
          </div>
        </div>

        {/* Login Form Card - Glassmorphism */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40 transform transition-all duration-500 hover:shadow-3xl">
          {/* Welcome Message */}
          <div className="text-center mb-6 space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('login.welcome')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('login.tagline')}
            </p>
          </div>

          {/* Error Message with Animation */}
          {error && (
            <div 
              className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-300 rounded-xl text-red-800 text-sm animate-shake"
              data-testid="error-message"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee ID Input */}
            <div className="space-y-2">
              <label 
                htmlFor="employeeId" 
                className="block text-sm font-semibold text-gray-700"
              >
                {t('login.employeeIdLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 font-medium"
                  placeholder={t('login.employeeIdPlaceholder')}
                  data-testid="login-employee-id-input"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-gray-700"
              >
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/80 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 font-medium"
                  placeholder={t('login.passwordPlaceholder')}
                  data-testid="login-password-input"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2 transition-all cursor-pointer"
                  data-testid="remember-me-checkbox"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                  {t('login.rememberMe')}
                </span>
              </label>
            </div>

            {/* Login Button with Loading State */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-xl font-bold text-base hover:from-red-700 hover:via-red-800 hover:to-red-900 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
              data-testid="login-submit-button"
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-800 to-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Button Content */}
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('login.loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('login.loginButton')}</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Test Accounts Info - Modern Design */}
          <div className="mt-8 p-5 bg-gradient-to-br from-red-50/80 to-pink-50/80 backdrop-blur-sm rounded-2xl border border-red-200/50 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-bold text-gray-800">{t('login.testAccounts')}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                <span className="font-semibold text-gray-700">
                  <span className="text-red-600">👑</span> {t('login.admin')}
                </span>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">EMP001 / admin123</code>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                <span className="font-semibold text-gray-700">
                  <span className="text-amber-600">⭐</span> {t('login.manager')}
                </span>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">EMP002 / manager123</code>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                <span className="font-semibold text-gray-700">
                  <span className="text-blue-600">👤</span> {t('login.employee')}
                </span>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">EMP003 / employee123</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>&copy; 2025 UniPresence Enterprise. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
