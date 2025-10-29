import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import AttendancePageDualTabs from './pages/AttendancePageDualTabs';
import Settings from './pages/Settings';

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login onLoginSuccess={() => {}} /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/" 
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/attendance" 
        element={isAuthenticated ? <AttendancePageDualTabs /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/settings" 
        element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}

export default App;
