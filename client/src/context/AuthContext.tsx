import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

// Requests where a 401 is an *expected*, normal outcome and should NOT trigger
// a redirect — the calling code already handles these itself.
const SILENT_401_PATHS = ['/health/check', '/auth/login'];

interface User {
  id: string;
  first_name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Whenever any authenticated API call comes back 401 (expired/invalid session),
  // clear the user and bounce to /login instead of letting the page show a raw error.
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl: string = error.config?.url || '';
        const isSilent = SILENT_401_PATHS.some((path) => requestUrl.includes(path));

        if (error.response?.status === 401 && !isSilent) {
          setUser(null);
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }

        return Promise.reject(error);
      }
    );

    // Clean up on unmount so we don't register duplicate interceptors on re-render
    return () => api.interceptors.response.eject(interceptorId);
  }, [navigate, location.pathname]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/health/check');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};