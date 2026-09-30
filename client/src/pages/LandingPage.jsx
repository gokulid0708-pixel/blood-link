import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  MapPin, 
  Users, 
  Hospital as HospitalIcon, 
  Droplet, 
  ArrowRight, 
  Cpu, 
  Sparkles, 
  Flame, 
  Radio, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Clock
} from 'lucide-react';
import LiveMap from '../components/LiveMap';
import EscalationTimeline from '../components/EscalationTimeline';
import NewRequestModal from '../components/NewRequestModal';
import { api } from '../services/api';
import { playEmergencySiren } from '../utils/soundEffects';

export default function LandingPage({ onOpenCalc }) {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [bloodbanks, setBloodbanks] = useState([]);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalDonors: 148,
    totalHospitals: 14,
    totalBloodBanks: 8,
    totalLivesSaved: 384
  });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    // Load data from backend
    api.getAllDonors().then(res => res.success && setDonors(res.donors)).catch(console.error);
    api.getAllInventories().then(res => res.success && setBloodbanks(res.bloodbanks)).catch(console.error);
    api.getRequests().then(res => {
      if (res.success) {
        setRequests(res.requests);
      }
    }).catch(console.error);

    // Mock initial hospital locations around Coimbatore medical hub
    setHospitals([
      {
        _id: 'hosp_01',
        name: 'PSG Institute of Medical Sciences & Research',
        address: 'Peelamedu, Coimbatore',
        emergencyContact: '+91 422 257 0170',
        location: { lat: 11.0264, lng: 77.0028 }
      },
      {
        _id: 'hosp_02',
        name: 'KMCH (Kovai Medical Center & Hospital)',
        address: 'Avinashi Rd, Coimbatore',
        emergencyContact: '+91 422 432 3800',
        location: { lat: 11.0422, lng: 77.0392 }
      },
      {
        _id: 'hosp_03',
        name: 'Coimbatore Medical College Hospital (CMCH)',
        address: 'Trichy Rd, Coimbatore',
        emergencyContact: '+91 422 230 1393',
        location: { lat: 10.9998, lng: 76.9698 }
      },
      {
        _id: 'hosp_04',
        name: 'Ganga Medical Centre & Hospitals',
        address: 'Mettupalayam Rd, Coimbatore',
        emergencyContact: '+91 422 248 5000',
        location: { lat: 11.0210, lng: 76.9535 }
      }
    ]);

    api.getAdminOverview().then(res => {
      if (res.success && res.stats) {
        setStats({
          totalDonors: res.stats.totalDonors,
          totalHospitals: res.stats.totalHospitals,
          totalBloodBanks: res.stats.totalBloodBanks,
          totalLivesSaved: res.stats.totalLivesSaved
        });
      }
    }).catch(console.error);
  }, []);

  const handleEmergencyBtn = () => {
    playEmergencySiren();
    setIsRequestModalOpen(true);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Radar Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Tactical Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>REAL-TIME EMERGENCY BLOOD DISPATCH COMMAND</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold font-hud tracking-tight text-white leading-tight">
            Every Second Matters.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
              Find Blood. Save Lives.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-light">
            Connecting Blood Donors, Trauma Centers, and Central Blood Banks in real-time. Powered by AI multi-factor donor matching, live telemetry tracking, and automated perimeter escalation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleEmergencyBtn}
              className="px-8 py-3.5 rounded-xl font-bold font-hud uppercase tracking-wider text-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-900/50 border border-red-400/40 transition-all transform active:scale-95 flex items-center space-x-2 group"
            >
              <Flame className="w-5 h-5 text-amber-300 group-hover:scale-110 transition" />
              <span>Emergency Request</span>
            </button>

            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-bold font-hud uppercase tracking-wider text-sm bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-slate-500 transition-all flex items-center space-x-2"
            >
              <Heart className="w-5 h-5 text-red-400" />
              <span>Register as Donor</span>
            </Link>

            <button
              onClick={onOpenCalc}
              className="px-6 py-3.5 rounded-xl font-medium text-xs font-mono bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-600/40 transition-all flex items-center space-x-2"
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>AI Matching Simulator</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATISTICS HUD (Animated Counters) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Donors */}
          <div className="hud-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider">Total Donors</span>
              <Users className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
            </div>
            <div className="text-3xl font-extrabold font-hud text-white tracking-wide">
              {stats.totalDonors}+
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Verified Active Network
            </p>
          </div>

          {/* Hospitals */}
          <div className="hud-panel p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider">Hospitals Connected</span>
              <HospitalIcon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
            </div>
            <div className="text-3xl font-extrabold font-hud text-white tracking-wide">
              {stats.totalHospitals}
            </div>
            <p className="text-[11px] text-blue-400 mt-1 font-mono">
              Level 1 & Trauma Centers
            </p>
          </div>

          {/* Blood Banks */}
          <div className="hud-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider">Blood Banks Connected</span>
              <Droplet className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
            </div>
            <div className="text-3xl font-extrabold font-hud text-white tracking-wide">
              {stats.totalBloodBanks}
            </div>
            <p className="text-[11px] text-purple-400 mt-1 font-mono">
              Cold Chain Certified Labs
            </p>
          </div>

          {/* Lives Saved */}
          <div className="hud-panel p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition bg-red-950/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-red-300">Lives Saved</span>
              <Heart className="w-5 h-5 text-red-400 fill-red-400 group-hover:scale-120 transition" />
            </div>
            <div className="text-3xl font-extrabold font-hud text-red-400 tracking-wide">
              {stats.totalLivesSaved}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Emergency Transfusions
            </p>
          </div>
        </div>
      </section>

      {/* 3. LIVE MAP COMMAND CENTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-red-600/30 text-red-400">
                <Radio className="w-4 h-4 animate-spin" />
              </span>
              <h2 className="text-xl font-bold font-hud uppercase tracking-wider text-white">
                Live Geographic Emergency Radar
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Interactive telemetry monitoring active trauma cases, nearby accredited hospitals, certified cold banks, and ready donors.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Geofence Tracking
            </span>
          </div>
        </div>

        {/* The Live Interactive Map */}
        <LiveMap
          hospitals={hospitals}
          bloodbanks={bloodbanks}
          donors={donors}
          requests={requests}
          height="540px"
        />
      </section>

      {/* 4. HOW IT WORKS 4-STEP WORKFLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <div className="uppercase tracking-widest text-xs font-mono font-bold text-red-400">
            Intelligent Life-Saving Pipeline
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-hud text-white">
            How BloodLink AI Operates
          </h2>
          <p className="text-xs text-slate-400">
            Automating procurement from emergency room trauma triage to verified bedside transfusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="hud-panel p-5 rounded-2xl border-slate-800 relative group hover:border-red-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-base font-mono mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Hospital Creates Request
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trauma OT logs critical blood group, required units, and priority level with instant GIS beaconing.
            </p>
          </div>

          {/* Step 2 */}
          <div className="hud-panel p-5 rounded-2xl border-slate-800 relative group hover:border-sky-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-base font-mono mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              AI Finds Donors
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent Matching Engine computes 40% compatibility + 25% distance + 20% availability + 15% trust score.
            </p>
          </div>

          {/* Step 3 */}
          <div className="hud-panel p-5 rounded-2xl border-slate-800 relative group hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-base font-mono mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Donor Accepts
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Immediate sirens & push alert reach nearest compatible donors. Donors accept with 1 tap and get GPS directions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="hud-panel p-5 rounded-2xl border-slate-800 relative group hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-base font-mono mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Blood Delivered
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Blood is transfused, life is saved, and donor receives cryptographically verified Life Saver commendation badges.
            </p>
          </div>
        </div>
      </section>

      {/* 5. EMERGENCY ESCALATION ENGINE SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EscalationTimeline currentStage="Blood Banks" isHospital={false} />
      </section>

      {/* Emergency Request Modal */}
      <NewRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        hospital={hospitals[0]}
        onCreated={(req) => {
          setRequests([req, ...requests]);
          navigate('/hospital');
        }}
      />
    </div>
  );
}
