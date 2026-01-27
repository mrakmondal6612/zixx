import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/hooks/AuthProvider';


const ProtectedRoute = ({ children, roles }: { children: JSX.Element, roles?: string[] }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    // Redirect to login, save current location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
