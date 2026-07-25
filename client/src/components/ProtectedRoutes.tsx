import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 font-medium tracking-wide">
          Loading workspace...
        </div>
      </div>
    );
  }

  // If there is no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
}