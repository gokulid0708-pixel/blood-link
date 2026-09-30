import React, { useState, useEffect } from 'react';
import { Flame, Phone, CheckCircle, XCircle, Clock, ShieldCheck, X, MessageSquare, PhoneCall, Check, Send } from 'lucide-react';
import { playEmergencySiren, playSuccessChime } from '../utils/soundEffects';

export default function IncomingAlertModal({ 
  alert, 
  onClose, 
  onAccept, 
  onReject, 
  onRespond,
  onQuickMessage 
}) {
  if (!alert) return null;

  const isCall = alert.type === 'emergency_call';
  const data = alert.metadata || {};
  const isEmergency = data.isEmergency || (data.requestType || '').toLowerCase().includes('emergency') || alert.priority === 'Critical';
  
  // Defined response window countdown (defaults to 25s for emergency calls)
  const initialTime = data.remainingSeconds || 25;
  const [countdown, setCountdown] = useState(initialTime);
  const [quickMsgSent, setQuickMsgSent] = useState('');

  const quickMessages = [
    'I am on the way',
    'I will arrive in 30 minutes',
    'Please call me',
    'Not available today'
  ];

  useEffect(() => {
    if (!isCall || !isEmergency) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timed out: No response from donor -> Auto-forward to next compatible donor
          if (onReject) onReject(alert, 'no_response');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCall, isEmergency]);

  const handleAction = (action) => {
    if (action === 'can_donate' || action === 'accept') {
      playSuccessChime();
    }
    if (onRespond) {
      onRespond(alert, action);
    } else if (action === 'can_donate' || action === 'accept') {
      if (onAccept) onAccept(alert);
    } else {
      if (onReject) onReject(alert, action);
    }
    onClose();
  };

  const handleSendQuickMessage = (msg) => {
    if (onQuickMessage) {
      onQuickMessage(alert, msg);
    }
    setQuickMsgSent(msg);
    setTimeout(() => {
      setQuickMsgSent('');
    }, 2500);
  };

  const progressPercent = Math.max(0, Math.min(100, (countdown / initialTime) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0B101D] dark:bg-[#111827] light:bg-white border-2 border-red-500 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 shadow-red-950/80 transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/50 pb-3">
          <div className="flex items-center space-x-2 text-red-500 font-hud text-base font-bold uppercase tracking-wider">
            {isCall ? (
              <>
                <Phone className="w-5 h-5 text-red-400 animate-pulse" />
                <span>🚨 Emergency Communication Request</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 animate-pulse text-red-500" />
                <span>🚨 Emergency Blood Requisition Alert</span>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emergency Forwarding Countdown Banner (for incoming direct virtual calls) */}
        {isCall && isEmergency && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-red-300 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" />
                <span>Defined Response Window:</span>
              </span>
              <span className="text-amber-300 font-bold font-hud text-sm">
                ⏳ {countdown}s Left
              </span>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>Auto-Forwarding System: Active</span>
              <span className="text-amber-400">Forwards to next donor if no response</span>
            </div>
          </div>
        )}

        {/* Blood Requisition Details Card */}
        <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 p-4 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2.5 text-xs font-mono">
          <div>
            <span className="text-slate-500 uppercase block text-[10px]">Hospital / Trauma Command:</span>
            <span className="text-base font-bold font-hud text-white dark:text-white light:text-slate-900 block">
              {data.hospitalName || alert.hospitalName || 'PSG Emergency Trauma Command'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">Blood Group Required:</span>
              <span className="text-xl font-bold font-hud text-red-500 block">
                {data.bloodGroupRequired || data.bloodGroup || alert.bloodGroup || 'O+'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase block text-[10px]">Units Required:</span>
              <span className="text-xl font-bold font-hud text-white dark:text-white light:text-slate-900 block">
                {data.unitsNeeded || data.unitsRequired || data.units || alert.units || 2} Units
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 grid grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Required Time:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {data.requiredTime || data.timeframe || alert.requiredTime || 'Immediate (< 20 mins)'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Emergency Level:</span>
              <span className="text-sky-400 font-bold block mt-0.5">
                {data.requestType || alert.requestType || 'Category 1 – Emergency Request'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 DONOR ACTION CHOICES (Exact prompt specification) */}
        {!isCall ? (
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Select Your Response:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: I Can Donate */}
              <button
                onClick={() => handleAction('can_donate')}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-hud uppercase tracking-wider text-xs shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I Can Donate</span>
              </button>

              {/* Option 2: Need Some Time */}
              <button
                onClick={() => handleAction('need_time')}
                className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold font-hud uppercase tracking-wider text-xs shadow-md shadow-amber-950 flex items-center justify-center gap-1.5 transition"
              >
                <Clock className="w-4 h-4" />
                <span>Need Some Time</span>
              </button>

              {/* Option 3: Not Available */}
              <button
                onClick={() => handleAction('not_available')}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-hud uppercase tracking-wider text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Not Available</span>
              </button>

              {/* Option 4: Please Call Me */}
              <button
                onClick={() => handleAction('please_call_me')}
                className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold font-hud uppercase tracking-wider text-xs shadow-md shadow-sky-950 flex items-center justify-center gap-1.5 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Please Call Me</span>
              </button>
            </div>
          </div>
        ) : (
          /* Incoming Call Actions: Accept / Reject */
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleAction('accept')}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-hud uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept Call</span>
            </button>

            <button
              onClick={() => handleAction('reject')}
              className="w-full py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Call</span>
            </button>
          </div>
        )}

        {/* QUICK-RESPONSE MESSAGING SECTION */}
        <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Quick-Response Messaging:</span>
            </span>
            {quickMsgSent && (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3" /> Sent!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {quickMessages.map((msg, i) => (
              <button
                key={i}
                onClick={() => handleSendQuickMessage(msg)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 text-[11px] font-mono text-left border border-slate-800 dark:border-slate-800 light:border-slate-300 flex items-center justify-between gap-1 transition"
              >
                <span className="truncate">{msg}</span>
                <Send className="w-3 h-3 text-sky-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>🔒 Privacy First: Donor phone number remains hidden until consent is given.</span>
        </div>
      </div>
    </div>
  );
}
