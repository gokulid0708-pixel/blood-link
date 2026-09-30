import React from 'react';
import { X, Award, ShieldCheck, Printer, CheckCircle } from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, certificate, donorName, bloodGroup }) {
  if (!isOpen) return null;

  const cert = certificate || {
    certificateNumber: 'BL-CERT-2026-9921',
    donorName: donorName || 'Karthik Subramanian',
    bloodGroup: bloodGroup || 'O+',
    hospitalName: 'PSG Institute of Medical Sciences & Research',
    issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    verificationHash: 'v_hash_e7b1a2c3d4e5f67890abcdef'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0B101D] border border-amber-500/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden shadow-amber-950/40 flex flex-col">
        {/* Top Control Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
            <Award className="w-4 h-4" />
            <span>Official Life Saver Certificate of Commendation</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Stylized Healthcare Recognition) */}
        <div className="p-8 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] border-4 border-double border-amber-600/30 m-4 rounded-xl text-center relative overflow-hidden">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-amber-400" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Header Badge */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 shadow-lg shadow-amber-500/20 text-slate-950 font-bold mb-2">
              <Award className="w-8 h-8 text-slate-950" />
            </div>

            <div className="uppercase tracking-widest text-[11px] font-mono text-amber-400 font-bold">
              National Blood Transfusion Network • BloodLink AI
            </div>

            <h1 className="text-2xl font-bold font-hud text-white tracking-wide">
              CERTIFICATE OF COMMENDATION
            </h1>

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This prestigious recognition is proudly conferred upon
            </p>

            <div className="py-2">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 font-hud tracking-wider">
                {cert.donorName}
              </div>
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono font-bold">
                Blood Group: {cert.bloodGroup}
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              for exemplary altruism and rapid emergency response, donating life-saving blood units at <strong className="text-white">{cert.hospitalName}</strong>, directly contributing to saving a human life during critical trauma resuscitation.
            </p>

            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-left text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block">Certificate No:</span>
                <span className="text-slate-300 font-bold">{cert.certificateNumber}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-500 block">Date of Issue:</span>
                <span className="text-slate-300 font-bold">{cert.issueDate}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Verified
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 truncate pt-2">
              Sha256 Hash: {cert.verificationHash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
