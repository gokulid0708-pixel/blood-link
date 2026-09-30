import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, AlertCircle, Send, Sparkles, Navigation } from 'lucide-react';
import { api } from '../services/api';
import { playRadarPing, playSuccessChime } from '../utils/soundEffects';

export default function MatchingCalculatorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Simulator controls
  const [recipientBlood, setRecipientBlood] = useState('O+');
  const [donorBlood, setDonorBlood] = useState('O+');
  const [distanceKm, setDistanceKm] = useState(1.5);
  const [availability, setAvailability] = useState('Available Now');
  const [trustScore, setTrustScore] = useState(98);

  // Live DB match state
  const [liveDonors, setLiveDonors] = useState([]);
  const [alertDispatched, setAlertDispatched] = useState(false);

  // Compatibility logic
  const COMPATIBILITY_MAP = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
  };

  const calculateCompatibility = (rec, don) => {
    if (rec === don) return 100;
    const list = COMPATIBILITY_MAP[rec] || [];
    if (list.includes(don)) {
      return don === 'O-' ? 95 : 85;
    }
    return 0;
  };

  const calculateDistanceScore = (dist) => {
    if (dist <= 2) return 100;
    if (dist <= 5) return 90;
    if (dist <= 10) return 75;
    if (dist <= 20) return 55;
    if (dist <= 35) return 35;
    return Math.max(0, Math.round(100 - dist * 2.2));
  };

  const calculateAvailScore = (status) => {
    switch (status) {
      case 'Available Now': return 100;
      case 'Available Today': return 80;
      case 'Busy': return 40;
      default: return 0;
    }
  };

  const compatScore = calculateCompatibility(recipientBlood, donorBlood);
  const distScore = calculateDistanceScore(distanceKm);
  const availScore = calculateAvailScore(availability);

  // Match Score = 40% Compatibility + 25% Distance + 20% Availability + 15% Trust Score
  const weightedCompat = (0.40 * compatScore).toFixed(1);
  const weightedDist = (0.25 * distScore).toFixed(1);
  const weightedAvail = (0.20 * availScore).toFixed(1);
  const weightedTrust = (0.15 * trustScore).toFixed(1);

  const totalScore = compatScore === 0 ? 0 : Math.min(100, Math.round(
    parseFloat(weightedCompat) +
    parseFloat(weightedDist) +
    parseFloat(weightedAvail) +
    parseFloat(weightedTrust)
  ));

  // Fetch real ranked matches from API
  useEffect(() => {
    api.calculateMatches({ bloodGroup: recipientBlood, lat: 11.0264, lng: 77.0028 })
      .then(res => {
        if (res.success) {
          setLiveDonors(res.donors || []);
        }
      })
      .catch(console.error);
  }, [recipientBlood]);

  const handleDispatch = (donorName) => {
    playRadarPing();
    playSuccessChime();
    setAlertDispatched(donorName);
    setTimeout(() => setAlertDispatched(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0B101D] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-hud uppercase tracking-wide text-white">
                Intelligent Donor Matching Engine
              </h2>
              <p className="text-xs text-slate-400">
                Formula: Match Score = 40% Compatibility + 25% Distance + 20% Availability + 15% Trust Score
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Interactive Simulation Sandbox */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
            {/* Left Controls */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                🧪 Live Parameter Sandbox
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Patient Blood Needed</label>
                  <select
                    value={recipientBlood}
                    onChange={(e) => setRecipientBlood(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Donor Blood Group</label>
                  <select
                    value={donorBlood}
                    onChange={(e) => setDonorBlood(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Distance: {distanceKm} km</span>
                  <span className="text-amber-400">Score: {distScore}/100</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="35"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Donor Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Available Now">🟢 Available Now (100)</option>
                    <option value="Available Today">🟡 Available Today (80)</option>
                    <option value="Busy">🟠 Busy (40)</option>
                    <option value="Unavailable">🔴 Unavailable (0)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Trust Score: {trustScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={trustScore}
                    onChange={(e) => setTrustScore(parseInt(e.target.value))}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Right: Real-time Calculated Breakdown Gauge */}
            <div className="flex flex-col justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase font-mono">Calculated Match Score</span>
                <span className={`text-2xl font-bold font-hud ${
                  totalScore >= 80 ? 'text-emerald-400' : totalScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {totalScore}%
                </span>
              </div>

              {/* Progress Gauge */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden my-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    totalScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    totalScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${totalScore}%` }}
                />
              </div>

              {/* 4 Weights Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400">40% Compatibility:</span>
                  <div className="font-bold text-sky-400">{weightedCompat} / 40.0 pts</div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400">25% Distance:</span>
                  <div className="font-bold text-amber-400">{weightedDist} / 25.0 pts</div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400">20% Availability:</span>
                  <div className="font-bold text-emerald-400">{weightedAvail} / 20.0 pts</div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400">15% Trust Score:</span>
                  <div className="font-bold text-purple-400">{weightedTrust} / 15.0 pts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Ranked Donors from Database */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white flex items-center gap-2">
                <span>Ranked Compatible Donors for {recipientBlood}</span>
                <span className="text-xs font-mono bg-red-950 text-red-400 px-2 py-0.5 rounded-full border border-red-800">
                  {liveDonors.length} Verified Available
                </span>
              </h3>
            </div>

            {alertDispatched && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-pulse">
                <span>🚨 Priority sirens & push alerts dispatched to <strong>{alertDispatched}</strong>!</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Rank & Donor Name</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Trust Score</th>
                    <th className="p-3">Match Score</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                  {liveDonors.map((d, idx) => (
                    <tr key={d.donorId || idx} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div>
                          <div>{d.donorName}</div>
                          <div className="text-[10px] text-slate-400 font-normal font-mono">{d.phone || '+91 98421 XXXXX'}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 font-bold font-mono">
                          {d.bloodGroup}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-mono">
                        {d.distanceKm} km away
                      </td>
                      <td className="p-3 text-sky-400 font-mono font-semibold">
                        {d.trustScore}%
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold font-hud text-sm ${
                            d.matchPercentage >= 85 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {d.matchPercentage}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full ${d.matchPercentage >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${d.matchPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDispatch(d.donorName)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold font-hud uppercase tracking-wider text-[11px] shadow-md shadow-red-900/40 border border-red-400/40 transition flex items-center gap-1 ml-auto"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Alert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
