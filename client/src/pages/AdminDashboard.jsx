import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Users, 
  Hospital as HospitalIcon, 
  Droplet, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Terminal, 
  UserCheck, 
  RotateCcw,
  Ban,
  LayoutDashboard,
  Layers,
  BarChart3,
  Search,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { playSuccessChime } from '../utils/soundEffects';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Rule 4: Admin Sidebar Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'verification', 'analytics', 'auditlogs'

  const [stats, setStats] = useState({
    totalDonors: 0,
    totalHospitals: 0,
    totalBloodBanks: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalLivesSaved: 0
  });
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState({
    inactiveDonors: [],
    pendingHospitals: [],
    pendingBloodBanks: [],
    allDonors: [],
    allHospitals: [],
    allBloodBanks: []
  });
  const [actionMsg, setActionMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminOverview();
      if (res.success) {
        setStats(res.stats);
        setAnalytics(res.analytics);
        setLogs(res.recentLogs || []);
      }

      const qRes = await api.getVerificationQueue();
      if (qRes.success) {
        setVerificationQueue(qRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAction = async (entityType, entityId, actionType) => {
    try {
      const res = await api.verifyEntity(entityType, entityId, actionType);
      if (res.success) {
        playSuccessChime();
        setActionMsg(`Executed '${actionType.toUpperCase()}' for ${entityType} ${entityId}`);
        setTimeout(() => setActionMsg(''), 3000);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users, badge: (verificationQueue.allDonors || []).length },
    { id: 'verification', label: 'Verification Center', icon: UserCheck, badge: (verificationQueue.pendingHospitals || []).length + (verificationQueue.inactiveDonors || []).length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'auditlogs', label: 'Audit Logs', icon: Terminal, badge: logs.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Rule 4: Admin Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="hud-panel p-4 rounded-2xl border-slate-800 space-y-4 sticky top-24">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">Super Admin</div>
                <div className="text-[10px] font-mono text-indigo-400">Security Level-5 Clearance</div>
              </div>
            </div>

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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Modules */}
        <main className="flex-1 space-y-6">
          {actionMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-pulse">
              <span>{actionMsg}</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
          )}

          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Donors</div>
                  <div className="text-2xl font-bold font-hud text-white mt-1">{stats.totalDonors}</div>
                </div>
                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Hospitals</div>
                  <div className="text-2xl font-bold font-hud text-white mt-1">{stats.totalHospitals}</div>
                </div>
                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Blood Banks</div>
                  <div className="text-2xl font-bold font-hud text-white mt-1">{stats.totalBloodBanks}</div>
                </div>
                <div className="hud-panel p-4 rounded-xl border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Active Cases</div>
                  <div className="text-2xl font-bold font-hud text-red-400 mt-1">{stats.activeRequests}</div>
                </div>
                <div className="hud-panel p-4 rounded-xl border-slate-800 bg-red-950/20">
                  <div className="text-[10px] font-mono text-red-300 uppercase">Lives Saved</div>
                  <div className="text-2xl font-bold font-hud text-emerald-400 mt-1">{stats.totalLivesSaved}</div>
                </div>
              </div>

              {/* Demand Matrix */}
              <div className="hud-panel p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                  Blood Group Demand Matrix
                </h3>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {analytics?.bloodGroupDemand && Object.entries(analytics.bloodGroupDemand).map(([bg, count]) => (
                    <div key={bg} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs font-bold font-mono text-red-400 block">{bg}</span>
                      <span className="text-base font-bold font-hud text-white">{count} Units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="hud-panel p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                All Registered Donors & Entities
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Trust Score</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(verificationQueue.allDonors || []).map(d => (
                      <tr key={d._id || d.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-white font-bold">{d.name}</td>
                        <td className="p-3 text-red-400">{d.bloodGroup}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            d.activityStatus === 'inactive' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {d.activityStatus || 'active'}
                          </span>
                        </td>
                        <td className="p-3 text-sky-400">{d.trustScore || 95}%</td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleAction('donor', d._id || d.id, 'suspend')}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-red-300 text-[10px]"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 3: VERIFICATION CENTER (Rule 11) */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              {/* Rule 9 & 10: Inactive Donors Cleanup Management */}
              <div className="hud-panel p-5 rounded-2xl space-y-3 border-amber-500/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Inactive Donor Cleanup Engine (Rules 9 & 10)</span>
                  </h3>
                  <span className="text-xs font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Auto-Flagged (&gt;12 Months Inactivity)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Donors inactive for 12+ months are hidden from hospital searches. Admin can restore or archive records.
                </p>

                {(verificationQueue.inactiveDonors || []).length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-2">No inactive donors currently flagged.</p>
                ) : (
                  <div className="space-y-2">
                    {verificationQueue.inactiveDonors.map(d => (
                      <div key={d._id || d.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{d.name} ({d.bloodGroup})</div>
                          <div className="text-[10px] font-mono text-slate-500">Hidden from hospital searches for privacy compliance</div>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleAction('donor', d._id || d.id, 'restore')}
                            className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleAction('donor', d._id || d.id, 'deactivate')}
                            className="px-3 py-1 rounded bg-red-950 text-red-300 border border-red-700"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hospital & Blood Bank Verification (Rule 11: Approve, Suspend, Deactivate, Restore) */}
              <div className="hud-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                  Hospital & Blood Bank Accreditation Controls
                </h3>

                <div className="space-y-3">
                  {(verificationQueue.allHospitals || []).map(h => (
                    <div key={h._id || h.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-bold text-white">{h.name}</div>
                        <div className="text-[10px] text-slate-400">License: {h.licenseNumber} • Status: {h.verificationStatus}</div>
                      </div>

                      <div className="space-x-1.5">
                        <button
                          onClick={() => handleAction('hospital', h._id || h.id, 'approve')}
                          className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction('hospital', h._id || h.id, 'suspend')}
                          className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[11px]"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => handleAction('hospital', h._id || h.id, 'deactivate')}
                          className="px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-700 text-[11px]"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleAction('hospital', h._id || h.id, 'restore')}
                          className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 text-[11px]"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 4: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="hud-panel p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                State Emergency Blood Demand Trends
              </h3>
              <div className="grid grid-cols-5 gap-3 text-center">
                {(analytics?.demandTrends || []).map(t => (
                  <div key={t.month} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 font-mono block">{t.month}</span>
                    <span className="text-lg font-bold font-hud text-emerald-400">{Math.round((t.fulfilled / t.requests) * 100)}%</span>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.fulfilled}/{t.requests} cases</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 5: AUDIT LOGS */}
          {activeTab === 'auditlogs' && (
            <div className="hud-panel p-5 rounded-2xl space-y-3 font-mono text-xs">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                Immutable System Audit Stream (Rule 14)
              </h3>
              <div className="p-3 bg-black/60 rounded-xl space-y-2 max-h-[500px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log._id} className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="space-x-2">
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-sky-400 font-bold">{log.action}</span>
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                    <span className="text-slate-500">By {log.userName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
