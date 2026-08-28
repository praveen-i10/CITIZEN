import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { DepartmentMetric } from '../../types.js';
import {
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Flame,
  MessageSquare,
} from 'lucide-react';
import L from 'leaflet';

export const AdminDashboard: React.FC = () => {
  const { refreshKey, setActiveTab, currentUser } = useApp();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([13.040, 80.245]);

  // Get real GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [refreshKey]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/dashboard', { headers: { 'x-demo-user-id': String(currentUser.id) } });
      const data = await res.json();
      if (data?.data) {
        setDashboardData(data.data);
      }
    } catch (e) {
      console.warn('Failed to load admin dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  // Setup city-wide map
  useEffect(() => {
    if (!mapContainerRef.current || !dashboardData?.cityIssues) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation,
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Render demo zone boundaries
      const zones = [
        { name: 'Zone 13 - Adyar', coords: [[13.010, 80.220], [13.010, 80.275], [12.980, 80.275], [12.980, 80.220]], color: '#3b82f6' },
        { name: 'Zone 9 - Mylapore', coords: [[13.045, 80.250], [13.045, 80.285], [13.015, 80.285], [13.015, 80.250]], color: '#10b981' },
        { name: 'Zone 10 - T. Nagar', coords: [[13.050, 80.210], [13.050, 80.250], [13.020, 80.250], [13.020, 80.210]], color: '#8b5cf6' },
        { name: 'Zone 8 - Anna Nagar', coords: [[13.095, 80.190], [13.095, 80.235], [13.065, 80.235], [13.065, 80.190]], color: '#f59e0b' },
      ];

      zones.forEach((z) => {
        L.polygon(z.coords as L.LatLngExpression[], {
          color: z.color,
          weight: 1.5,
          fillColor: z.color,
          fillOpacity: 0.05,
          dashArray: '4, 4',
        })
          .addTo(map)
          .bindTooltip(z.name, { permanent: false, direction: 'center' });
      });

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(userLocation, 13);
    }

    // 'You are here' blue dot
    if (mapInstanceRef.current) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = L.circleMarker(userLocation, {
        radius: 10, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3,
      })
        .addTo(mapInstanceRef.current)
        .bindTooltip('\ud83d\udccd You are here', { permanent: false });
    }

    if (markersGroupRef.current && mapInstanceRef.current) {
      markersGroupRef.current.clearLayers();

      dashboardData.cityIssues.forEach((issue: any) => {
        const isResolved = issue.status === 'resolved' || issue.status === 'closed';
        const isNeedsVerif = issue.status === 'needs_verification';
        const color = isResolved ? '#10b981' : isNeedsVerif ? '#f59e0b' : '#dc2626';

        const customIcon = L.divIcon({
          className: 'custom-admin-pin',
          html: `<div style="
            background-color: ${color};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 10px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${issue.complaintCount}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([issue.representativeLat, issue.representativeLng], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>Issue #${issue.id} · ${issue.category}</strong><br/>
            Status: <strong>${issue.status.toUpperCase()}</strong><br/>
            Priority Score: ${issue.priorityScore.toFixed(1)}<br/>
            Department: ${issue.departmentName}
          </div>
        `);
        markersGroupRef.current?.addLayer(marker);
      });
    }
  }, [dashboardData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* City Admin Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Chennai Municipal Corporation Admin</h2>
              <span className="bg-purple-400/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/30 uppercase">
                City Overview
              </span>
            </div>
            <p className="text-xs text-purple-200">
              Department Performance, Backlog Tracking & Resolution SLA Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('admin_hotspots')}
            className="flex items-center gap-1.5 bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold transition"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Hotspots (F-18)</span>
          </button>

          <button
            onClick={() => setActiveTab('admin_sms')}
            className="flex items-center gap-1.5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/40 text-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold transition"
          >
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <span>SMS Outbox</span>
          </button>
        </div>
      </div>

      {/* Top High-level KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Issues
          </span>
          <div className="text-2xl font-black text-slate-900">
            {dashboardData?.totalIssues ?? '--'}
          </div>
          <span className="text-[11px] text-slate-500">Across all municipal wards</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
            Active Backlog
          </span>
          <div className="text-2xl font-black text-rose-600">
            {dashboardData?.openIssuesCount ?? '--'}
          </div>
          <span className="text-[11px] text-slate-500">Unresolved or ongoing work</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Resolved / Closed
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {dashboardData?.resolvedCount ?? '--'}
          </div>
          <span className="text-[11px] text-slate-500">With geo-verified proof</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Needs Verification
          </span>
          <div className="text-2xl font-black text-amber-600">
            {dashboardData?.needsVerificationCount ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">Location tolerance check</span>
        </div>
      </div>

      {/* Department Breakdown Cards (F-17) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Department Backlogs & Response Times
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData?.departmentMetrics?.map((dept: DepartmentMetric) => (
            <div
              key={dept.departmentId}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition space-y-3"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {dept.departmentName}
                </h4>
              </div>

              <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Open Backlog:</span>
                  <span className="font-extrabold text-rose-600">{dept.openCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolved:</span>
                  <span className="font-extrabold text-emerald-600">{dept.resolvedCount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-500">Avg Response:</span>
                  <span className="font-bold text-slate-700">
                    {dept.avgResponseTimeHours ? `${dept.avgResponseTimeHours} hrs` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* City-wide Leaflet Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            City-Wide Jurisdiction Map & Ward Boundaries
          </h3>
          <span className="text-xs text-slate-500">
            Includes Zone 13 Adyar, Zone 9 Mylapore, Zone 10 T. Nagar, Zone 8 Anna Nagar
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm overflow-hidden h-[460px]">
          <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
