import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Droplet, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Minus, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  LayoutDashboard, 
  ClipboardList, 
  Bell, 
  RefreshCw,
  Send,
  Hospital,
  Calendar,
  Flame,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { playSuccessChime } from '../utils/soundEffects';

export default function BloodBankDashboard() {
  const { user } = useAuth();

  // Rule 4: Blood Bank Sidebar Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'reservations', 'requests', 'notifications'

  const [bloodBank, setBloodBank] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  const bbId = user?.bloodBankId || user?.profile?._id || user?.profile?.id || 'bb_01';

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const res = await api.getAllInventories();
      if (res.success) {
        setLowStockAlerts(res.lowStockAlerts || []);
        setExpiryAlerts(res.expiryAlerts || []);

        const currentBB = (res.bloodbanks || []).find(b => b._id === bbId || b.id === bbId) || res.bloodbanks[0];
        if (currentBB) {
          setBloodBank(currentBB);
          setInventory(currentBB.inventory || []);
        }
      }

      // Fetch active hospital requisitions for Request Management module
      const reqRes = await api.getRequests();
      if (reqRes.success) {
        setRequisitions(reqRes.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [bbId]);

  const handleAction = async (bloodGroup, actionType, count) => {
    if (!bloodBank) return;
    try {
      const res = await api.updateInventoryAction(
        bloodBank._id || bloodBank.id,
        bloodGroup,
        actionType,
        count
      );
      if (res.success) {
        playSuccessChime();
        setActionSuccess(`Executed '${actionType.toUpperCase()}' for ${count} unit(s) of ${bloodGroup}`);
        setTimeout(() => setActionSuccess(''), 3000);
        setInventory(res.inventory);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fulfill Hospital Procurement Requisition
  const handleFulfillRequisition = async (reqId, bloodGroup, units = 1) => {
    if (!bloodBank) return;
    try {
      const res = await api.fulfillRequisition(reqId, bloodBank._id || bloodBank.id, units);
      if (res.success) {
        playSuccessChime();
        setActionSuccess(`Allocated ${units} Unit(s) of ${bloodGroup} to hospital requisition!`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchInventoryData();
      } else {
        alert(res.message || 'Failed to fulfill requisition');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalAvailable = inventory.reduce((acc, i) => acc + (i.availableUnits || 0), 0);
  const totalReserved = inventory.reduce((acc, i) => acc + (i.reservedUnits || 0), 0);
  const capacity = bloodBank?.storageCapacity || 2500;
  const utilizationPct = Math.round(((totalAvailable + totalReserved) / capacity) * 100);

  const activeRequisitions = requisitions.filter(r => r.status === 'Matching' || r.status === 'Escalating' || r.status === 'Pending');
  const scheduledCases = requisitions.filter(r => r.category === 'SCHEDULED' || r.scheduledDetails);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory (8 Groups)', icon: Layers },
    { id: 'reservations', label: 'Reservations', icon: Lock, badge: totalReserved },
    { id: 'requests', label: 'Request Management', icon: ClipboardList, badge: activeRequisitions.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: lowStockAlerts.length + expiryAlerts.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Rule 4: Blood Bank Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="hud-panel p-4 rounded-2xl border-slate-800 space-y-4 sticky top-24">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                <Droplet className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{bloodBank?.name || 'Central Blood Centre'}</div>
                <div className="text-[10px] font-mono text-purple-400">NABH & NACO Accredited</div>
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
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white text-purple-700' : 'bg-red-950 text-red-300 border border-red-800'
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

        {/* Dedicated Main Content */}
        <main className="flex-1 space-y-6">
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-pulse">
              <span>{actionSuccess}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          )}

          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Capacity Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-emerald-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Available Units</div>
                  <div className="text-3xl font-bold font-hud text-emerald-400 mt-1">{totalAvailable}</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Ready for Dispatch</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-amber-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Reserved Units</div>
                  <div className="text-3xl font-bold font-hud text-amber-400 mt-1">{totalReserved}</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Assigned to OTs</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-purple-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Utilization</div>
                  <div className="text-3xl font-bold font-hud text-purple-400 mt-1">{utilizationPct}%</div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{totalAvailable + totalReserved}/{capacity} Units</p>
                </div>

                <div className="hud-panel p-4 rounded-xl border-slate-800 border-l-4 border-l-red-500">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Critical Warnings</div>
                  <div className="text-3xl font-bold font-hud text-red-400 mt-1">{lowStockAlerts.length + expiryAlerts.length}</div>
                  <p className="text-[10px] text-red-300 mt-1 font-mono">Expiry & Low Stocks</p>
                </div>
              </div>

              {/* Warnings Preview */}
              {lowStockAlerts.length > 0 && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-1 text-xs">
                  <span className="font-bold text-red-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> LOW STOCK WARNINGS
                  </span>
                  {lowStockAlerts.slice(0, 3).map((a, i) => (
                    <div key={i} className="text-red-200">● {a.message}</div>
                  ))}
                </div>
              )}

              {/* Quick Incoming Hospital Requisitions Preview */}
              <div className="hud-panel p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <Hospital className="w-4 h-4 text-purple-400" />
                    <span>Active Hospital Requisitions Pending Allocation</span>
                  </h3>
                  <button onClick={() => setActiveTab('requests')} className="text-xs text-purple-400 hover:underline font-mono">
                    View All ({activeRequisitions.length})
                  </button>
                </div>

                {activeRequisitions.slice(0, 3).map(req => {
                  const invItem = inventory.find(i => i.bloodGroup === req.bloodGroup);
                  const isAvailableInStock = invItem && invItem.availableUnits > 0;

                  return (
                    <div key={req._id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            req.priorityLevel === 'Critical' ? 'bg-red-950 text-red-300 border-red-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {req.category || 'EMERGENCY'} • {req.priorityLevel}
                          </span>
                          <span className="text-xs font-bold text-white">{req.hospitalName}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Need: <strong className="text-red-400">{req.unitsRequired} Units {req.bloodGroup}</strong> • Secured: {req.unitsSecured || 0} • Status: {req.status}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          Stock: <strong className={isAvailableInStock ? 'text-emerald-400' : 'text-red-400'}>{invItem?.availableUnits || 0} Units</strong>
                        </span>
                        <button
                          onClick={() => handleFulfillRequisition(req._id, req.bloodGroup, 1)}
                          disabled={!isAvailableInStock || req.unitsSecured >= req.unitsRequired}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold font-hud uppercase tracking-wider transition"
                        >
                          {req.unitsSecured >= req.unitsRequired ? '✓ Fulfilled' : 'Allocate 1 Unit'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODULE 2: INVENTORY (8 GROUPS) */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                  Real-Time Cold-Storage Blood Inventory (8 Groups)
                </h3>
                <span className="text-xs font-mono text-slate-400">Temperature: +4.0°C (Calibrated)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => {
                  const item = inventory.find(i => i.bloodGroup === group) || { availableUnits: 0, reservedUnits: 0, minThreshold: 10 };
                  const isLow = item.availableUnits <= item.minThreshold;

                  return (
                    <div key={group} className={`hud-panel p-4 rounded-xl border ${isLow ? 'border-red-500/60 bg-red-950/20' : 'border-slate-800'} space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold font-hud text-red-400">{group}</span>
                        {isLow && (
                          <span className="text-[10px] font-mono font-bold bg-red-900 text-red-200 px-1.5 py-0.5 rounded">
                            LOW STOCK
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div>
                          <span className="text-slate-500 text-[10px] block">AVAILABLE</span>
                          <span className="text-2xl font-bold text-white">{item.availableUnits}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">RESERVED</span>
                          <span className="text-2xl font-bold text-amber-400">{item.reservedUnits}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-4 gap-1 text-[11px] font-mono">
                        <button
                          onClick={() => handleAction(group, 'add', 1)}
                          className="p-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900 font-bold text-center"
                          title="Add Unit"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => handleAction(group, 'remove', 1)}
                          disabled={item.availableUnits <= 0}
                          className="p-1.5 rounded bg-slate-900 text-slate-300 border border-slate-700 disabled:opacity-40 text-center"
                          title="Remove Unit"
                        >
                          - Use
                        </button>
                        <button
                          onClick={() => handleAction(group, 'hold', 1)}
                          disabled={item.availableUnits <= 0}
                          className="p-1.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50 font-bold disabled:opacity-40 text-center"
                          title="Reserve Unit"
                        >
                          Hold
                        </button>
                        <button
                          onClick={() => handleAction(group, 'release', 1)}
                          disabled={item.reservedUnits <= 0}
                          className="p-1.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 font-bold disabled:opacity-40 text-center"
                          title="Release Hold"
                        >
                          Free
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODULE 3: RESERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="hud-panel p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Active Hospital Surgical Reservations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Currently held units reserved for scheduled cardiovascular, polytrauma, and orthopedic surgeries.
                </p>
              </div>

              {/* Reserved Groups Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inventory.filter(i => i.reservedUnits > 0).map(i => (
                  <div key={i.bloodGroup} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-red-400">{i.bloodGroup}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold">
                        {i.reservedUnits} Reserved
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">Locked for Emergency OT Hold</div>
                  </div>
                ))}
              </div>

              {/* Scheduled Cases with Reservations */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold font-hud uppercase tracking-wider text-slate-300">
                  Scheduled Procedures Requiring Component Holds
                </h4>

                {scheduledCases.length === 0 ? (
                  <p className="text-xs text-slate-500">No scheduled cases currently tagged for advance reservation.</p>
                ) : (
                  scheduledCases.map(sched => (
                    <div key={sched._id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                            SCHEDULED
                          </span>
                          <span className="font-bold text-white">{sched.scheduledDetails?.procedureType || sched.condition}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1">
                          Hospital: {sched.hospitalName} • Date: {sched.scheduledDetails?.procedureDate || sched.requiredTime}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-red-400 font-bold">{sched.unitsRequired} Units {sched.bloodGroup}</span>
                        <button
                          onClick={() => handleAction(sched.bloodGroup, 'hold', 1)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
                        >
                          + Hold Unit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MODULE 4: REQUEST MANAGEMENT (Hospital Procurement Requisitions) */}
          {activeTab === 'requests' && (
            <div className="hud-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-purple-400" />
                    <span>Hospital Procurement Requisitions ({activeRequisitions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Direct requisitions received from accredited emergency trauma desks and scheduled surgery theaters.
                  </p>
                </div>
                <button
                  onClick={fetchInventoryData}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {activeRequisitions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">
                  No active hospital requisitions awaiting component fulfillment.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequisitions.map(req => {
                    const invItem = inventory.find(i => i.bloodGroup === req.bloodGroup);
                    const isAvailableInStock = invItem && invItem.availableUnits > 0;
                    const isFulfilled = req.unitsSecured >= req.unitsRequired;

                    return (
                      <div key={req._id} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 transition space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${
                                req.priorityLevel === 'Critical' 
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {req.category || 'EMERGENCY'} • {req.priorityLevel}
                              </span>
                              <span className="text-xs font-mono text-purple-400">Requisition #{req._id}</span>
                            </div>

                            <h4 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
                              <Hospital className="w-4 h-4 text-slate-400" />
                              <span>{req.hospitalName}</span>
                            </h4>
                            <p className="text-xs text-slate-400">
                              Patient / Condition: <strong className="text-slate-300">{req.patientName} ({req.condition})</strong>
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" /> Required Timeframe: {req.requiredTime}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold font-hud text-red-400">
                              {req.unitsRequired} Units {req.bloodGroup}
                            </div>
                            <div className="text-xs font-mono text-slate-300 mt-0.5">
                              Secured: <strong className="text-emerald-400">{req.unitsSecured || 0}</strong> / {req.unitsRequired} Units
                            </div>
                          </div>
                        </div>

                        {/* Requisition Notes */}
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 italic">
                          "{req.caseNotes}"
                        </div>

                        {/* Stock Check & Allocation Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">Blood Bank Inventory:</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${isAvailableInStock ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                              {invItem?.availableUnits || 0} Units {req.bloodGroup} Available
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isFulfilled ? (
                              <span className="px-4 py-2 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-xl font-bold font-hud uppercase tracking-wider text-xs flex items-center gap-1.5">
                                <Check className="w-4 h-4" />
                                <span>Fulfilled Requisition</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleFulfillRequisition(req._id, req.bloodGroup, 1)}
                                disabled={!isAvailableInStock}
                                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold font-hud uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/60 transition"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Allocate 1 Unit ({req.bloodGroup})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODULE 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="hud-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                Inventory Alerts & Cold-Chain Notifications
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {expiryAlerts.map((e, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{e.message}</span>
                  </div>
                ))}
                {lowStockAlerts.map((a, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{a.message}</span>
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
