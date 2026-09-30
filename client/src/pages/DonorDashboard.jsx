import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  Award, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Radio, 
  User, 
  Bell, 
  Settings, 
  History, 
  FileText, 
  AlertTriangle,
  Phone,
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Check,
  X,
  MessageSquare,
  PhoneCall,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import LiveMap from '../components/LiveMap';
import CertificateModal from '../components/CertificateModal';
import IncomingAlertModal from '../components/IncomingAlertModal';
import SecureCallModal from '../components/SecureCallModal';
import AIForecastCard from '../components/AIForecastCard';
import DonorBloodRequestModal from '../components/DonorBloodRequestModal';
import { api } from '../services/api';
import { playSuccessChime, playEmergencySiren } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export default function DonorDashboard() {
  const { user } = useAuth();
  
  // Rule 4: Dedicated Modules via Sidebar Navigation including Three Categories
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'emergency', 'volunteer', 'scheduled', 'profile', 'history', 'notifications', 'settings'
  
  const [donorProfile, setDonorProfile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [volunteerDrives, setVolunteerDrives] = useState([]);
  const [scheduledRequests, setScheduledRequests] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [availability, setAvailability] = useState('Available Now');
  const [selectedCert, setSelectedCert] = useState(null);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [activeRelayCall, setActiveRelayCall] = useState(null);
  const [myBloodRequests, setMyBloodRequests] = useState([]);
  const [isNeedBloodOpen, setIsNeedBloodOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [showActivityBanner, setShowActivityBanner] = useState(true);
  const [nextPopupMsg, setNextPopupMsg] = useState('');

  const donorId = user?.donorId || user?.profile?._id || user?.profile?.id || 'donor_01';

  const loadData = async () => {
    try {
      setLoading(true);
      const feedRes = await api.getDonorFeed(donorId);
      if (feedRes.success) {
        setDonorProfile(feedRes.donor);
        setAvailability(feedRes.donor.availability || 'Available Now');
        setFeed(feedRes.feed || []);
        if (feedRes.categorized) {
          setEmergencyRequests(feedRes.categorized.emergency || []);
          setVolunteerDrives(feedRes.categorized.volunteer || []);
          setScheduledRequests(feedRes.categorized.scheduled || []);
        }
      }

      const histRes = await api.getDonorHistory(donorId);
      if (histRes.success) {
        setHistoryList(histRes.donations || []);
        setCertificates(histRes.certificates || []);
      }

      // Fetch donor's own emergency blood requests (Need Blood feature)
      try {
        const myReqRes = await api.getDonorBloodRequests(donorId);
        if (myReqRes.success) {
          setMyBloodRequests(myReqRes.requests || []);
        }
      } catch (err) {
        console.error(err);
      }

      const notifRes = await api.getDonorNotifications(donorId);
      if (notifRes.success) {
        setNotifications(notifRes.notifications || []);

        // Check if unresolved activity check exists
        const hasUnresolvedReminder = (notifRes.notifications || []).some(n => n.type === 'activity_reminder' && !n.isRead && !n.resolved);
        const needsConfirmation = feedRes?.donor?.needsActivityConfirmation || hasUnresolvedReminder || feedRes?.donor?.activityStatus === 'pending_confirmation';
        setShowActivityBanner(Boolean(needsConfirmation));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handledSessions = React.useRef(new Set());

  // COMMUNICATION RULE:
  // Calls must only originate from Hospital -> Emergency Contact Request.
  // Never generate calls from login, activity confirmation, request acceptances, page refresh or dashboard load.
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await api.getActiveRelayRequest(donorId);
        if (res.success && res.activeRequest) {
          const req = res.activeRequest;
          if (!handledSessions.current.has(req.sessionId)) {
            setIncomingAlert({
              type: 'emergency_call',
              metadata: {
                sessionId: req.sessionId,
                hospitalName: req.hospitalName,
                bloodGroupRequired: req.bloodGroupRequired,
                unitsNeeded: req.unitsNeeded,
                requiredTime: req.requiredTime,
                requestType: req.requestType
              }
            });
          }
        }
      } catch (e) {
        // silent
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [donorId]);

  useEffect(() => {
    loadData();
  }, [donorId]);

  const handleAvailabilityChange = async (newStatus) => {
    setAvailability(newStatus);
    await api.updateAvailability(donorId, newStatus);
    if (donorProfile) setDonorProfile({ ...donorProfile, availability: newStatus });
  };

  // 90-Day AI Active Donor Verification: Yes, I Am Active
  const handleConfirmActiveStatus = async () => {
    setShowActivityBanner(false);
    setNextPopupMsg('Active donor status verified! Digital Twin & AI Readiness Recalculated. Next verification in 90 days.');
    playSuccessChime();
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.5 } });

    try {
      const res = await api.confirmDonorActive(donorId);
      if (res.success && res.donor) {
        setDonorProfile(res.donor);
        setStatusMessage('AI Digital Twin & Readiness scores successfully recalculated!');
        setTimeout(() => setStatusMessage(''), 4500);
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // 90-Day AI Active Donor Verification: No, I Am Not Available
  const handleTemporarilyUnavailable = async () => {
    setShowActivityBanner(false);
    setNextPopupMsg('Status set to Not Available. Emergency matching paused until you re-activate.');
    try {
      const res = await api.setTemporarilyUnavailable(donorId);
      if (res.success && res.donor) {
        setDonorProfile(res.donor);
      }
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    if (action === 'accept' || action === 'can_donate') {
      playSuccessChime();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
    const res = await api.donorRespondRequest(
      requestId,
      donorId,
      action,
      donorProfile?.name || user?.name || 'Verified Donor'
    );
    if (res.success) {
      if (action === 'please_call_me') {
        setStatusMessage('📞 Doctor Call Requested: Hospital emergency desk notified to contact you.');
      } else if (action === 'need_time') {
        setStatusMessage('⏳ Status updated: "Need Some Time". Hospital notified.');
      } else if (action === 'not_available') {
        setStatusMessage('✕ Status updated: "Not Available".');
      } else {
        setStatusMessage('✓ Thank you! Response recorded: "I Can Donate". Hospital team notified.');
      }
      setTimeout(() => setStatusMessage(''), 4500);
      loadData();
    }
  };

  // Quick-response messaging between donor and hospital
  const handleSendQuickMessage = async (requestId, messageText) => {
    try {
      const res = await api.sendQuickMessage(requestId, {
        senderId: donorId,
        senderRole: 'donor',
        senderName: donorProfile?.name || user?.name || 'Verified Donor',
        message: messageText
      });
      if (res.success) {
        setStatusMessage(`💬 Quick response sent: "${messageText}"`);
        setTimeout(() => setStatusMessage(''), 4000);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category 2: Respond to Volunteer Blood Donation Drive (Register, Interested, Decline)
  const handleRespondDrive = async (requestId, status) => {
    if (status === 'Register') {
      playSuccessChime();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    const res = await api.respondDrive(
      requestId,
      donorId,
      status,
      donorProfile?.name || user?.name || 'Verified Donor'
    );
    if (res.success) {
      setStatusMessage(`Drive response '${status}' recorded successfully.`);
      setTimeout(() => setStatusMessage(''), 4000);
      loadData();
    }
  };

  const activityCheckPending = notifications.some(n => n.type === 'activity_reminder' && !n.isRead && !n.resolved) ||
    donorProfile?.needsActivityConfirmation ||
    donorProfile?.activityStatus === 'pending_confirmation';

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-requests', label: 'My Blood Requests', icon: HeartHandshake, badge: myBloodRequests.length },
    { id: 'emergency', label: 'Emergency Requests', icon: Flame, badge: emergencyRequests.length },
    { id: 'volunteer', label: 'Volunteer Requests', icon: Users, badge: volunteerDrives.length },
    { id: 'scheduled', label: 'Scheduled Requests', icon: Calendar, badge: scheduledRequests.length },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'history', label: 'Donation History', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.isRead).length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Modern Tactical Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="hud-panel p-4 rounded-2xl border-slate-800 space-y-4 sticky top-24">
            
            {/* Donor Identity Card with AI Activity Indicator at the Top */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
              {/* Small Top Indicator */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">AI Activity Status:</span>
                <span className={`text-[10px] font-hud font-bold px-2 py-0.5 rounded-full border ${
                  donorProfile?.aiForecast?.activityClass === 'risk_of_inactive'
                    ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
                    : donorProfile?.aiForecast?.activityClass === 'moderately_active'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                }`}>
                  {donorProfile?.aiForecast?.activityLabel || '🟢 Highly Active'}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold font-hud text-lg text-white shadow-md shadow-emerald-900/40">
                  {donorProfile?.bloodGroup || 'O+'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate">{donorProfile?.name || user?.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400">● {availability}</div>
                </div>
              </div>
            </div>

            {/* Feature 2: Prominent "Need Blood?" Emergency Action Button */}
            <button
              onClick={() => setIsNeedBloodOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold font-hud uppercase tracking-wider text-xs shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Flame className="w-4 h-4 animate-pulse" />
              <span>Need Blood?</span>
            </button>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white text-emerald-700' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Exposure Protected</span>
            </div>
          </div>
        </aside>

        {/* Dedicated Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-fade-in font-mono">
              <span>{statusMessage}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
          )}

          {/* Tiny Pop-up Message after confirmation indicating next popup will come after 90 days */}
          {nextPopupMsg && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-xl shadow-emerald-950/50 animate-fade-in font-mono">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold">{nextPopupMsg}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2.5 py-0.5 rounded font-bold border border-emerald-700/60 uppercase tracking-wider font-hud">
                  Next Pop-up: in 90 Days
                </span>
                <button 
                  onClick={() => setNextPopupMsg('')} 
                  className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 transition"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 90-Day AI Active Donor Verification Banner */}
          {showActivityBanner && !nextPopupMsg && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-600/20 text-sky-400">
                  <Radio className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-hud uppercase tracking-wider text-sky-300">
                    AI Active Donor Verification System
                  </h4>
                  <p className="text-xs text-slate-300 font-medium">
                    Are you still an active blood donor?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmActiveStatus}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-emerald-900/50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Yes, I Am Active</span>
                </button>
                <button
                  onClick={handleTemporarilyUnavailable}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>No, I Am Not Available</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Quick Header Bar with Need Blood Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <div className="text-xs text-slate-400 font-mono">Welcome to BloodLink AI Network,</div>
              <h2 className="text-base font-bold font-hud text-white mt-0.5">{donorProfile?.name || user?.name}</h2>
            </div>

            <button
              onClick={() => setIsNeedBloodOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#D62839] hover:bg-red-700 text-white text-xs font-bold font-hud uppercase tracking-wider shadow-lg shadow-red-900/40 flex items-center gap-2 transition"
            >
              <Flame className="w-4 h-4 animate-pulse" />
              <span>Need Blood?</span>
            </button>
          </div>

          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Feature 1: AI Donor Activity Forecast Card */}
              <AIForecastCard donor={donorProfile} onVerifyActive={handleConfirmActiveStatus} />

              {/* Stats HUD */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Blood Group & Status</div>
                  <div className="text-2xl font-bold font-hud text-red-400 mt-1">{donorProfile?.bloodGroup || 'O+'}</div>
                  <p className="text-[10px] text-emerald-400 mt-1 font-mono">Rh+ Universal Compatible</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Engagement & Trust</div>
                  <div className="text-2xl font-bold font-hud text-sky-400 mt-1">{donorProfile?.engagementScore || donorProfile?.trustScore || 98}%</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Verified Active Network Rating</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 bg-red-950/20">
                  <div className="text-[10px] font-mono text-red-300 uppercase">Lives Saved</div>
                  <div className="text-2xl font-bold font-hud text-white mt-1">{donorProfile?.livesSaved || 8}</div>
                  <p className="text-[10px] text-red-400 mt-1 font-mono">Direct Emergency Transfusions</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Donations Count</div>
                  <div className="text-2xl font-bold font-hud text-amber-400 mt-1">{donorProfile?.donationsCount || 6}</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Verified Commendations</p>
                </div>
              </div>

              {/* Three Categories Quick Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category 1 Summary */}
                <div 
                  onClick={() => setActiveTab('emergency')}
                  className="hud-panel p-4 rounded-xl border-red-500/40 hover:border-red-500 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-hud uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                      Category 1: Emergency
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 font-bold">
                      {emergencyRequests.length} Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Trauma, ICU & critical surgery life-threat emergencies with sound alert.</p>
                  <div className="text-[11px] text-red-400 font-semibold group-hover:underline flex items-center gap-1">
                    Open Emergency Feed →
                  </div>
                </div>

                {/* Category 2 Summary */}
                <div 
                  onClick={() => setActiveTab('volunteer')}
                  className="hud-panel p-4 rounded-xl border-emerald-500/40 hover:border-emerald-500 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-hud uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-500" />
                      Category 2: Volunteer Drives
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {volunteerDrives.length} Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">College drives, NGO awareness programs & campus donation camps.</p>
                  <div className="text-[11px] text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                    View Volunteer Drives →
                  </div>
                </div>

                {/* Category 3 Summary */}
                <div 
                  onClick={() => setActiveTab('scheduled')}
                  className="hud-panel p-4 rounded-xl border-amber-500/40 hover:border-amber-500 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-hud uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Category 3: Scheduled
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      {scheduledRequests.length} Scheduled
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Planned surgeries, organ transplants & advance blood bank reservations.</p>
                  <div className="text-[11px] text-amber-400 font-semibold group-hover:underline flex items-center gap-1">
                    View Scheduled Requests →
                  </div>
                </div>
              </div>

              {/* Quick Urgent Requests preview */}
              <div className="hud-panel p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Immediate Life-Threat Emergencies</span>
                  </h3>
                  <button onClick={() => setActiveTab('emergency')} className="text-xs text-red-400 hover:underline font-mono">
                    View All ({emergencyRequests.length})
                  </button>
                </div>

                {emergencyRequests.slice(0, 2).map(req => (
                  <div key={req._id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800">
                        {req.priorityLevel} ALERT
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{req.hospitalName}</h4>
                      <p className="text-xs text-slate-400">Need {req.unitsRequired} Units {req.bloodGroup} • ~{req.distanceKm} km away</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondRequest(req._id, 'accept')}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-hud uppercase tracking-wider"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recognition Badges */}
              <div className="hud-panel p-5 rounded-2xl">
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Verified Recognition Badges</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'First Donation', icon: '🎖️', active: true },
                    { label: 'Life Saver', icon: '🌟', active: true },
                    { label: 'Hero Donor', icon: '🛡️', active: true },
                    { label: 'Platinum Donor', icon: '👑', active: false },
                  ].map(b => (
                    <div key={b.label} className={`p-3 rounded-xl border text-center ${b.active ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-slate-950/40 border-slate-800 text-slate-600'}`}>
                      <div className="text-2xl mb-1">{b.icon}</div>
                      <div className="text-xs font-bold">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE: MY BLOOD REQUESTS ("Need Blood?" Feature Tracking) */}
          {activeTab === 'my-requests' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span>My Emergency Blood Requisitions ({myBloodRequests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live emergency pipeline tracking for blood requests created by you or your family.
                  </p>
                </div>
                <button
                  onClick={() => setIsNeedBloodOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider shadow-lg shadow-red-900/40 flex items-center gap-1.5 transition"
                >
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>Request Blood (Need Blood?)</span>
                </button>
              </div>

              {myBloodRequests.length === 0 ? (
                <div className="hud-panel p-10 text-center space-y-3 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center mx-auto text-red-400">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white font-hud">No Active Emergency Requisitions</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Need blood for yourself, a loved one, or an emergency patient? Use the "Need Blood?" button to launch an emergency requisition into the AI response grid.
                  </p>
                  <button
                    onClick={() => setIsNeedBloodOpen(true)}
                    className="px-5 py-2.5 bg-[#D62839] hover:bg-red-700 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider shadow-lg shadow-red-900/50 inline-flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 animate-pulse" />
                    <span>Request Blood Now</span>
                  </button>
                </div>
              ) : (
                myBloodRequests.map((req) => (
                  <div key={req._id} className="hud-panel p-5 rounded-2xl border-l-4 border-l-red-500 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                            {req.priorityLevel || 'Critical'} Priority
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {req._id}</span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Community Network Verified
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                          <span>Patient: {req.patientName || 'Emergency Patient'}</span>
                        </h4>
                        <p className="text-xs text-slate-300 font-mono mt-0.5">
                          Hospital: <strong className="text-white">{req.hospitalName}</strong> • {typeof req.location === 'string' ? req.location : (req.location?.address || 'Peelamedu, Coimbatore')}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold font-hud text-red-400">
                          {req.unitsRequired} Units {req.bloodGroup}
                        </div>
                        <div className="text-xs font-mono text-emerald-400">
                          {req.unitsSecured || 0} / {req.unitsRequired} Units Secured
                        </div>
                      </div>
                    </div>

                    {/* Emergency Pipeline Workflow Visualizer */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Emergency Pipeline Progression</span>
                        <span className="text-emerald-400 font-bold">Current: {req.escalationStage || 'Nearby Donors'}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-7 gap-1 text-[10px] font-mono text-center">
                        {[
                          'Request Created',
                          'AI Matching',
                          'Nearby Donors',
                          'Blood Banks',
                          'Partner Hospitals',
                          'Emergency SOS',
                          'Blood Secured'
                        ].map((stageName, sIdx) => {
                          const stages = ['Request Created', 'AI Matching', 'Nearby Donors', 'Blood Banks', 'Partner Hospitals', 'Emergency SOS', 'Blood Secured'];
                          const currentStageIdx = stages.indexOf(req.escalationStage || 'Nearby Donors');
                          const isDone = sIdx <= (currentStageIdx === -1 ? 2 : currentStageIdx);
                          const isCurrent = sIdx === (currentStageIdx === -1 ? 2 : currentStageIdx);

                          return (
                            <div 
                              key={stageName}
                              className={`p-1.5 rounded-lg border text-center transition ${
                                isCurrent
                                  ? 'bg-red-950 text-red-200 border-red-500 font-bold animate-pulse'
                                  : isDone
                                  ? 'bg-slate-900 text-emerald-300 border-emerald-700/60'
                                  : 'bg-slate-950 text-slate-600 border-slate-800'
                              }`}
                            >
                              <div className="text-[9px] font-bold">#{sIdx + 1}</div>
                              <div className="truncate">{stageName}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Matched Donors & Details Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-800/80 font-mono">
                      <div className="text-slate-400">
                        Compatible Donors Alerted: <strong className="text-sky-400">{(req.matchedDonors || []).length} Donors</strong>
                      </div>
                      <div className="text-slate-400">
                        Status: <strong className="text-emerald-400">{req.status}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MODULE 2: CATEGORY 1 – EMERGENCY REQUESTS */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span>Category 1 – Immediate Emergency Requests ({emergencyRequests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Highest Priority trauma & ICU requests with immediate AI matching and automated escalation.
                  </p>
                </div>
              </div>

              {emergencyRequests.length === 0 ? (
                <div className="hud-panel p-8 text-center text-slate-400 text-xs">
                  No active emergency requests in your immediate geofence sector.
                </div>
              ) : (
                emergencyRequests.map(req => (
                  <div key={req._id} className="hud-panel p-5 rounded-2xl border-l-4 border-l-red-500 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                            {req.priorityLevel} PRIORITY
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {req._id}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5">{req.hospitalName}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Required: {req.requiredTime}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold font-hud text-red-400">{req.unitsRequired} Units {req.bloodGroup}</div>
                        <div className="text-xs font-mono text-emerald-400">~{req.distanceKm} km away</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 italic">
                      "{req.caseNotes}"
                    </p>

                    {/* Active Donor Response Badge if already chosen */}
                    {(() => {
                      const myResp = (req.donorResponses || []).find(r => r.donorId === donorId);
                      if (!myResp) return null;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">Your Current Status:</span>
                          <span className={`text-xs font-bold font-hud px-2.5 py-1 rounded-lg border ${
                            myResp.status === 'please_call_me'
                              ? 'bg-sky-950 text-sky-300 border-sky-600 animate-pulse'
                              : myResp.status === 'can_donate' || myResp.status === 'accept'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                              : myResp.status === 'need_time'
                              ? 'bg-amber-950 text-amber-300 border-amber-600'
                              : 'bg-red-950 text-red-300 border-red-600'
                          }`}>
                            {myResp.statusLabel || myResp.status}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Quick Response Messaging History */}
                    {req.quickMessages && req.quickMessages.length > 0 && (
                      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-red-400" />
                          <span>Emergency Live Messaging</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {req.quickMessages.slice(-3).map((qm, i) => (
                            <div key={i} className="text-xs flex items-center justify-between text-slate-300">
                              <span className="font-semibold text-slate-400">{qm.senderName} ({qm.senderRole}):</span>
                              <span className="font-medium text-white italic">"{qm.message}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Response Buttons */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">⚡ Quick-Response Message to Hospital:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'I am on the way',
                          'I will arrive in 30 minutes',
                          'Please call me',
                          'Not available today'
                        ].map((qMsg) => (
                          <button
                            key={qMsg}
                            onClick={() => handleSendQuickMessage(req._id, qMsg)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-white border border-slate-700 hover:border-red-500/50 text-[11px] font-medium transition"
                          >
                            {qMsg}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4 Core Emergency Communication Actions */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>🔒 Number Hidden • Consent-First Relay</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => handleRespondRequest(req._id, 'can_donate')}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-hud uppercase tracking-wider shadow-md shadow-emerald-900/40 transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>I Can Donate</span>
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req._id, 'need_time')}
                          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-hud uppercase tracking-wider shadow-md shadow-amber-900/40 transition flex items-center justify-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Need Some Time</span>
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req._id, 'please_call_me')}
                          className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-hud uppercase tracking-wider shadow-md shadow-sky-900/40 transition flex items-center justify-center gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Please Call Me</span>
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req._id, 'not_available')}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Not Available</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MODULE 3: CATEGORY 2 – VOLUNTEER BLOOD DONATION DRIVES */}
          {activeTab === 'volunteer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Category 2 – Volunteer Blood Donation Drives ({volunteerDrives.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Community camps, college drives, NGO programs & awareness campaigns.
                  </p>
                </div>
              </div>

              {volunteerDrives.length === 0 ? (
                <div className="hud-panel p-8 text-center text-slate-400 text-xs">
                  No volunteer donation drives scheduled at this time.
                </div>
              ) : (
                volunteerDrives.map(drive => {
                  const details = drive.driveDetails || {};
                  const myResponse = details.donorResponses?.find(r => r.donorId === donorId);

                  return (
                    <div key={drive._id} className="hud-panel p-5 rounded-2xl border-l-4 border-l-emerald-500 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                              🩸 Volunteer Donation Drive Available
                            </span>
                            {myResponse && (
                              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                                My Status: {myResponse.status}
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-bold text-white mt-2">
                            {details.eventName || drive.patientName || 'Community Blood Donation Drive'}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-mono">
                            <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span>Event Date: <strong>{details.eventDate || drive.requiredTime}</strong></span>
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold font-hud text-emerald-400">
                            {drive.unitsSecured || 0} / {drive.unitsRequired} Units
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">Pledged / Target Goal</p>
                        </div>
                      </div>

                      {/* Drive Fields: Location, Units, Organizer Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Location:</span>
                          <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            {details.locationName || drive.hospitalAddress || 'Main Campus Auditorium'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Organizer Details:</span>
                          <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            {details.organizerDetails?.name || 'Dr. R. Nandagopal'} ({details.organizerDetails?.organization || 'PSG Youth Red Cross & NSS'})
                          </span>
                          <span className="text-slate-400 text-[10px] block mt-0.5">
                            Contact: {details.organizerDetails?.contact || '+91 422 257 0170'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 italic">
                        "{drive.caseNotes}"
                      </p>

                      {/* Donor Options: Register, Interested, Decline */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-400 font-mono">Choose your participation:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespondDrive(drive._id, 'Decline')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              myResponse?.status === 'Decline'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespondDrive(drive._id, 'Interested')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                              myResponse?.status === 'Interested'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60'
                            }`}
                          >
                            Interested
                          </button>
                          <button
                            onClick={() => handleRespondDrive(drive._id, 'Register')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold font-hud uppercase tracking-wider transition ${
                              myResponse?.status === 'Register'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                            }`}
                          >
                            Register
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* MODULE 4: CATEGORY 3 – SCHEDULED BLOOD REQUESTS */}
          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Category 3 – Scheduled Blood Requests ({scheduledRequests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Planned surgeries, organ transplants & procedures with advance matching & blood reservation.
                  </p>
                </div>
              </div>

              {scheduledRequests.length === 0 ? (
                <div className="hud-panel p-8 text-center text-slate-400 text-xs">
                  No scheduled elective or transplant procedures currently requiring advance blood donor commitments.
                </div>
              ) : (
                scheduledRequests.map(sched => {
                  const details = sched.scheduledDetails || {};

                  return (
                    <div key={sched._id} className="hud-panel p-5 rounded-2xl border-l-4 border-l-amber-500 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                              📅 Advance Scheduled Procedure
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              ● Early AI Matching Active
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-white mt-2">
                            {details.procedureType || sched.condition || 'Living-Donor Transplant'}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 font-mono">
                            Hospital: <strong className="text-white">{sched.hospitalName}</strong>
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold font-hud text-amber-400">
                            {sched.unitsRequired} Units {sched.bloodGroup}
                          </div>
                          <div className="text-xs font-mono text-emerald-400">
                            {sched.unitsSecured || 1} Unit(s) Pre-Reserved
                          </div>
                        </div>
                      </div>

                      {/* Scheduled Details Card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Procedure Date / Target:</span>
                          <span className="text-amber-300 font-bold flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            {details.procedureDate || sched.requiredTime || 'Required after 4 days'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase text-[10px] block">Blood Reservation Support:</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {details.advanceReservationEnabled ? `Pre-Reserved at ${details.reservedBloodBankName || 'PSG Central Blood Bank'}` : 'Direct Donor Reservation'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 italic">
                        "{sched.caseNotes}"
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-400 font-mono">
                          Reminder notifications will be dispatched 24 hours prior to procedure.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespondRequest(sched._id, 'decline')}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespondRequest(sched._id, 'accept')}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold font-hud uppercase tracking-wider shadow-lg"
                          >
                            Commit to Scheduled Donation
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* MODULE 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="hud-panel p-6 rounded-2xl space-y-6">
              {/* Small Indicator at the top of the donor profile (Requirement 1) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">AI Forecast & Readiness Status:</span>
                <span className={`text-xs font-hud font-bold px-3 py-1 rounded-full border ${
                  donorProfile?.aiForecast?.activityClass === 'risk_of_inactive'
                    ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                    : donorProfile?.aiForecast?.activityClass === 'moderately_active'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}>
                  {donorProfile?.aiForecast?.activityLabel || '🟢 Highly Active'}
                </span>
              </div>

              {/* AI Forecast Card inside Profile */}
              <AIForecastCard donor={donorProfile} onVerifyActive={handleConfirmActiveStatus} />

              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xl">
                  {donorProfile?.bloodGroup || 'O+'}
                </div>
                <div>
                  <h2 className="text-lg font-bold font-hud text-white">{donorProfile?.name || user?.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">UIDAI Aadhaar Verified Active Donor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Blood Group:</span>
                  <span className="text-base font-bold text-red-400">{donorProfile?.bloodGroup || 'O+'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Aadhaar Status:</span>
                  <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Cryptographically Verified
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Geofence Sector:</span>
                  <span className="text-sm font-bold text-white">Coimbatore Metro (11.02°N, 77.00°E)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Contact Privacy Protection:</span>
                  <span className="text-sm font-bold text-emerald-400">100% Masked via Virtual Gateway</span>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 6: DONATION HISTORY */}
          {activeTab === 'history' && (
            <div className="hud-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                Donation History & Verified Certificates
              </h3>

              {certificates.map(cert => (
                <div key={cert._id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{cert.hospitalName}</h4>
                    <p className="text-xs font-mono text-slate-400">Cert: {cert.certificateNumber} • Units: {cert.units || 1}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCert(cert);
                      setIsCertOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600/40 text-xs font-semibold flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Certificate</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 7: NOTIFICATIONS (Pinned 90-Day Activity Confirmation) */}
          {activeTab === 'notifications' && (
            <div className="hud-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                Notification Center
              </h3>

              {/* Pinned 90-Day Activity Confirmation Card (Hides once confirmed) */}
              {activityCheckPending && showActivityBanner && (
                <div className="p-4 rounded-xl bg-sky-950/60 border-2 border-sky-500/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5 font-hud uppercase tracking-wider">
                      <Radio className="w-4 h-4 text-sky-400 animate-spin" />
                      90-Day Active Donor Status Verification
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Action Required</span>
                  </div>
                  <p className="text-xs text-slate-200">
                    "Are you still available as an active blood donor?"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Confirming active keeps you in the emergency network, continues emergency matching, and increases your engagement score.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleConfirmActiveStatus}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider transition flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Active</span>
                    </button>
                    <button
                      onClick={handleTemporarilyUnavailable}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Temporarily Unavailable</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resolved Note when confirmed */}
              {!showActivityBanner && nextPopupMsg && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Quarterly Active Status Verified</span>
                  </div>
                  <p className="text-slate-300">
                    Next verification reminder scheduled in 90 days. Thank you for keeping your profile active on the emergency network.
                  </p>
                </div>
              )}

              {notifications.map(notif => (
                <div key={notif._id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{notif.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-400">{notif.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 8: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="hud-panel p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                Duty Status & Privacy Settings
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block font-mono">Current Availability Status:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Available Now', color: 'bg-emerald-600', icon: '🟢' },
                    { label: 'Available Today', color: 'bg-amber-600', icon: '🟡' },
                    { label: 'Busy', color: 'bg-orange-600', icon: '🟠' },
                    { label: 'Unavailable', color: 'bg-red-700', icon: '🔴' }
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => handleAvailabilityChange(s.label)}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        availability === s.label
                          ? `${s.color} text-white shadow-lg`
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Emergency Popup Modal (Advanced Masked Calling & Emergency Message) */}
      <IncomingAlertModal
        alert={incomingAlert}
        onClose={() => {
          if (incomingAlert?.metadata?.sessionId) {
            handledSessions.current.add(incomingAlert.metadata.sessionId);
          }
          setIncomingAlert(null);
        }}
        onRespond={async (alert, action) => {
          const reqId = alert.metadata?.requestId || alert._id;
          if (alert.type === 'emergency_call') {
            if (alert.metadata?.sessionId) {
              handledSessions.current.add(alert.metadata.sessionId);
              await api.respondRelayCall(alert.metadata.sessionId, action === 'can_donate' || action === 'accept' ? 'accept' : action);
            }
            if (action === 'can_donate' || action === 'accept') {
              setActiveRelayCall({
                donorName: donorProfile?.name,
                bloodGroup: alert.metadata?.bloodGroupRequired || alert.metadata?.bloodGroup,
                unitsRequired: alert.metadata?.unitsNeeded || alert.metadata?.units,
                isDonorSide: true,
                sessionId: alert.metadata?.sessionId
              });
            }
          } else {
            handleRespondRequest(reqId, action);
          }
          setIncomingAlert(null);
        }}
        onQuickMessage={async (alert, msg) => {
          const reqId = alert.metadata?.requestId || alert._id;
          if (reqId) {
            handleSendQuickMessage(reqId, msg);
          }
        }}
        onAccept={async (alert) => {
          if (alert.type === 'emergency_call') {
            if (alert.metadata?.sessionId) {
              handledSessions.current.add(alert.metadata.sessionId);
              await api.respondRelayCall(alert.metadata.sessionId, 'accept');
            }
            setActiveRelayCall({
              donorName: donorProfile?.name,
              bloodGroup: alert.metadata?.bloodGroupRequired || alert.metadata?.bloodGroup,
              unitsRequired: alert.metadata?.unitsNeeded || alert.metadata?.units,
              isDonorSide: true,
              sessionId: alert.metadata?.sessionId
            });
          } else {
            handleRespondRequest(alert.metadata?.requestId, 'can_donate');
          }
          setIncomingAlert(null);
        }}
        onReject={async (alert, reason = 'reject') => {
          if (alert.type === 'emergency_call') {
            if (alert.metadata?.sessionId) {
              handledSessions.current.add(alert.metadata.sessionId);
              await api.respondRelayCall(alert.metadata.sessionId, reason === 'no_response' ? 'no_response' : 'reject');
            }
            setStatusMessage(reason === 'no_response'
              ? 'Response window expired. System automatically forwarded request to next compatible donor.'
              : 'Communication request declined. Auto-forwarding to next compatible donor.');
            setTimeout(() => setStatusMessage(''), 4500);
          } else {
            handleRespondRequest(alert.metadata?.requestId, 'not_available');
          }
          setIncomingAlert(null);
        }}
        onCallHospital={(alert) => {
          setActiveRelayCall({
            donorName: donorProfile?.name,
            bloodGroup: alert.metadata?.bloodGroup,
            unitsRequired: alert.metadata?.units || alert.metadata?.unitsNeeded
          });
        }}
      />

      {/* Secure Relay Voice Call Modal (Rule 6) */}
      <SecureCallModal
        isOpen={!!activeRelayCall}
        onClose={() => setActiveRelayCall(null)}
        donor={activeRelayCall}
        hospitalName="PSG Emergency Trauma Desk"
        bloodGroup={activeRelayCall?.bloodGroup}
        unitsRequired={activeRelayCall?.unitsRequired}
      />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        certificate={selectedCert}
        donorName={donorProfile?.name}
        bloodGroup={donorProfile?.bloodGroup}
      />

      {/* Feature 2: Donor Emergency Blood Request Modal ("Need Blood?") */}
      <DonorBloodRequestModal
        isOpen={isNeedBloodOpen}
        onClose={() => setIsNeedBloodOpen(false)}
        donor={donorProfile}
        onCreated={(newReq) => {
          setMyBloodRequests([newReq, ...myBloodRequests]);
          setActiveTab('my-requests');
          setStatusMessage('Emergency blood requisition dispatched to BloodLink AI matching engine!');
          setTimeout(() => setStatusMessage(''), 5000);
        }}
      />
    </div>
  );
}
