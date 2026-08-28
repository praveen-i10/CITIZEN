import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  MapPin,
  Layers,
  ListFilter,
  Shield,
  Eye,
  Building2,
  Clock,
  Sparkles,
  Map as MapIcon,
} from 'lucide-react';
import L from 'leaflet';

export const NearbyIssuesMap: React.FC = () => {
  const { refreshKey } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [nearbyIssues, setNearbyIssues] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Get real device GPS on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        // Permission denied or unavailable — fall back to Adyar
        setUserLocation([13.0015, 80.2575]);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Fetch nearby issues once we have a location
  useEffect(() => {
    if (userLocation) fetchNearby();
  }, [refreshKey, userLocation]);

  const fetchNearby = async () => {
    try {
      setLoading(true);
      const [lat, lng] = userLocation!;
      const res = await fetch(`/api/v1/issues/nearby?lat=${lat}&lng=${lng}&radius_m=10000`);
      const data = await res.json();
      if (data?.data) {
        setNearbyIssues(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch nearby issues:', e);
    } finally {
      setLoading(false);
    }
  };

  // Initialize and update Leaflet map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current || !userLocation) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation,
        zoom: 14,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      // Re-center if location changed
      mapInstanceRef.current.setView(userLocation, 14);
    }

    // Place/update "You are here" blue dot
    if (mapInstanceRef.current) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = L.circleMarker(userLocation, {
        radius: 10,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
        weight: 3,
      })
        .addTo(mapInstanceRef.current)
        .bindTooltip('📍 You are here', { permanent: false });
    }

    // Refresh issue markers
    if (markersGroupRef.current && mapInstanceRef.current) {
      markersGroupRef.current.clearLayers();

      nearbyIssues.forEach((issue) => {
        const isHigh = issue.priorityScore >= 70;
        const isMed = issue.priorityScore >= 40 && issue.priorityScore < 70;
        const color = isHigh ? '#dc2626' : isMed ? '#f59e0b' : '#2563eb';

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="
            background-color: ${color};
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 11px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${issue.complaintCount}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([issue.lat, issue.lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedIssue(issue);
        });

        markersGroupRef.current?.addLayer(marker);
      });
    }
  }, [viewMode, nearbyIssues]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Community Issues Map (Chennai)</h2>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              Anonymized View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Public community view displaying open issues in your area without exposing personal reporter data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Map / List toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex text-xs font-bold">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'map' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              List View ({nearbyIssues.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaflet Map Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm overflow-hidden h-[520px] relative">
            <div ref={mapContainerRef} className="w-full h-full rounded-xl" />

            {/* Map Legend Floating Chip */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold space-y-1 shadow-md">
              <div className="font-bold text-slate-700 pb-0.5 border-b border-slate-200">
                Priority Indicator
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                <span>High Priority (Score ≥ 70)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>Medium Priority (Score 40-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span>Standard (Score &lt; 40)</span>
              </div>
            </div>
          </div>

          {/* Selected Issue / Sidebar Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              {selectedIssue ? 'Selected Community Issue' : 'Select an issue pin on the map'}
            </h3>

            {selectedIssue ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase font-mono">
                    ISSUE #{selectedIssue.issueId}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 capitalize">
                    {selectedIssue.category.replace('_', ' ')}
                  </h4>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority Score:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedIssue.priorityScore.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Community Reports:</span>
                    <span className="font-bold text-blue-600">
                      {selectedIssue.complaintCount} independent submission(s)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-slate-800 capitalize">{selectedIssue.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jurisdiction:</span>
                    <span className="text-slate-900">{selectedIssue.jurisdictionZoneName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="text-slate-900">{selectedIssue.departmentName}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 text-[11px] space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Privacy Protected
                  </span>
                  <p className="text-blue-800 leading-tight">
                    Individual citizen identities and phone numbers are strictly protected and never displayed in public community views.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">Click any circular marker on the map to inspect aggregate issue information and community report count.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyIssues.map((issue) => (
            <div
              key={issue.issueId}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">
                  ISSUE #{issue.issueId}
                </span>
                <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                  Priority: {issue.priorityScore.toFixed(1)}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 capitalize">
                {issue.category.replace('_', ' ')}
              </h4>

              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  <strong>Reports:</strong> {issue.complaintCount} independent corroboration(s)
                </p>
                <p>
                  <strong>Ward:</strong> {issue.jurisdictionZoneName}
                </p>
                <p>
                  <strong>Department:</strong> {issue.departmentName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
