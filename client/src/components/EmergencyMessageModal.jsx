import React, { useState } from 'react';
import { X, Send, AlertCircle, Flame, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function EmergencyMessageModal({ isOpen, onClose, donor, hospitalName, bloodGroup, unitsRequired, onMessageSent }) {
  if (!isOpen) return null;

  const [timeframe, setTimeframe] = useState('1 Hour');
  const [caseNotes, setCaseNotes] = useState('Critical trauma patient requiring immediate blood transfusion. Please confirm readiness.');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.sendEmergencyMessage({
        hospitalId: 'hosp_active',
        hospitalName: hospitalName || 'Emergency Trauma Command',
        donorId: donor?.donorId || 'donor_01',
        bloodGroup: bloodGroup || donor?.bloodGroup || 'O+',
        units: unitsRequired || 2,
        timeframe,
        caseNotes
      });

      if (res.success) {
        setSentSuccess(true);
        if (onMessageSent) onMessageSent();
        setTimeout(() => {
          setSentSuccess(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0B101D] border border-red-500/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-red-400">
            <Flame className="w-5 h-5 animate-pulse" />
            <h3 className="text-base font-bold font-hud uppercase tracking-wide text-white">
              Emergency Message System (Rule 7)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Emergency Message Dispatched!</h4>
            <p className="text-xs text-slate-300">
              Donor {donor?.donorName} received an instant critical alert with Accept/Reject/Call actions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Donor:</span>
                <span className="text-white font-bold">{donor?.donorName || 'Compatible Donor'} (🔒 Private)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Group Needed:</span>
                <span className="text-red-400 font-bold">{bloodGroup || donor?.bloodGroup || 'O+'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hospital:</span>
                <span className="text-sky-400 font-bold">{hospitalName || 'PSG Emergency Trauma Desk'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Within Timeframe *
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
              >
                <option value="30 Minutes">Immediate (&lt; 30 Minutes)</option>
                <option value="1 Hour">Under 1 Hour</option>
                <option value="2 Hours">Within 2 Hours</option>
                <option value="Today">Today (Elective Prep)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Message / Clinical Context *
              </label>
              <textarea
                rows="3"
                value={caseNotes}
                onChange={(e) => setCaseNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none text-xs"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold font-hud uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-red-900/50 flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Transmitting...' : 'Dispatch Message'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
