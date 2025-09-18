import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthSafe } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuthSafe();
  const user = auth?.user;

  // Show loading state while auth is initializing
  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);

  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}