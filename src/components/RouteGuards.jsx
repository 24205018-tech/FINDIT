import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';

/** Redirects to /login when the user is not authenticated */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading">
        <LoadingSpinner label="Checking your session…" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

/** Admin-only guard — students are sent back to the user dashboard */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading">
        <LoadingSpinner label="Checking your session…" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
