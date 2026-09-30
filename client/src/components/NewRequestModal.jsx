import React, { useState } from 'react';
import { X, Flame, AlertCircle, Send, Check, Users, Calendar, Clock, MapPin, Building2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { playEmergencySiren, playSuccessChime } from '../utils/soundEffects';

export default function NewRequestModal({ isOpen, onClose, hospital, onCreated }) {
  if (!isOpen) return null;

  // Three Categories
  const [category, setCategory] = useState('EMERGENCY'); // 'EMERGENCY', 'VOLUNTEER_DRIVE', 'SCHEDULED'

  // Common fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [caseNotes, setCaseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Category 1 fields
  const [priorityLevel, setPriorityLevel] = useState('Critical');
  const [requiredTime, setRequiredTime] = useState('Immediate (< 20 mins)');
  const [patientName, setPatientName] = useState('');
  const [condition, setCondition] = useState('Polytrauma / Severe Hemorrhage');

  // Category 2 fields (Volunteer Blood Donation Drive)
  const [eventName, setEventName] = useState('PSG Community & College Mega Blood Drive');
  const [eventDate, setEventDate] = useState('Upcoming Saturday, 9:00 AM - 4:00 PM');
  const [driveLocation, setDriveLocation] = useState('PSG Tech Auditorium, Peelamedu, Coimbatore');
  const [organizerName, setOrganizerName] = useState('Dr. R. Nandagopal');
  const [organizerContact, setOrganizerContact] = useState('+91 422 257 0170');
  const [organization, setOrganization] = useState('PSG Youth Red Cross & NSS');

  // Category 3 fields (Scheduled Blood Request)
  const [procedureType, setProcedureType] = useState('Living-Donor Hepatic Transplant');
  const [procedureDate, setProcedureDate] = useState('Required after 4 days');
  const [reservationEnabled, setReservationEnabled] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (category === 'EMERGENCY') {
        playEmergencySiren();
      } else {
        playSuccessChime();
      }

      const payload = {
        category,
        hospitalId: hospital?._id || hospital?.id || 'hosp_01',
        hospitalName: hospital?.name || 'PSG Institute of Medical Sciences & Research',
        hospitalAddress: hospital?.address || 'Avinashi Road, Peelamedu, Coimbatore',
        location: hospital?.location || { lat: 11.0264, lng: 77.0028 },
        bloodGroup,
        unitsRequired: Number(unitsRequired),
        caseNotes: caseNotes || (category === 'VOLUNTEER_DRIVE' ? 'Community drive for youth & voluntary donors.' : 'Clinical transfusion requisition.'),
      };

      if (category === 'EMERGENCY') {
        payload.priorityLevel = priorityLevel;
        payload.requiredTime = requiredTime;
        payload.patientName = patientName || 'Trauma Emergency Patient';
        payload.condition = condition;
      } else if (category === 'VOLUNTEER_DRIVE') {
        payload.priorityLevel = 'Normal';
        payload.requiredTime = eventDate;
        payload.patientName = eventName;
        payload.condition = 'Volunteer Blood Donation Camp';
        payload.driveDetails = {
          eventName,
          eventDate,
          locationName: driveLocation,
          organizerDetails: {
            name: organizerName,
            contact: organizerContact,
            organization
          }
        };
      } else if (category === 'SCHEDULED') {
        payload.priorityLevel = 'Urgent';
        payload.requiredTime = procedureDate;
        payload.patientName = patientName || 'Elective Surgery Patient';
        payload.condition = procedureType;
        payload.scheduledDetails = {
          procedureType,
          procedureDate,
          advanceReservationEnabled: reservationEnabled,
          reservedBloodBankName: 'PSG Central Blood Bank'
        };
      }

      const res = await api.createRequest(payload);
      if (res.success) {
        if (onCreated) onCreated(res.request);
        onClose();
      } else {
        setError(res.message || 'Failed to dispatch request');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0B101D] border border-red-500/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden shadow-red-950/60 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-900/40 flex items-center justify-between bg-red-950/40 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-red-600 text-white">
              <Flame className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold font-hud uppercase tracking-wider text-white">
                Create Clinical Blood Requisition
              </h2>
              <p className="text-xs text-red-300">
                Choose Request Category & Dispatch AI Notification Grid
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-900/60 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Three Categories Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-hud">
              Select Blood Request Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'EMERGENCY',
                  title: 'Category 1: Emergency',
                  desc: 'Accidents, Trauma, ICU, Critical Surgeries',
                  icon: Flame,
                  activeColor: 'border-red-500 bg-red-950/60 text-white'
                },
                {
                  id: 'VOLUNTEER_DRIVE',
                  title: 'Category 2: Volunteer Drive',
                  desc: 'Blood Camps, College Drives, NGO Programs',
                  icon: Users,
                  activeColor: 'border-emerald-500 bg-emerald-950/60 text-white'
                },
                {
                  id: 'SCHEDULED',
                  title: 'Category 3: Scheduled Request',
                  desc: 'Planned Surgeries, Transplants (e.g. in 4 days)',
                  icon: Calendar,
                  activeColor: 'border-amber-500 bg-amber-950/60 text-white'
                }
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'VOLUNTEER_DRIVE') setUnitsRequired(50);
                      else setUnitsRequired(2);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `${cat.activeColor} ring-1 ring-white/20 shadow-lg`
                        : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold font-hud">{cat.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blood Group and Units */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:border-red-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Units Required *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* Category 1 Specific Fields */}
          {category === 'EMERGENCY' && (
            <div className="space-y-4 p-4 rounded-xl bg-red-950/20 border border-red-500/30">
              <div className="text-xs font-bold font-hud uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Emergency Specifics (Instant Sound Alert & Immediate Escalation)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-semibold"
                  >
                    <option value="Critical">🔴 Critical (Immediate Life Threat)</option>
                    <option value="Urgent">🟡 Urgent (Needed within 1 hour)</option>
                    <option value="Normal">🟢 Normal (Elective Surgery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Required Timeframe *
                  </label>
                  <input
                    type="text"
                    value={requiredTime}
                    onChange={(e) => setRequiredTime(e.target.value)}
                    placeholder="Immediate (< 20 mins)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Patient Name / Code
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Vignesh M. (Age 34)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Clinical Condition
                  </label>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="e.g. Polytrauma Accident OT"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category 2 Specific Fields: Volunteer Blood Donation Drive */}
          {category === 'VOLUNTEER_DRIVE' && (
            <div className="space-y-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="text-xs font-bold font-hud uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Volunteer Blood Donation Drive Details (Rule 15 Category 2)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="PSG Tech Mega Blood Donation Drive"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Date & Time *
                  </label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="Upcoming Saturday, 9:00 AM - 4:00 PM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={driveLocation}
                    onChange={(e) => setDriveLocation(e.target.value)}
                    placeholder="Auditorium, PSG Campus, Coimbatore"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="Dr. R. Nandagopal"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Organizer Contact *
                  </label>
                  <input
                    type="text"
                    value={organizerContact}
                    onChange={(e) => setOrganizerContact(e.target.value)}
                    placeholder="+91 422 257 0170"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Organization *
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Youth Red Cross / NSS"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category 3 Specific Fields: Scheduled Blood Request */}
          {category === 'SCHEDULED' && (
            <div className="space-y-4 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <div className="text-xs font-bold font-hud uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Scheduled Blood Request Details (Planned Surgeries & Transplants)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Procedure Type *
                  </label>
                  <input
                    type="text"
                    value={procedureType}
                    onChange={(e) => setProcedureType(e.target.value)}
                    placeholder="e.g. Living-Donor Hepatic Transplant"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Date / Timeframe *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={procedureDate}
                      onChange={(e) => setProcedureDate(e.target.value)}
                      placeholder="e.g. Required after 4 days (October 3rd)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Enable Advance Blood Reservation Support</div>
                    <div className="text-[10px] text-slate-400">Holds blood units at regional blood banks & dispatches 24hr reminders</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reservationEnabled}
                  onChange={(e) => setReservationEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </div>
            </div>
          )}

          {/* Case Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Clinical Case Notes / Description
            </label>
            <textarea
              value={caseNotes}
              onChange={(e) => setCaseNotes(e.target.value)}
              rows="2"
              placeholder="Case details, urgency, and relevant instructions..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold font-hud uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-red-900/50 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Transmitting Requisition...' : 'Broadcast Requisition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
