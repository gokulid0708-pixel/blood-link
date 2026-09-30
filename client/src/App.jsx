import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { ShieldCheck, PhoneCall } from 'lucide-react';

// Rule 1: Default entry component - enforces authentication first, no default dashboard access
function RootEntry() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C16] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>Initializing BloodLink AI Security Layer...</span>
        </div>
      </div>
    );
  }

  // Rule 1: If unauthenticated, show Login Page only!
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, navigate directly to that user's authorized role dashboard (Rule 3)
  const roleRoutes = {
    donor: '/donor',
    hospital: '/hospital',
    bloodbank: '/bloodbank',
    admin: '/admin'
  };

  return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-[var(--bg-color)] text-[var(--text-main)] selection:bg-red-500 selection:text-white">
      {/* Role-isolated Top Navbar */}
      <Navbar />

      {/* Strict Protected Routes */}
      <main className="flex-1">
        <Routes>
          {/* Rule 1: Root route redirects to login if unauthenticated */}
          <Route path="/" element={<RootEntry />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-console-secure-login" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rule 2: Strictly isolated protected dashboards */}
          <Route
            path="/donor"
            element={
              <ProtectedRoute allowedRole="donor">
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital"
            element={
              <ProtectedRoute allowedRole="hospital">
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bloodbank"
            element={
              <ProtectedRoute allowedRole="bloodbank">
                <BloodBankDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-[#050810] border-t border-slate-900 py-6 px-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold font-hud">BLOODLINK AI V2.0</span> • Privacy-First Emergency Blood Response Network
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero Direct Exposure Enforced
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <PhoneCall className="w-3.5 h-3.5" /> Emergency Hotline: 108 / 104
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
