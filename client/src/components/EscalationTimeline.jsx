import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  Database, 
  Building2, 
  AlertOctagon, 
  Globe2, 
  CheckCircle2, 
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { playEmergencySiren } from '../utils/soundEffects';

const STAGES = [
  {
    name: 'Nearby Donors',
    radius: '0 - 5 km',
    desc: 'Instant push siren to active donors in local perimeter',
    icon: Users,
    color: 'emerald'
  },
  {
    name: 'Expanded Radius Search',
    radius: '25 km',
    desc: 'Regional scan alerting mobile units & registered donors',
    icon: Radio,
    color: 'amber'
  },
  {
    name: 'Blood Banks',
    radius: '50 km',
    desc: 'Automated requisition to certified cold-storage blood banks',
    icon: Database,
    color: 'indigo'
  },
  {
    name: 'Nearby Hospitals',
    radius: '75 km',
    desc: 'Peer-to-peer hospital emergency trauma reserves requisition',
    icon: Building2,
    color: 'blue'
  },
  {
    name: 'District Alert',
    radius: '150 km',
    desc: 'District Health Command & Red Cross emergency mobilization',
    icon: AlertOctagon,
    color: 'orange'
  },
  {
    name: 'State Alert',
    radius: '300 km',
    desc: 'State Disaster Medical Response & drone / air transport standby',
    icon: Globe2,
    color: 'red'
  },
  {
    name: 'Blood Secured',
    radius: 'Verified',
    desc: 'Life-saving blood units dispatched & transfusion standby',
    icon: CheckCircle2,
    color: 'green'
  }
];

export default function EscalationTimeline({
  currentStage = 'Nearby Donors',
  onEscalate,
  isHospital = false,
  requestId,
  loading = false
}) {
  const currentIndex = STAGES.findIndex(s => s.name === currentStage);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;

  const handleEscalateClick = () => {
    playEmergencySiren();
    if (onEscalate) onEscalate();
  };

  return (
    <div className="hud-panel p-6 rounded-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-red-950/70 border border-red-500/30 text-red-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </span>
            <h3 className="text-base font-bold font-hud uppercase tracking-wider text-white">
              Emergency Escalation Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated hierarchical procurement protocol expanding geographic perimeter until blood is secured.
          </p>
        </div>

        {/* Action Button for Hospital / Command desk */}
        {isHospital && activeIdx < STAGES.length - 1 && (
          <button
            onClick={handleEscalateClick}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/40 border border-red-400/50 flex items-center space-x-1.5 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span>Escalate Next Stage</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal / Responsive Multi-step Timeline */}
      <div className="relative">
        {/* Connecting track line */}
        <div className="hidden lg:block absolute top-6 left-6 right-6 h-1 bg-slate-800 -z-0">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all duration-700"
            style={{ width: `${(activeIdx / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 relative z-10">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const isPending = idx > activeIdx;

            return (
              <div
                key={stage.name}
                className={`p-3.5 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-950/60 ring-2 ring-red-500/30'
                    : isCompleted
                    ? 'bg-slate-900/70 border-emerald-500/40 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60 text-slate-500'
                }`}
              >
                {/* Stage Icon & Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isCurrent
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-600/90 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isCurrent
                        ? 'bg-red-900/80 text-red-300 border border-red-700/60 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isCurrent ? 'ACTIVE' : isCompleted ? 'PASSED' : `STAGE ${idx + 1}`}
                  </span>
                </div>

                {/* Stage Name */}
                <h4
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                  }`}
                >
                  {stage.name}
                </h4>

                {/* Radius */}
                <div className="text-[11px] font-mono text-amber-400 mt-1 font-semibold">
                  {stage.radius}
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
