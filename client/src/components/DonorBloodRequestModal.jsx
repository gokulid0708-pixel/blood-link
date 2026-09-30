import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Send, 
  HeartHandshake, 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  FileText, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { playEmergencySiren, playSuccessChime } from '../utils/soundEffects';

export default function DonorBloodRequestModal({ isOpen, onClose, donor, onCreated }) {
  if (!isOpen) return null;

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [hospitalName, setHospitalName] = useState('PSG Institute of Medical Sciences & Research');
  const [locationAddress, setLocationAddress] = useState('Peelamedu, Coimbatore, Tamil Nadu');
  const [emergencyLevel, setEmergencyLevel] = useState('Critical (ICU / Emergency Surgery)');
  const [contactName, setContactName] = useState(donor?.name || 'Verified Requester');
  const [contactPhone, setContactPhone] = useState(donor?.phone || '+91 98940 12345');
  const [notes, setNotes] = useState('Emergency blood requirement for family member. Immediate transfusion needed.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const emergencyLevels = [
    { value: 'Critical (ICU / Emergency Surgery)', label: '🚨 Critical (ICU / Immediate Surgery < 30m)', color: 'text-red-400' },
    { value: 'Urgent (Within 2 Hours)', label: '⚡ Urgent (Needed within 2 hours)', color: 'text-amber-400' },
    { value: 'Standard (Within 24 Hours)', label: '⏳ Standard (Planned within 24 hours)', color: 'text-sky-400' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Please provide the patient name.');
      return;
    }
    if (!hospitalName.trim()) {
      setError('Please specify the hospital or clinical facility name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      playEmergencySiren();

      const payload = {
        category: 'EMERGENCY',
        requesterRole: 'donor',
        requesterId: donor?.id || donor?._id || 'donor_01',
        requesterName: donor?.name || contactName,
        isDonorEmergencyRequest: true,
        patientName,
        bloodGroup,
        unitsRequired: Number(unitsRequired),
        hospitalName,
        location: {
          address: locationAddress,
          lat: 11.0264,
          lng: 77.0028
        },
        emergencyLevel,
        priorityLevel: emergencyLevel.includes('Critical') ? 'Critical' : (emergencyLevel.includes('Urgent') ? 'Urgent' : 'Normal'),
        requiredTime: emergencyLevel.includes('Critical') ? 'Immediate (< 30 Mins)' : 'Under 2 Hours',
        contactPerson: {
          name: contactName,
          phone: contactPhone,
          donorId: donor?.id || donor?._id
        },
        notes,
        caseNotes: notes
      };

      const res = await api.createRequest(payload);
      if (res.success) {
        playSuccessChime();
        if (onCreated) onCreated(res.request);
        onClose();
      } else {
        setError(res.message || 'Failed to submit blood request.');
      }
    } catch (err) {
      console.error(err);
      setError('Error initiating emergency requisition. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#111827] dark:bg-[#111827] text-white border-2 border-[#D62839]/60 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 my-8 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/50 pb-3">
          <div className="flex items-center space-x-2 text-[#D62839]">
            <div className="p-2 rounded-xl bg-red-950/80 border border-red-800">
              <Flame className="w-5 h-5 animate-pulse text-[#D62839]" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-hud uppercase tracking-wider text-white">
                Emergency Blood Requisition
              </h3>
              <p className="text-xs text-slate-400">
                Community-Driven Emergency Blood Request • Direct AI Matching Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Banner */}
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-red-300 uppercase tracking-wider">
            <span>AI Emergency Pipeline Workflow</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Privacy Protection</span>
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex flex-wrap items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-red-900/70 text-red-200">Request Created</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300">AI Matching</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">Nearby Donors</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">Blood Banks</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">Partner Hospitals</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-red-300">Emergency SOS</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">Blood Secured</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Patient Name & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Patient Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Blood Group Required *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-red-400 font-bold font-mono focus:outline-none focus:border-red-500"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Units Required & Emergency Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Units Required (Pints / Units) *
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setUnitsRequired(num)}
                    className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs transition border ${
                      unitsRequired === num
                        ? 'bg-[#D62839] text-white border-red-500 shadow-md shadow-red-900/40'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {num} {num === 1 ? 'Unit' : 'Units'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Level *
              </label>
              <select
                value={emergencyLevel}
                onChange={(e) => setEmergencyLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-red-500"
              >
                {emergencyLevels.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hospital Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hospital / Clinic Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. PSG Institute of Medical Sciences"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location / City Sector *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Peelamedu, Coimbatore"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Person Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Person (Donor / Relative Name) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contact person name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Phone (Protected by Virtual Relay) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98421 00000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Case Notes / Emergency Medical Context
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Emergency surgery in progress. Blood Bank stock empty. Need donors immediately at 2nd Floor ICU."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Broadcasts to nearby donors & blood banks instantly</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#D62839] hover:bg-red-700 text-white text-xs font-bold font-hud uppercase tracking-wider transition shadow-lg shadow-red-900/50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Transmitting Requisition...' : 'Submit Emergency Request'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
