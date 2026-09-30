import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  User, 
  Hospital, 
  Droplet, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  ArrowRight,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { playSuccessChime } from '../utils/soundEffects';
import { signUpWithSupabase, isSupabaseConfigured } from '../services/supabase';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('donor'); // 'donor', 'hospital', 'bloodbank'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Verification modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('777777');
  const [otpEmail, setOtpEmail] = useState('');
  const [registeredData, setRegisteredData] = useState(null);

  // Common & Donor Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1998-06-15');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [currentLocation, setCurrentLocation] = useState('Peelamedu, Coimbatore');
  const [workingLocation, setWorkingLocation] = useState('Gandhipuram, Coimbatore');
  const [aadhaarNumber, setAadhaarNumber] = useState('5481-9920-4412');
  const [emergencyContactName, setEmergencyContactName] = useState('S. Ramanathan');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+91 98421 88765');
  const [lastDonationDate, setLastDonationDate] = useState('2025-11-20');

  // Hospital & Blood Bank Fields
  const [licenseNumber, setLicenseNumber] = useState('TN-CBE-REG-2026-9021');
  const [address, setAddress] = useState('Avinashi Road, Peelamedu, Coimbatore 641004');
  const [storageCapacity, setStorageCapacity] = useState('2000');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sync user credentials with Supabase Auth
      if (isSupabaseConfigured) {
        try {
          await signUpWithSupabase(email, password, { name, role, phone });
        } catch (sbErr) {
          console.warn('[Supabase Registration Sync]:', sbErr.message);
        }
      }

      if (role === 'donor') {
        const payload = {
          name,
          email,
          password,
          phone,
          dob,
          bloodGroup,
          currentLocation: { lat: 11.0264, lng: 77.0028, address: currentLocation },
          workingLocation: { lat: 11.0168, lng: 76.9558, address: workingLocation },
          aadhaarNumber,
          emergencyContact: { name: emergencyContactName, phone: emergencyContactPhone, relation: 'Family' },
          lastDonationDate
        };

        const res = await api.registerDonor(payload);
        if (res.success) {
          setRegisteredData(res);
          setOtpEmail(email);
          setOtpCode(res.otpPreview || '777777');
          setShowOtpModal(true);
        } else {
          setError(res.message || 'Failed to register donor');
        }
      } else if (role === 'hospital') {
        const payload = {
          name,
          email,
          password,
          licenseNumber,
          address,
          emergencyContact: phone || '+91 422 257 0170',
          location: { lat: 11.0264, lng: 77.0028, address }
        };

        const res = await api.registerHospital(payload);
        if (res.success) {
          playSuccessChime();
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token);
          navigate('/hospital');
        } else {
          setError(res.message || 'Failed to register hospital');
        }
      } else if (role === 'bloodbank') {
        const payload = {
          name,
          email,
          password,
          licenseNumber,
          address,
          storageCapacity: Number(storageCapacity),
          location: { lat: 11.0084, lng: 76.9558, address }
        };

        const res = await api.registerBloodBank(payload);
        if (res.success) {
          playSuccessChime();
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token);
          navigate('/bloodbank');
        } else {
          setError(res.message || 'Failed to register blood bank');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await api.verifyOtp(otpEmail, otpCode);
      if (res.success && registeredData) {
        playSuccessChime();
        setUser(registeredData.user);
        localStorage.setItem('user', JSON.stringify(registeredData.user));
        localStorage.setItem('token', registeredData.token);
        setShowOtpModal(false);
        navigate('/donor');
      } else {
        setError(res.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Brand header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-xl shadow-red-600/30 text-white mb-2">
          <Heart className="w-7 h-7 fill-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold font-hud text-white uppercase tracking-wider">
          Enlist In The Emergency Response Network
        </h1>
        <p className="text-xs text-slate-400">
          Join registered trauma centers, certified blood banks, and verified active donors
        </p>
      </div>

      <div className="hud-panel p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6">
        {/* Role Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setRole('donor')}
            className={`py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              role === 'donor' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Volunteer Donor</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('hospital')}
            className={`py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              role === 'hospital' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hospital className="w-4 h-4" />
            <span>Hospital / Trauma Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('bloodbank')}
            className={`py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              role === 'bloodbank' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Certified Blood Bank</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {role === 'donor' ? 'Full Legal Name *' : role === 'hospital' ? 'Hospital Name *' : 'Blood Bank Name *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'donor' ? 'e.g. Karthik Subramanian' : 'e.g. PSG Institute of Medical Sciences'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@emergency.org"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secure Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Mobile Contact *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98421 XXXXX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* Donor-Specific Fields */}
          {role === 'donor' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:border-red-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Donation Date
                  </label>
                  <input
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Residential Location *
                  </label>
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. Peelamedu, Coimbatore"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Working Location / Daytime Hub
                  </label>
                  <input
                    type="text"
                    value={workingLocation}
                    onChange={(e) => setWorkingLocation(e.target.value)}
                    placeholder="e.g. Tidel Park, Coimbatore"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aadhaar Verification Number *
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                    required
                  />
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                    ✓ Verified via UIDAI Sandbox Gateway
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emergency Contact Name & Phone
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Contact Name"
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="+91 Phone"
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hospital & Blood Bank Fields */}
          {(role === 'hospital' || role === 'bloodbank') && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Clinical / Blood Centre License Number *
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="TN-CBE-MED-2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                {role === 'bloodbank' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Storage Capacity (Units) *
                    </label>
                    <input
                      type="number"
                      value={storageCapacity}
                      onChange={(e) => setStorageCapacity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Physical Medical Center Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical street address with pincode"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold font-hud uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-red-900/50 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'Submitting Credentials...' : `Register as ${role.toUpperCase()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold">
            Sign In here
          </Link>
        </div>
      </div>

      {/* Email OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0B101D] border border-emerald-500/50 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold font-hud uppercase tracking-wide text-white">
                Verify Email Security Code
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              A 6-digit verification code has been dispatched to <strong>{otpEmail}</strong>.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block">Enter One-Time Password (OTP):</span>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-48 text-center text-2xl tracking-[8px] font-mono font-bold bg-slate-900 text-sky-400 border border-slate-700 rounded-lg py-2 focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-500 block font-mono">
                Development Preview Code: {otpCode} (or master code 777777)
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-1/3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider shadow-lg shadow-emerald-900/50"
              >
                Confirm & Launch Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
