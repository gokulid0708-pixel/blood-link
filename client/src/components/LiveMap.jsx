import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Hospital, Droplet, User, AlertCircle, RefreshCw } from 'lucide-react';

export default function LiveMap({
  hospitals = [],
  bloodbanks = [],
  donors = [],
  requests = [],
  center = [11.0264, 77.0028], // Coimbatore PSG Hub default
  zoom = 13,
  height = '500px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all', 'hospitals', 'bloodbanks', 'donors', 'requests'

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Dark Mode OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever data or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Helper for custom HTML markers
    const createCustomIcon = (bgColor, iconChar, isPulsing = false, label = '') => {
      return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            ${isPulsing ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}; opacity: 0.5; animation: emergencyPing 1.6s infinite;"></div>` : ''}
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${bgColor}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6); color: white; font-weight: bold; font-size: 13px; z-index: 10;">
              ${iconChar}
            </div>
            ${label ? `<div style="margin-top: 2px; background: rgba(8, 12, 22, 0.9); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">${label}</div>` : ''}
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 20]
      });
    };

    // 1. Render Hospitals
    if (filter === 'all' || filter === 'hospitals') {
      hospitals.forEach((h) => {
        if (!h.location?.lat || !h.location?.lng) return;
        const icon = createCustomIcon('#2563EB', '🏥', false, h.name.slice(0, 15) + '..');
        const marker = L.marker([h.location.lat, h.location.lng], { icon });
        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: bold; font-size: 13px; color: #1e3a8a;">🏥 ${h.name}</div>
            <div style="font-size: 11px; color: #475569; margin: 4px 0;">${h.address || 'Emergency Trauma Center'}</div>
            <div style="font-size: 11px; font-weight: 600; color: #0284c7;">📞 ${h.emergencyContact || 'Emergency desk'}</div>
            <div style="margin-top: 6px; font-size: 10px; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; display: inline-block;">Accredited Level-1</div>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }

    // 2. Render Blood Banks
    if (filter === 'all' || filter === 'bloodbanks') {
      bloodbanks.forEach((bb) => {
        if (!bb.location?.lat || !bb.location?.lng) return;
        const icon = createCustomIcon('#9333EA', '🩸', false, bb.name.slice(0, 14) + '..');
        const marker = L.marker([bb.location.lat, bb.location.lng], { icon });
        const totalUnits = (bb.inventory || []).reduce((acc, i) => acc + (i.availableUnits || 0), 0);
        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: bold; font-size: 13px; color: #6b21a8;">🩸 ${bb.name}</div>
            <div style="font-size: 11px; color: #475569; margin: 4px 0;">Storage: ${bb.storageCapacity || 1500} units</div>
            <div style="font-size: 11px; font-weight: 600; color: #16a34a;">Available Stock: ${totalUnits} units</div>
            <div style="margin-top: 6px; font-size: 10px; background: #fae8ff; padding: 2px 6px; border-radius: 4px; display: inline-block;">License: ${bb.licenseNumber || 'Verified'}</div>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }

    // 3. Render Donors
    if (filter === 'all' || filter === 'donors') {
      donors.forEach((d) => {
        const lat = d.currentLocation?.lat || d.lat;
        const lng = d.currentLocation?.lng || d.lng;
        if (!lat || !lng) return;

        const isAvail = d.availability === 'Available Now';
        const color = isAvail ? '#10B981' : d.availability === 'Available Today' ? '#F59E0B' : '#64748B';
        const icon = createCustomIcon(color, d.bloodGroup || 'O+', isAvail, d.name.split(' ')[0]);
        const marker = L.marker([lat, lng], { icon });
        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: bold; font-size: 13px; color: #065f46;">👤 ${d.name} (${d.bloodGroup})</div>
            <div style="font-size: 11px; color: #475569; margin: 3px 0;">Status: <strong>${d.availability}</strong></div>
            <div style="font-size: 11px; color: #0284c7;">Trust Score: <strong>${d.trustScore || 95}%</strong></div>
            <div style="font-size: 11px; color: #16a34a;">Lives Saved: <strong>${d.livesSaved || 0}</strong></div>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }

    // 4. Render Active Emergency Requests
    if (filter === 'all' || filter === 'requests') {
      requests.forEach((r) => {
        if (!r.location?.lat || !r.location?.lng) return;
        const isCritical = r.priorityLevel === 'Critical';
        const icon = createCustomIcon(
          isCritical ? '#DC2626' : '#EA580C',
          '🚨',
          true,
          `REQ: ${r.bloodGroup} (${r.unitsRequired}U)`
        );
        const marker = L.marker([r.location.lat, r.location.lng], { icon });
        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 200px;">
            <div style="font-weight: bold; font-size: 13px; color: #991b1b;">🚨 EMERGENCY REQUEST</div>
            <div style="font-size: 12px; font-weight: bold; color: #b91c1c; margin: 2px 0;">
              Needed: ${r.unitsRequired} Units of ${r.bloodGroup}
            </div>
            <div style="font-size: 11px; color: #334155;">Hospital: <strong>${r.hospitalName}</strong></div>
            <div style="font-size: 11px; color: #64748b;">Priority: <strong style="color: #dc2626;">${r.priorityLevel}</strong></div>
            <div style="font-size: 11px; color: #047857;">Secured: ${r.unitsSecured || 0} / ${r.unitsRequired}</div>
            <div style="margin-top: 6px; font-size: 10px; background: #fee2e2; color: #991b1b; padding: 3px 6px; border-radius: 4px;">
              Stage: ${r.escalationStage || 'Nearby Donors'}
            </div>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [hospitals, bloodbanks, donors, requests, filter]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080C16]">
      {/* Map Filter Controls Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition ${
            filter === 'all' ? 'bg-red-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          All Feeds ({hospitals.length + bloodbanks.length + donors.length + requests.length})
        </button>
        <button
          onClick={() => setFilter('requests')}
          className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
            filter === 'requests' ? 'bg-red-700 text-white font-semibold' : 'text-red-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Emergencies ({requests.length})
        </button>
        <button
          onClick={() => setFilter('donors')}
          className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
            filter === 'donors' ? 'bg-emerald-600 text-white font-semibold' : 'text-emerald-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Donors ({donors.length})
        </button>
        <button
          onClick={() => setFilter('hospitals')}
          className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
            filter === 'hospitals' ? 'bg-blue-600 text-white font-semibold' : 'text-blue-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Hospitals ({hospitals.length})
        </button>
        <button
          onClick={() => setFilter('bloodbanks')}
          className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
            filter === 'bloodbanks' ? 'bg-purple-600 text-white font-semibold' : 'text-purple-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Blood Banks ({bloodbanks.length})
        </button>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        title="Reset Map View"
        className="absolute top-3 right-3 z-[1000] p-2 bg-slate-900/90 text-slate-300 hover:text-white rounded-xl border border-slate-700 shadow-md backdrop-blur-sm transition"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      {/* Tactical Grid Overlay & Leaflet Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />

      {/* Map Legend HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
            <span className="font-semibold text-red-400">Emergency Case</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Available Donor</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Trauma Hospital</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            <span>Central Blood Bank</span>
          </span>
        </div>
        <div className="font-mono text-slate-400">
          GPS Hub: 11.0264° N, 77.0028° E (Coimbatore Metro)
        </div>
      </div>
    </div>
  );
}
