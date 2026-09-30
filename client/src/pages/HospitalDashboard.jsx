import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Hospital as HospitalIcon, 
  Flame, 
  Radio, 
  Send, 
  Users, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Cpu,
  Layers,
  MapPin,
  RefreshCw,
  LayoutDashboard,
  PlusCircle,
  Activity,
  Phone,
  MessageSquare,
  Bell,
  Lock
} from 'lucide-react';
import LiveMap from '../components/LiveMap';
import EscalationTimeline from '../components/EscalationTimeline';
import NewRequestModal from '../components/NewRequestModal';
import SecureCallModal from '../components/SecureCallModal';
import EmergencyMessageModal from '../components/EmergencyMessageModal';
import { api } from '../services/api';
import { playEmergencySiren, playSuccessChime } from '../utils/soundEffects';

export default function HospitalDashboard() {
  const { user } = useAuth();

  // Rule 4: Hospital Sidebar Modules
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'create-request', 'active-requests', 'donor-matches', 'emergency-center', 'notifications'

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscalating] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  
  // Modals for Secure Call & Emergency Message (Rules 6 & 7)
  const [callingDonor, setCallingDonor] = useState(null);
  const [messagingDonor, setMessagingDonor] = useState(null);

  const hospitalId = user?.hospitalId || user?.profile?._id || user?.profile?.id || 'hosp_01';
  const hospitalName = user?.name || user?.profile?.name || 'PSG Institute of Medical Sciences & Research';
  const selectedReqIdRef = React.useRef(null);
  selectedReqIdRef.current = selectedRequest?._id;

  const fetchDashboardData = async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      const reqRes = await api.getRequests();
      if (reqRes.success) {
        setRequests(reqRes.requests || []);
        if (reqRes.requests.length > 0) {
          const currentId = selectedReqIdRef.current;
          const current = (currentId && reqRes.requests.find(r => r._id === currentId)) || reqRes.requests[0];
          setSelectedRequest(current);
          if (!isPoll || current.bloodGroup !== selectedRequest?.bloodGroup) {
            fetchMatches(current.bloodGroup);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  const fetchMatches = async (bloodGroup) => {
    try {
      const matchRes = await api.calculateMatches({
        bloodGroup,
        lat: 11.0264,
        lng: 77.0028
      });
      if (matchRes.success) {
        setMatchedDonors(matchRes.donors || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  const handleEscalateCurrent = async () => {
    if (!selectedRequest) return;
    setEscalating(true);
    playEmergencySiren();
    try {
      const res = await api.escalateRequest(selectedRequest._id || selectedRequest.id);
      if (res.success) {
        setSelectedRequest(res.request);
        setRequests(requests.map(r => (r._id === res.request._id ? res.request : r)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEscalating(false);
    }
  };

  const handleDispatchDonor = async (donor) => {
    playEmergencySiren();
    playSuccessChime();
    setAlertSuccess(`Emergency siren & priority dispatch broadcasted to ${donor.donorName}!`);
    setTimeout(() => setAlertSuccess(''), 4000);

    if (selectedRequest) {
      await api.dispatchAlert(selectedRequest._id || selectedRequest.id, [donor.donorId]);
    }
  };

  const activeCount = requests.filter(r => r.status === 'Matching' || r.status === 'Escalating').length;
  const fulfilledCount = requests.filter(r => r.status === 'Fulfilled').length;
  const totalUnitsSecured = requests.reduce((acc, r) => acc + (r.unitsSecured || 0), 0);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-request', label: 'Create Request', icon: PlusCircle },
    { id: 'active-requests', label: 'Active Requests', icon: Layers, badge: activeCount },
    { id: 'donor-matches', label: 'Donor Matches', icon: Cpu },
    { id: 'emergency-center', label: 'Emergency Center', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Rule 4: Hospital Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="hud-panel p-4 rounded-2xl border-slate-800 space-y-4 sticky top-24">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center font-bold text-white shadow-md">
                <HospitalIcon className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{hospitalName}</div>
                <div className="text-[10px] font-mono text-red-400">Level-1 Trauma Command</div>
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'create-request') {
                        setIsModalOpen(true);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-900/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white text-red-700' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Zero Personal Info Exposure</span>
            </div>
          </div>
        </aside>

        {/* Main Content Modules */}
        <main className="flex-1 space-y-6">
          {alertSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-pulse">
              <span>{alertSuccess}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          )}

          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Status Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-red-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Active Requests</div>
                  <div className="text-3xl font-bold font-hud text-red-400 mt-1">{activeCount}</div>
                  <p className="text-[10px] text-red-300 mt-1 font-mono">Live Radar Matching</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-sky-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Donors Contacted</div>
                  <div className="text-3xl font-bold font-hud text-sky-400 mt-1">{matchedDonors.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Encrypted Relay Active</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-emerald-500 bg-emerald-950/10">
                  <div className="text-[10px] font-mono text-emerald-300 uppercase">Blood Secured</div>
                  <div className="text-3xl font-bold font-hud text-emerald-400 mt-1">{totalUnitsSecured} Units</div>
                  <p className="text-[10px] text-emerald-400 mt-1 font-mono">Bedside Transfusion Ready</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-amber-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Fulfilled Requests</div>
                  <div className="text-3xl font-bold font-hud text-amber-400 mt-1">{fulfilledCount}</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Zero Mortality Standard</p>
                </div>
              </div>

              {/* Active Emergency Escalation Highlight */}
              {selectedRequest && (
                <EscalationTimeline
                  currentStage={selectedRequest.escalationStage || 'Nearby Donors'}
                  onEscalate={handleEscalateCurrent}
                  isHospital={true}
                  requestId={selectedRequest._id}
                  loading={escalating}
                />
              )}

              {/* Quick Donor Matching Preview */}
              <div className="hud-panel p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Live Donor Matches for {selectedRequest?.bloodGroup || 'O+'}</span>
                  </h3>
                  <button onClick={() => setActiveTab('donor-matches')} className="text-xs text-sky-400 hover:underline font-mono">
                    View Full Ranked Matches
                  </button>
                </div>

                <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Rule 5 & 12 Enforced: Donor phone, email, and address are strictly hidden.</span>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 3: ACTIVE REQUESTS */}
          {activeTab === 'active-requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                  Active Emergency Requests ({requests.length})
                </h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-hud uppercase tracking-wider"
                >
                  + New Emergency Request
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {requests.map(req => (
                  <div
                    key={req._id}
                    onClick={() => {
                      setSelectedRequest(req);
                      fetchMatches(req.bloodGroup);
                    }}
                    className={`hud-panel p-4 rounded-xl border cursor-pointer transition ${
                      selectedRequest?._id === req._id ? 'border-red-500 bg-red-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800">
                          {req.priorityLevel} PRIORITY
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{req.patientName || 'Emergency Patient'}</h4>
                        <p className="text-xs text-slate-400">Escalation Stage: <strong className="text-amber-400">{req.escalationStage}</strong></p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold font-hud text-red-400">{req.bloodGroup}</div>
                        <div className="text-xs font-mono text-slate-300">{req.unitsSecured} / {req.unitsRequired} Units Secured</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 4: DONOR MATCHES (Strict Privacy Protection - Rule 5, 12) */}
          {activeTab === 'donor-matches' && (
            <div className="hud-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Smart Matching Engine (40% Compat + 25% Dist + 20% Avail + 15% Trust)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target Blood Group: <strong className="text-red-400">{selectedRequest?.bloodGroup || 'O+'}</strong>
                  </p>
                </div>
              </div>

              {/* Privacy Warning Header */}
              <div className="bg-emerald-950/50 border border-emerald-500/30 p-3 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  RULE 5 PRIVACY COMPLIANT: Personal phone numbers, emails, and home addresses are never exposed to hospitals.
                </span>
              </div>

              {/* Ranked Matches Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Rank & Donor Alias</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Distance</th>
                      <th className="p-3">Match Score</th>
                      <th className="p-3">Availability</th>
                      <th className="p-3 text-right">Actions (Rules 6 & 7)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                    {matchedDonors.map((d, idx) => {
                      const matchRecord = (selectedRequest?.matchedDonors || []).find(m => m.donorId === (d.donorId || d._id));
                      const donorStatus = matchRecord?.status || d.status;
                      const hasCallConsent = donorStatus === 'Doctor Call Requested' || donorStatus === 'I Can Donate' || donorStatus === 'Accepted' || matchRecord?.callConsentGranted;
                      const isNeedTime = donorStatus === 'Need Some Time';
                      const isNotAvailable = donorStatus === 'Not Available';

                      return (
                      <tr key={d.donorId || idx} className="hover:bg-slate-900/50">
                        <td className="p-3 font-semibold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{d.donorName}</span>
                              {donorStatus === 'Doctor Call Requested' && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono text-[9px] border border-sky-500 animate-pulse flex items-center gap-0.5">
                                  📞 Doctor Call Requested
                                </span>
                              )}
                              {donorStatus === 'I Can Donate' && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[9px] border border-emerald-600">
                                  ✓ I Can Donate
                                </span>
                              )}
                              {isNeedTime && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[9px] border border-amber-600">
                                  ⏳ Need Some Time
                                </span>
                              )}
                              {isNotAvailable && (
                                <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[9px] border border-red-800">
                                  ✗ Not Available
                                </span>
                              )}
                              {!donorStatus && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px] border border-slate-800">
                                  ⏳ Awaiting Response
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">🔒 Relay Masked</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold font-mono border border-red-800">
                            {d.bloodGroup}
                          </span>
                        </td>

                        <td className="p-3 text-slate-300 font-mono">
                          {d.distanceKm} km
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-emerald-400 font-hud text-sm">
                            {d.matchPercentage}%
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="text-[11px] font-mono text-emerald-400">
                            ● {d.availability}
                          </span>
                        </td>

                        <td className="p-3 text-right space-x-1.5">
                          {/* Rule 7: Emergency Message System */}
                          <button
                            onClick={() => setMessagingDonor(d)}
                            title="Send Emergency Message"
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>

                          {/* Advanced Masked Calling: Consent-Aware */}
                          <button
                            onClick={() => {
                              setCallingDonor({
                                ...d,
                                requestStatus: donorStatus || 'pending'
                              });
                            }}
                            title={hasCallConsent ? "Donor Requested Call - Consent Granted" : "Contact Donor (Direct Calling requires verification if no consent)"}
                            className={`px-3 py-1 text-white rounded-lg text-xs font-bold font-hud uppercase tracking-wider transition inline-flex items-center gap-1 shadow-md ${
                              hasCallConsent
                                ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/40 ring-1 ring-sky-400'
                                : 'bg-red-600 hover:bg-red-500 shadow-red-900/40'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{hasCallConsent ? 'Call Donor (Authorized)' : 'Contact Donor'}</span>
                          </button>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 5: EMERGENCY CENTER */}
          {activeTab === 'emergency-center' && (
            <div className="space-y-6">
              {selectedRequest && (
                <EscalationTimeline
                  currentStage={selectedRequest.escalationStage || 'Nearby Donors'}
                  onEscalate={handleEscalateCurrent}
                  isHospital={true}
                  requestId={selectedRequest._id}
                  loading={escalating}
                />
              )}

              <div className="hud-panel p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                  Regional Medical Geofence Radar
                </h3>
                <LiveMap
                  hospitals={[{ name: hospitalName, location: { lat: 11.0264, lng: 77.0028 } }]}
                  requests={requests}
                  height="400px"
                />
              </div>
            </div>
          )}

          {/* MODULE 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="hud-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                Trauma Desk Notifications
              </h3>
              <p className="text-xs text-slate-400">
                Live alerts regarding donor responses, relay bridge connection logs, and escalation triggers.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hospital={{ name: hospitalName, location: { lat: 11.0264, lng: 77.0028 } }}
        onCreated={(newReq) => {
          setRequests([newReq, ...requests]);
          setSelectedRequest(newReq);
          fetchMatches(newReq.bloodGroup);
          setActiveTab('donor-matches');
        }}
      />

      {/* Rule 6: Secure Virtual Relay Call Modal with Emergency Forwarding */}
      <SecureCallModal
        isOpen={!!callingDonor}
        onClose={() => setCallingDonor(null)}
        donor={callingDonor}
        hospitalName={hospitalName}
        requestId={selectedRequest?._id}
        bloodGroup={selectedRequest?.bloodGroup}
        unitsRequired={selectedRequest?.unitsRequired}
        requestType={selectedRequest?.category || 'Category 1 – Emergency Request'}
        requiredTime={selectedRequest?.requiredWithin || 'Immediate (< 30 Mins)'}
        rankedDonors={matchedDonors}
      />

      {/* Rule 7: Emergency Message Modal */}
      <EmergencyMessageModal
        isOpen={!!messagingDonor}
        onClose={() => setMessagingDonor(null)}
        donor={messagingDonor}
        hospitalName={hospitalName}
        bloodGroup={selectedRequest?.bloodGroup}
        unitsRequired={selectedRequest?.unitsRequired}
        onMessageSent={() => {
          setAlertSuccess(`Emergency message sent to ${messagingDonor?.donorName}!`);
          setTimeout(() => setAlertSuccess(''), 3000);
        }}
      />
    </div>
  );
}
