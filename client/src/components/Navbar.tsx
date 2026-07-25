import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="font-semibold text-xl tracking-tight text-gray-900">LeadFlow</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {!user ? (
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Team Login
              </Link>
            ) : (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  Dashboard
                </Link>
                
                {/* NEW: Admin-only link */}
                {user?.role?.toUpperCase() === 'ADMIN' && (
                  <Link to="/team" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                    Team Management
                  </Link>
                )}

                <div className="flex items-center gap-4 border-l border-gray-200 pl-4 ml-2">
                  <span className="text-sm text-gray-500">Hi, {user.first_name}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}