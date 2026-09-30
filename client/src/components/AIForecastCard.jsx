import React from 'react';
import { 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Award,
  Sparkles
} from 'lucide-react';

export default function AIForecastCard({ donor, onVerifyActive }) {
  const forecast = donor?.aiForecast || {};
  const digitalTwin = donor?.digitalTwin || {};

  const probability = forecast.probability90Day ?? 94;
  const expectedResponseRate = forecast.expectedResponseRate ?? 96;
  const reliability = forecast.reliabilityPrediction || 'High (Verified Reliable)';
  const trend = forecast.readinessTrend || 'Upward';
  const activityLabel = forecast.activityLabel || '🟢 Highly Active';
  const activityClass = forecast.activityClass || 'highly_active';

  const donationFrequency = forecast.donationFrequency || '3.2 times/yr';
  const responseRate = forecast.responseRate ?? 95;
  const acceptanceRate = forecast.acceptanceRate ?? 90;
  const readinessScore = forecast.readinessScore ?? 96;
  const trustScore = forecast.trustScore ?? (donor?.trustScore || 95);
  const daysSinceActive = forecast.daysSinceActive ?? 2;

  const isRisk = activityClass === 'risk_of_inactive';
  const isModerate = activityClass === 'moderately_active';

  return (
    <div className="hud-panel p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden transition-all duration-300">
      {/* Background glow */}
      <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isRisk ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      {/* Header with Title and Activity Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-900/40">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-hud uppercase tracking-wider text-white">
                AI Donor Activity Forecast & Digital Twin
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>90-Day Predictive Model</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuously trained on historical frequency, response rate, acceptance & verification recency.
            </p>
          </div>
        </div>

        {/* Small Top Indicator */}
        <div className={`px-3 py-1 rounded-full text-xs font-hud font-bold border flex items-center gap-1.5 shadow-sm ${
          isRisk
            ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
            : isModerate
            ? 'bg-amber-950/80 text-amber-300 border-amber-700'
            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
        }`}>
          <span>{activityLabel}</span>
        </div>
      </div>

      {/* The 4 Core Forecast Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Next 90-Day Activity Probability */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Next 90-Day Probability
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-hud text-sky-400">
              {probability}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">Likelihood</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isRisk ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-sky-400'
              }`}
              style={{ width: `${probability}%` }}
            />
          </div>
        </div>

        {/* 2. Expected Response Rate */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Expected Response Rate
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-hud text-emerald-400">
              {expectedResponseRate}%
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Predicted</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${expectedResponseRate}%` }}
            />
          </div>
        </div>

        {/* 3. Reliability Prediction */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Reliability Prediction
          </div>
          <div className="text-sm font-bold font-hud text-white mt-1.5 truncate">
            {reliability}
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Digital Twin Calibrated</span>
          </div>
        </div>

        {/* 4. Readiness Trend */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Readiness Trend
          </div>
          <div className="flex items-center space-x-1.5 mt-1.5">
            {trend === 'Upward' ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : trend === 'Declining' ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-sm font-bold font-hud text-white">{trend}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Readiness Score: <strong className="text-red-400">{readinessScore}/100</strong>
          </div>
        </div>
      </div>

      {/* Historical Data Factors Breakdown */}
      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-300 font-mono text-[11px]">
          <div>
            <span className="text-slate-400">Donation Frequency:</span>{' '}
            <strong className="text-white">{donationFrequency}</strong>
          </div>
          <div>
            <span className="text-slate-400">Response Rate:</span>{' '}
            <strong className="text-emerald-400">{responseRate}%</strong>
          </div>
          <div>
            <span className="text-slate-400">Acceptance Rate:</span>{' '}
            <strong className="text-sky-400">{acceptanceRate}%</strong>
          </div>
          <div>
            <span className="text-slate-400">Active Recency:</span>{' '}
            <strong className="text-white">{daysSinceActive}d ago</strong>
          </div>
          <div>
            <span className="text-slate-400">Trust Score:</span>{' '}
            <strong className="text-amber-400">{trustScore}%</strong>
          </div>
        </div>

        {onVerifyActive && (
          <button
            onClick={onVerifyActive}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1 border border-slate-700"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recalculate AI Twin</span>
          </button>
        )}
      </div>
    </div>
  );
}
