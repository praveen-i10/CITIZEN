import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { HotspotItem } from '../../types.js';
import { Flame, MapPin, AlertTriangle, Layers, ArrowLeft } from 'lucide-react';
import L from 'leaflet';

export const HotspotMap: React.FC = () => {
  const { refreshKey, setActiveTab, currentUser } = useApp();
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([13.0335, 80.2680]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Get real GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}, // keep default fallback
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchHotspots();
  }, [refreshKey]);

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/hotspots', { headers: { 'x-demo-user-id': String(currentUser.id) } });
      const data = await res.json();
      if (data?.data) {
        setHotspots(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch hotspots:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || hotspots.length === 0) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation,
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      circlesGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(userLocation, 13);
    }

    // 'You are here' marker
    if (mapInstanceRef.current) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = L.circleMarker(userLocation, {
        radius: 10, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3,
      })
        .addTo(mapInstanceRef.current)
        .bindTooltip('📍 You are here', { permanent: false });
    }

    if (circlesGroupRef.current && mapInstanceRef.current) {
      circlesGroupRef.current.clearLayers();

      hotspots.forEach((spot) => {
        const isHigh = spot.riskLevel === 'high';
        const color = isHigh ? '#dc2626' : '#f59e0b';
        const radius = spot.issueCount * 120;

        const circle = L.circle([spot.lat, spot.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.35,
          radius,
          weight: 2,
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>🔥 Hotspot Cluster (${spot.gridCellId})</strong><br/>
            Concentration: <strong>${spot.issueCount} Issue(s)</strong><br/>
            Dominant Category: <strong>${spot.dominantCategory.toUpperCase()}</strong><br/>
            Risk Level: ${spot.riskLevel.toUpperCase()}
          </div>
        `);

        circlesGroupRef.current?.addLayer(circle);
      });
    }
  }, [hotspots]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('admin_dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Chronic Hotspot Clusters (F-18)</h2>
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Geospatial Aggregation</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Surfacing recurring problem areas with 3 or more issues in a 500m grid cell for preventive civil maintenance.
            </p>
          </div>
        </div>
      </div>

      {/* Map & Hotspot Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm h-[500px]">
          <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
        </div>

        {/* Hotspot List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            Identified Problem Zones
          </h3>

          <div className="space-y-3">
            {hotspots.map((spot) => (
              <div
                key={spot.gridCellId}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-slate-700">Cell: {spot.gridCellId}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      spot.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {spot.riskLevel} Risk
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <p>
                    <strong>Concentration:</strong> {spot.issueCount} civic reports
                  </p>
                  <p>
                    <strong>Dominant Category:</strong>{' '}
                    <span className="capitalize">{spot.dominantCategory.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
