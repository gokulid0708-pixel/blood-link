import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, ShieldCheck, LogOut, Lock, Radio } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    donor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    hospital: 'bg-red-950 text-red-300 border-red-500/40',
    bloodbank: 'bg-amber-950 text-amber-300 border-amber-500/40',
    admin: 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
  };

  return (
    <nav className="bg-[#0B101D] dark:bg-[#0B101D] light:bg-white border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 sticky top-0 z-40 shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-hud tracking-wider text-white">
                  BLOOD<span className="text-red-500">LINK</span>
                </span>
                <span className="text-[10px] bg-red-950 border border-red-500/50 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  V2.0 PRIVACY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                Zero Direct Exposure Emergency Grid
              </p>
            </div>
          </div>

          {/* Right User Status & Logout (Strictly isolated - no other role buttons) */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white flex items-center justify-end space-x-1">
                    <span>{user.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 capitalize">
                    {user.role === 'donor' && user.profile?.bloodGroup ? `[${user.profile.bloodGroup}] Donor` : user.role}
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${roleColors[user.role] || 'bg-slate-800 text-slate-300'}`}>
                  {user.role} Portal
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 border border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                  Authentication Required
                </span>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
