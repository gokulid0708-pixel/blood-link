import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, PhoneOff, ShieldCheck, Lock, Activity, AlertTriangle, Clock, CheckCircle, ChevronRight, UserCheck, Flame, Check } from 'lucide-react';
import { api } from '../services/api';

export default function SecureCallModal({
  isOpen,
  onClose,
  donor,
  hospitalName,
  requestId,
  bloodGroup,
  unitsRequired,
  requestType,
  requiredTime,
  rankedDonors = []
}) {
  if (!isOpen) return null;

  const isDonorSide = Boolean(donor?.isDonorSide);
  const reqTypeLower = (requestType || '').toLowerCase();
  const isEmergency = reqTypeLower.includes('emergency') || reqTypeLower.includes('category 1');

  const [callState, setCallState] = useState(isDonorSide ? 'connected' : 'initiating'); // 'initiating', 'emergency_verification', 'awaiting_approval', 'connected', 'rejected', 'blocked', 'ended'
  const [errorMessage, setErrorMessage] = useState('');
  const [activeDonorName, setActiveDonorName] = useState(donor?.donorName || 'Compatible Donor');
  const [virtualHospitalNumber, setVirtualHospitalNumber] = useState(donor?.virtualHospitalNumber || '+91-1800-RELAY-8821');
  const [virtualDonorNumber, setVirtualDonorNumber] = useState(donor?.virtualDonorNumber || '+91-1800-RELAY-4412');
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(donor?.sessionId || null);

  // Emergency Verification & Approval Form
  const [emergencyCertified, setEmergencyCertified] = useState(false);
  const [certifyingDoctor, setCertifyingDoctor] = useState('Dr. S. Ramanathan (Emergency HOD)');
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Forwarding State
  const [forwardingHistory, setForwardingHistory] = useState([]);
  const [currentForwardIndex, setCurrentForwardIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(25);
  const [forwardNotice, setForwardNotice] = useState('');

  const pollIntervalRef = useRef(null);

  const startInitiation = (emergencyOverride = false) => {
    setVerificationLoading(true);

    const donorStatus = (donor?.requestStatus || donor?.status || '').toLowerCase();

    api.initiateRelayCall({
      hospitalId: 'hosp_active',
      hospitalName: hospitalName || 'PSG Emergency Trauma Command',
      donorId: donor?.donorId || donor?._id || 'donor_01',
      donorName: donor?.donorName || 'Primary Compatible Donor',
      requestId: requestId || 'req_gen',
      bloodGroup: bloodGroup || donor?.bloodGroup || 'O+',
      unitsRequired: unitsRequired || 1,
      requiredTime: requiredTime || 'Immediate (< 30 Mins)',
      requestType: requestType || 'Category 1 – Emergency Request',
      hospital_requested_contact: true,
      donor_request_status: donorStatus || 'Accepted',
      emergency_override_verified: emergencyOverride,
      emergency_verification_notes: emergencyOverride ? `Certified by ${certifyingDoctor}` : null,
      rankedDonors
    }).then(res => {
      setVerificationLoading(false);

      if (!res.success) {
        // If blocked because donor hasn't requested call, show Emergency Verification & Approval protocol!
        if (isEmergency && res.message?.includes('By default, hospitals cannot directly call donors')) {
          setCallState('emergency_verification');
          setErrorMessage(res.message);
        } else {
          setCallState('blocked');
          setErrorMessage(res.message || 'Communication blocked by security layer.');
        }
        return;
      }

      if (res.session) {
        setSessionId(res.session.sessionId);
        setVirtualHospitalNumber(res.session.virtualHospitalNumber);
        setVirtualDonorNumber(res.session.virtualDonorNumber);
        setActiveDonorName(res.session.donorName);
        setForwardingHistory(res.session.forwardingHistory || []);
        setCurrentForwardIndex(res.session.currentForwardIndex || 0);
        setCallState('awaiting_approval');

        let lastForwardIdx = res.session.currentForwardIndex || 0;

        pollIntervalRef.current = setInterval(async () => {
          try {
            const check = await api.getRelaySession(res.session.sessionId);
            if (check.success && check.session) {
              const sess = check.session;

              if (sess.currentForwardIndex > lastForwardIdx) {
                lastForwardIdx = sess.currentForwardIndex;
                setCurrentForwardIndex(sess.currentForwardIndex);
                setActiveDonorName(sess.donorName);
                setVirtualDonorNumber(sess.virtualDonorNumber);
                setForwardNotice(`⚠️ Previous donor unavailable. Auto-forwarded to next ranked donor: ${sess.donorName} (Rank #${sess.currentForwardIndex + 1})`);
              }

              setForwardingHistory(sess.forwardingHistory || []);
              if (sess.remainingSeconds !== undefined) {
                setRemainingSeconds(sess.remainingSeconds);
              }

              if (sess.status === 'connected') {
                setCallState('connected');
                setActiveDonorName(sess.connectedDonorName || sess.donorName);
                clearInterval(pollIntervalRef.current);
              } else if (sess.status === 'rejected') {
                setCallState('rejected');
                clearInterval(pollIntervalRef.current);
              } else if (sess.status === 'expired') {
                setCallState('ended');
                clearInterval(pollIntervalRef.current);
              }
            }
          } catch (e) {
            // silent poll failure
          }
        }, 1200);
      }
    }).catch(err => {
      setVerificationLoading(false);
      setCallState('blocked');
      setErrorMessage('Failed to connect to Virtual Contact Gateway.');
    });
  };

  useEffect(() => {
    if (isDonorSide) {
      setCallState('connected');
      return;
    }

    startInitiation(false);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, isDonorSide, donor]);

  // Call duration counter
  useEffect(() => {
    let interval = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const handleEndCall = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0B101D] dark:bg-[#111827] light:bg-white border border-emerald-500/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-center transition-colors duration-300">
        {/* Top Gateway Shield */}
        <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold">
            <Lock className="w-4 h-4" />
            <span>Virtual Masked Communication Gateway</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Call Content */}
        <div className="py-1">
          {/* CRITICAL EMERGENCY VERIFICATION & APPROVAL SCREEN */}
          {callState === 'emergency_verification' ? (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2.5 text-red-500">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white dark:text-white light:text-slate-900">
                    Critical Emergency Verification & Approval
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Protocol: Rule 6 Direct Calling Authorization
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 dark:bg-slate-950 light:bg-slate-100 p-3.5 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs font-mono space-y-2 text-slate-300 dark:text-slate-300 light:text-slate-700">
                <p className="text-slate-400">
                  By default, hospitals cannot directly call donors without donor consent. However, for critical emergency cases, direct calling is allowed after medical verification.
                </p>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-[11px]">
                  <span className="text-slate-500">Target Donor:</span>
                  <span className="text-white font-bold">{donor?.donorName} (🔒 Masked Bridge)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Emergency Blood:</span>
                  <span className="text-red-400 font-bold">{bloodGroup} • {unitsRequired} Units</span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Certifying Attending Physician / Officer:
                  </label>
                  <input
                    type="text"
                    value={certifyingDoctor}
                    onChange={(e) => setCertifyingDoctor(e.target.value)}
                    className="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white dark:text-white light:text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emergencyCertified}
                      onChange={(e) => setEmergencyCertified(e.target.checked)}
                      className="mt-0.5 rounded accent-red-600 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-red-200">
                      I formally certify that this requisition represents a Critical Life-Threatening Emergency requiring direct virtual contact approval.
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!emergencyCertified || verificationLoading}
                    onClick={() => startInitiation(true)}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-hud font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-900/50 flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Initiate Call</span>
                  </button>
                </div>
              </div>
            </div>
          ) : callState === 'blocked' ? (
            /* BLOCKED STATE */
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-500/60 mx-auto flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold font-hud text-amber-300 uppercase tracking-wider">
                Communication Blocked
              </h3>
              <div className="p-3 bg-slate-950 rounded-xl border border-amber-900/40 text-xs font-mono text-slate-300 space-y-1.5 text-left">
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacy Protocol Enforced:</span>
                </div>
                <p className="text-amber-200/90 text-[11px]">
                  {errorMessage || 'By default, hospitals cannot directly call donors. Calling is allowed when the donor requests "Please Call Me" or after Critical Emergency Verification & Approval.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider transition"
              >
                Close & Return
              </button>
            </div>
          ) : (
            /* ACTIVE CALLING / AWAITING APPROVAL / CONNECTED */
            <>
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  callState === 'connected'
                    ? 'bg-emerald-600/30 text-emerald-400 ring-4 ring-emerald-500/30'
                    : callState === 'rejected'
                    ? 'bg-red-950 text-red-400 ring-4 ring-red-900/50'
                    : 'bg-sky-600/20 text-sky-400 ring-4 ring-sky-500/20'
                }`}>
                  {callState === 'rejected' ? (
                    <PhoneOff className="w-8 h-8 text-red-400" />
                  ) : (
                    <Phone className={`w-8 h-8 ${callState === 'connected' ? 'animate-none' : 'animate-pulse'}`} />
                  )}
                </div>
                {callState === 'connected' && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg font-bold font-hud text-white dark:text-white light:text-slate-900 uppercase tracking-wider">
                  {activeDonorName}
                </h3>
                {isEmergency && (
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono text-[10px] font-bold border border-red-800">
                    Rank #{currentForwardIndex + 1}
                  </span>
                )}
              </div>

              <p className="text-xs font-mono text-red-400 mt-0.5">
                Emergency Blood Group: {bloodGroup || donor?.bloodGroup || 'O+'} • {unitsRequired || 1} Units
              </p>

              {/* EMERGENCY CALL FORWARDING PIPELINE HUD */}
              {isEmergency && callState === 'awaiting_approval' && (
                <div className="bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border border-sky-500/40 rounded-xl p-3.5 mt-3 space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-400 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                      <span>Automatic Forwarding Pipeline Active</span>
                    </span>
                    <span className="text-amber-400 font-bold font-mono">
                      ⏳ {remainingSeconds}s window
                    </span>
                  </div>

                  {/* Forwarding Queue Steps */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {forwardingHistory.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap flex items-center gap-1 ${
                          item.status === 'accepted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : item.status === 'pending'
                            ? 'bg-sky-950 text-sky-300 border border-sky-500 animate-pulse'
                            : 'bg-red-950/60 text-red-300 border border-red-800'
                        }`}>
                          <span>#{item.rank || idx + 1} {item.donorName}</span>
                          <span className="font-bold">
                            {item.status === 'accepted' ? '✓' : item.status === 'pending' ? '⏳ Calling' : '✗'}
                          </span>
                        </div>
                        {idx < forwardingHistory.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {forwardNotice && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-800/40 font-mono">
                      {forwardNotice}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-mono">
                    If donor declines or does not respond within 25s, call automatically forwards to the next highest-ranked compatible donor.
                  </p>
                </div>
              )}

              {/* Status messages */}
              <div className="text-xs font-mono text-slate-400 mt-2">
                {callState === 'initiating' && 'Connecting to encrypted relay gateway...'}

                {callState === 'connected' && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-bold flex items-center justify-center gap-1.5 text-sm">
                      <Activity className="w-4 h-4 animate-pulse inline" /> Connected with {activeDonorName} ({formatTime(seconds)})
                    </span>
                    <p className="text-[10px] text-emerald-300 font-mono">
                      Live encrypted voice bridge active. Forwarding halted.
                    </p>
                  </div>
                )}

                {callState === 'rejected' && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 space-y-1">
                    <div className="font-bold font-hud text-sm flex items-center justify-center gap-1.5">
                      <PhoneOff className="w-4 h-4 text-red-400" />
                      <span>Forwarding Queue Exhausted</span>
                    </div>
                    <p className="text-[11px] text-red-200">
                      All compatible donors in the forwarding queue were contacted without response. Continuing hospital emergency escalation pipeline.
                    </p>
                  </div>
                )}

                {callState === 'ended' && <span className="text-slate-400">Communication Ended</span>}
              </div>

              {/* Masked Relay Numbers HUD */}
              <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-100 p-4 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 text-left text-xs font-mono space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hospital Virtual Relay:</span>
                  <span className="text-sky-400 font-bold">{virtualHospitalNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Donor Masked Bridge:</span>
                  <span className="text-amber-400 font-bold">{virtualDonorNumber}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>100% Privacy Protection: Real phone numbers remain strictly confidential.</span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex justify-center pt-2">
                {callState === 'rejected' || callState === 'ended' ? (
                  <button
                    onClick={onClose}
                    className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider transition"
                  >
                    Close Window
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="px-8 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-900/50 transition"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>{callState === 'awaiting_approval' ? 'Cancel Call' : 'End Secure Call'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
