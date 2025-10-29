import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Camera, 
  MessageCircle, 
  FileText, 
  Settings, 
  LogOut,
  Lock,
  Crown,
  Star,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      Icon: LayoutDashboard,
    },
    {
      id: 'attendance',
      label: 'Absensi',
      path: '/attendance',
      Icon: Camera,
    },
    {
      id: 'chat',
      label: 'Chat',
      path: '/chat',
      Icon: MessageCircle,
      badge: '1',
      locked: true,
    },
    {
      id: 'documents',
      label: 'Dokumen',
      path: '/documents',
      Icon: FileText,
      locked: true,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      path: '/settings',
      Icon: Settings,
    },
  ];

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return { Icon: Crown, label: 'Admin', color: 'bg-purple-100 text-purple-800' };
      case 'manager':
        return { Icon: Star, label: 'Manajer', color: 'bg-amber-100 text-amber-800' };
      default:
        return { Icon: User, label: 'Karyawan', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);
  const RoleBadgeIcon = roleBadge.Icon;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg fixed left-0 top-0">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">UP</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">UniPresence</h1>
            <p className="text-xs text-gray-500">Enterprise</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-3 border border-red-100">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{user?.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-600 font-mono">{user?.employee_id}</p>
              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
                <RoleBadgeIcon className="w-3 h-3" />
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const ItemIcon = item.Icon;
          
          return item.locked ? (
            <div
              key={item.id}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-gray-400 cursor-not-allowed opacity-50"
            >
              <div className="flex items-center gap-3">
                <ItemIcon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <Lock className="w-4 h-4" />
            </div>
          ) : (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <ItemIcon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
