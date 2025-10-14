import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
}

const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setAssignments(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Anda harus absen terlebih dahulu untuk mengakses jurnal tugas');
      } else if (err.response?.status === 401) {
        logout();
        navigate('/');
      } else {
        setError('Gagal memuat jurnal tugas');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { text: 'Terlambat', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} hari lagi`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else {
      return { text: `${diffDays} hari lagi`, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat jurnal tugas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center" data-testid="assignments-access-denied">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="back-to-dashboard-button"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">✍️ Jurnal Tugas</h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              data-testid="back-button"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Berikut adalah daftar tugas perkuliahan. Pastikan menyelesaikan tugas sebelum deadline.
          </p>
        </div>

        <div className="space-y-4" data-testid="assignments-list">
          {assignments.map((assignment) => {
            const deadlineStatus = getDeadlineStatus(assignment.deadline);
            
            return (
              <div 
                key={assignment.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                data-testid={`assignment-${assignment.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {assignment.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${deadlineStatus.bgColor} ${deadlineStatus.color}`}>
                        {deadlineStatus.text}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        ⏰ Deadline: {new Date(assignment.deadline).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        assignment.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {assignment.status === 'pending' ? '⏳ Belum Selesai' : '✓ Selesai'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={assignment.status !== 'pending'}
                      data-testid={`submit-assignment-${assignment.id}`}
                    >
                      📤 Submit Tugas
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {assignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada tugas tersedia</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assignments;
