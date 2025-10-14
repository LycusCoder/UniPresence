import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface Material {
  id: number;
  title: string;
  description: string;
  file_url: string;
  uploaded_at: string;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setMaterials(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Anda harus absen terlebih dahulu untuk mengakses materi');
      } else if (err.response?.status === 401) {
        logout();
        navigate('/');
      } else {
        setError('Gagal memuat materi');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat materi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center" data-testid="materials-access-denied">
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
            <h1 className="text-2xl font-bold text-gray-900">📚 Materi Perkuliahan</h1>
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
            Berikut adalah materi perkuliahan yang dapat Anda akses. Klik tombol download untuk mengunduh file PDF.
          </p>
        </div>

        <div className="space-y-4" data-testid="materials-list">
          {materials.map((material) => (
            <div 
              key={material.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              data-testid={`material-${material.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {material.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{material.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">
                      📅 Upload: {new Date(material.uploaded_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <a
                    href={material.file_url}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`download-material-${material.id}`}
                  >
                    📥 Download PDF
                  </a>
                </div>
              </div>
            </div>
          ))}

          {materials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada materi tersedia</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Materials;
