import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Lock, Mail, Shield, AlertCircle, ArrowRight, User, Hospital, Droplet, ShieldCheck } from 'lucide-react';
import { playSuccessChime } from '../utils/soundEffects';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Rule 3: Separate login flows
  const [role, setRole] = useState('donor'); // 'donor', 'hospital', 'bloodbank', 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleMeta = {
    donor: {
      title: 'Donor Portal Login',
      desc: 'Sign in to respond to emergency blood requests and track donations.',
      icon: User,
      color: 'emerald',
      redirect: '/donor'
    },
    hospital: {
      title: 'Hospital Trauma Desk Login',
      desc: 'Access emergency blood procurement, live donor matching, and escalation engine.',
      icon: Hospital,
      color: 'red',
      redirect: '/hospital'
    },
    bloodbank: {
      title: 'Central Blood Bank Login',
      desc: 'Manage cold-storage blood inventory, reservations, and hospital orders.',
      icon: Droplet,
      color: 'purple',
      redirect: '/bloodbank'
    }
  };

  const currentMeta = roleMeta[role];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(email, password, role);
    setLoading(false);

    if (res.success) {
      playSuccessChime();
      // Redirect directly to that role's dashboard (Rule 3)
      navigate(currentMeta.redirect);
    } else {
      setError(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-xl shadow-red-600/30 text-white mb-2">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl font-bold font-hud text-white uppercase tracking-wider">
            BloodLink AI Authentication
          </h1>
          <p className="text-xs text-slate-400">
            Privacy-First Real-Time Emergency Blood Response Network
          </p>
        </div>

        {/* Card */}
        <div className="hud-panel p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6">
          {/* Rule 3: Separate Login Flow Selector (Admin completely hidden from public UI) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'donor', label: 'Donor', icon: User },
              { id: 'hospital', label: 'Hospital', icon: Hospital },
              { id: 'bloodbank', label: 'Blood Bank', icon: Droplet }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = role === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRole(tab.id);
                    setError('');
                  }}
                  className={`py-2 rounded-lg font-medium transition flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] leading-tight text-center">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <h2 className="text-base font-bold font-hud text-white">{currentMeta.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentMeta.desc}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorized Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold font-hud uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-red-900/50 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy & Security Guarantee banner */}
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Role Isolation & Zero Data Leakage Enforced</span>
          </div>

          <div className="text-center text-xs text-slate-400">
            Need an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 font-semibold">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
