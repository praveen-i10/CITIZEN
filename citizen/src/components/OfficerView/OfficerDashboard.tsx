import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext.js';
import { Issue, PriorityBreakdown } from '../../types.js';
import { ResolutionCaptureModal } from './ResolutionCaptureModal.js';
import {
  HardHat,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  Camera,
  Play,
  ShieldCheck,
  Building2,
  Users,
  Info,
  X,
} from 'lucide-react';
import L from 'leaflet';

export const OfficerDashboard: React.FC = () => {
  const { currentUser, refreshKey, triggerRefresh } = useApp();

  const [officerData, setOfficerData] = useState<any | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'map'>('queue');

  // Selected issue for Priority Factor Breakdown Modal
  const [breakdownIssue, setBreakdownIssue] = useState<any | null>(null);

  // Selected issue for Resolution Capture Modal
  const [resolvingIssue, setResolvingIssue] = useState<any | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([13.0015, 80.2575]);

  // Get real GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchOfficerDashboard();
  }, [currentUser, refreshKey]);

  const fetchOfficerDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/officer/dashboard', {
        headers: { 'x-demo-user-id': String(currentUser.id) },
      });
      const data = await res.json();
      if (data?.data) {
        setOfficerData(data.data.officer);
        setIssues(data.data.issues || []);
      }
    } catch (e) {
      console.warn('Failed to load officer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (issueId: number) => {
    try {
      await fetch(`/api/v1/officer/issues/${issueId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user-id': String(currentUser.id) },
      });
      triggerRefresh();
    } catch (err: any) {
      alert('Failed to acknowledge: ' + err.message);
    }
  };

  const handleStartWork = async (issueId: number) => {
    try {
      await fetch(`/api/v1/officer/issues/${issueId}/start-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user-id': String(currentUser.id) },
      });
      triggerRefresh();
    } catch (err: any) {
      alert('Failed to start work: ' + err.message);
    }
  };

  // Setup Leaflet map when switching to map tab
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation,
        zoom: 14,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(userLocation, 14);
    }

    // 'You are here' blue dot
    if (mapInstanceRef.current) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = L.circleMarker(userLocation, {
        radius: 10, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3,
      })
        .addTo(mapInstanceRef.current)
        .bindTooltip('📍 You are here', { permanent: false });
    }

    if (markersGroupRef.current && mapInstanceRef.current) {
      markersGroupRef.current.clearLayers();

      issues.forEach((issue) => {
        const isHigh = issue.priorityScore >= 70;
        const color = isHigh ? '#dc2626' : '#d97706';

        const customIcon = L.divIcon({
          className: 'custom-officer-pin',
          html: `<div style="
            background-color: ${color};
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-weight: 800;
            font-size: 11px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">#${issue.id} · Priority ${issue.priorityScore.toFixed(0)}</div>`,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });

        const marker = L.marker([issue.representativeLat, issue.representativeLng], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>Issue #${issue.id} (${issue.category})</strong><br/>
            Priority Score: <strong>${issue.priorityScore.toFixed(1)}</strong><br/>
            Status: ${issue.status}<br/>
            Complaints: ${issue.complaintCount}
          </div>
        `);
        markersGroupRef.current?.addLayer(marker);
      });
    }
  }, [activeTab, issues]);

  const filteredIssues = issues.filter((i) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'high_priority') return i.priorityScore >= 70;
    if (filterCategory === 'ongoing') return i.status === 'ongoing';
    return i.category === filterCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Dark Ambient background for Officer Dashboard */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-slate-900 via-slate-800/20 to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              Officer Dashboard
              <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                LIVE
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Welcome back, <span className="font-bold text-white">{currentUser.displayName}</span> • {officerData?.departmentName || 'Loading...'}
            </p>
          </div>
        </div>
        {officerData?.jurisdictionZoneName && (
          <div className="bg-slate-800/80 border border-slate-700 px-5 py-3 rounded-2xl text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Active Jurisdiction</span>
            <span className="text-sm font-bold text-white block mt-0.5 flex items-center gap-1.5 justify-end">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {officerData.jurisdictionZoneName} ({officerData.wardLabel})
            </span>
          </div>
        )}
      </motion.div>

      {/* Metric Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Queue</span>
          <div className="text-4xl font-black text-slate-900 mt-2 mb-1 tracking-tight">{filteredIssues.length}</div>
          <span className="text-xs text-slate-500">Total Assigned</span>
        </div>

        <div className="bg-rose-50/80 backdrop-blur-xl border border-rose-100 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Critical</span>
          <div className="text-4xl font-black text-rose-700 mt-2 mb-1 tracking-tight">
            {filteredIssues.filter((i) => i.priorityScore >= 80).length}
          </div>
          <span className="text-xs text-rose-600/80">Require immediate action</span>
        </div>

        <div className="bg-amber-50/80 backdrop-blur-xl border border-amber-100 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">In Progress</span>
          <div className="text-4xl font-black text-amber-700 mt-2 mb-1 tracking-tight">
            {filteredIssues.filter((i) => i.status === 'acknowledged' || i.status === 'ongoing').length}
          </div>
          <span className="text-xs text-amber-600/80">Active tickets</span>
        </div>

        <div className="bg-emerald-50/80 backdrop-blur-xl border border-emerald-100 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved</span>
          <div className="text-4xl font-black text-emerald-700 mt-2 mb-1 tracking-tight">
            {issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length}
          </div>
          <span className="text-xs text-emerald-600/80">Pending citizen confirmation</span>
        </div>
      </motion.div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-fit">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'queue' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Priority Queue View ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'map' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Jurisdiction Map & Pins
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Issues
          </button>
          <button
            onClick={() => setFilterCategory('high_priority')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterCategory === 'high_priority'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            High Priority (≥70)
          </button>
          <button
            onClick={() => setFilterCategory('ongoing')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterCategory === 'ongoing'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Work in Progress
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'queue' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading work queue...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              No issues currently match this filter.
            </div>
          ) : (
            filteredIssues.map((issue, rank) => {
              const isHigh = issue.priorityScore >= 70;
              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-2xl border transition p-5 shadow-xs hover:shadow-md space-y-4 ${
                    isHigh ? 'border-rose-200 bg-gradient-to-r from-white to-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Priority Rank Badge */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          isHigh ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                        }`}
                        title={`Queue Rank #${rank + 1}`}
                      >
                        #{rank + 1}
                      </div>

                      {issue.firstPhoto && (
                        <img
                          src={issue.firstPhoto}
                          alt={issue.category}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            ISSUE #{issue.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              issue.status === 'submitted'
                                ? 'bg-blue-100 text-blue-800'
                                : issue.status === 'acknowledged'
                                ? 'bg-purple-100 text-purple-800'
                                : issue.status === 'ongoing'
                                ? 'bg-amber-100 text-amber-800'
                                : issue.status === 'needs_verification'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {issue.status}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            Confidence: {issue.evidenceConfidenceBand?.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 capitalize mt-1">
                          {issue.category.replace('_', ' ')}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <strong>{issue.complaintCount}</strong> report(s) ·{' '}
                            <strong>{issue.independentReportersCount}</strong> independent reporter(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {issue.wardLabel || 'Ward 175 Adyar'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Score Display & Breakdown Trigger */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          8-Factor Risk Score
                        </span>
                        <span
                          className={`text-2xl font-black ${
                            isHigh ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {issue.priorityScore.toFixed(1)}
                          <span className="text-xs text-slate-400 font-normal"> / 100</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setBreakdownIssue(issue)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Inspect Breakdown</span>
                      </button>
                    </div>
                  </div>

                  {/* Officer Action Workflow Bar (F-14) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {issue.status === 'submitted' && (
                        <span>Next Step: Acknowledge report and inspect location.</span>
                      )}
                      {issue.status === 'acknowledged' && (
                        <span>Next Step: Dispatch field crew and start road repairs.</span>
                      )}
                      {issue.status === 'ongoing' && (
                        <span className="text-amber-700 font-semibold">
                          Repairs in progress. Capture fresh photo evidence to resolve.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {issue.status === 'submitted' && (
                        <button
                          onClick={() => handleAcknowledge(issue.id)}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
                        >
                          Acknowledge Issue
                        </button>
                      )}

                      {issue.status === 'acknowledged' && (
                        <button
                          onClick={() => handleStartWork(issue.id)}
                          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
                        >
                          Start Work / Dispatch Crew
                        </button>
                      )}

                      {(issue.status === 'ongoing' || issue.status === 'acknowledged') && (
                        <button
                          onClick={() => setResolvingIssue(issue)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Mark Resolved (Capture Proof)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Leaflet Map Tab */
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm overflow-hidden h-[540px]">
          <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
        </div>
      )}

      {/* 8-Factor Priority Score Breakdown Modal (DEC-17, F-09) */}
      {breakdownIssue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold font-mono text-blue-600">
                  ISSUE #{breakdownIssue.id} · MATHEMATICAL BREAKDOWN
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  8-Factor Priority Score: {breakdownIssue.priorityScore.toFixed(1)} / 100
                </h3>
              </div>
              <button
                onClick={() => setBreakdownIssue(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every civic issue in CITIZEN is transparently scored using 8 weighted factors to prevent
              bias and ensure critical road hazards with high public exposure and multiple independent
              reporters are addressed first.
            </p>

            {/* Breakdown Bars */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              {/* 1. Severity */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>1. Physical Severity (Weight: 20%)</span>
                  <span>{breakdownIssue.priorityBreakdown?.severity || 85} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.severity || 85}%` }}
                  />
                </div>
              </div>

              {/* 2. Public Exposure */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>2. Public Exposure / Traffic Volume (Weight: 15%)</span>
                  <span>{breakdownIssue.priorityBreakdown?.publicExposure || 85} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.publicExposure || 85}%` }}
                  />
                </div>
              </div>

              {/* 3. Vulnerable Population */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>3. Vulnerable Population Impact (Pedestrians/School) (Weight: 15%)</span>
                  <span>{breakdownIssue.priorityBreakdown?.vulnerablePopulation || 80} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.vulnerablePopulation || 80}%` }}
                  />
                </div>
              </div>

              {/* 4. Critical Infrastructure */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>4. Critical Infrastructure (Bus Routes/Hospitals) (Weight: 10%)</span>
                  <span>{breakdownIssue.priorityBreakdown?.criticalInfrastructure || 75} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.criticalInfrastructure || 75}%` }}
                  />
                </div>
              </div>

              {/* 5. Duration */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>5. Duration / Age Factor (Weight: 10%)</span>
                  <span>{breakdownIssue.priorityBreakdown?.duration || 60} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-600 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.duration || 60}%` }}
                  />
                </div>
              </div>

              {/* 6. Community Corroboration */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>6. Community Corroboration (Independent Reports) (Weight: 10%)</span>
                  <span className="text-blue-600 font-extrabold">
                    {breakdownIssue.priorityBreakdown?.communityCorroboration || 90} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.communityCorroboration || 90}%` }}
                  />
                </div>
              </div>

              {/* 7. Recurrence */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>7. Recurring Defect Factor (Weight: 10%)</span>
                  <span>{breakdownIssue.priorityBreakdown?.recurrence || 70} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.recurrence || 70}%` }}
                  />
                </div>
              </div>

              {/* 8. Evidence Confidence */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>8. Evidence Confidence Score (Weight: 10%)</span>
                  <span className="text-emerald-700 font-extrabold">
                    {breakdownIssue.priorityBreakdown?.evidenceConfidence || 95} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${breakdownIssue.priorityBreakdown?.evidenceConfidence || 95}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setBreakdownIssue(null)}
                className="bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Capture Modal */}
      {resolvingIssue && (
        <ResolutionCaptureModal
          issue={resolvingIssue}
          onClose={() => setResolvingIssue(null)}
          onSuccess={() => {
            setResolvingIssue(null);
            fetchOfficerDashboard();
          }}
        />
      )}
    </div>
  );
};
