import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C16] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  // Rule 1: No default dashboard access without authentication
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rule 2: Role isolation - only allowed role can access its own dashboard
  if (allowedRole && user.role !== allowedRole) {
    const roleRoutes = {
      donor: '/donor',
      hospital: '/hospital',
      bloodbank: '/bloodbank',
      admin: '/admin'
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return children;
}
