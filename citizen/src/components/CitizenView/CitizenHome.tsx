import React from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Camera,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Map,
} from 'lucide-react';

interface CitizenHomeProps {
  onStartReport: () => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({ onStartReport }) => {
  const { currentUser, setActiveTab, offlineQueue, isOffline } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 backdrop-blur-sm border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Active Citizen Portal: {currentUser.displayName}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Report Civic Issues with Geotagged Proof
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
            Every submission is backed by real camera evidence, automatic jurisdiction routing to
            Chennai Corporation wards, and a transparent 8-factor risk score.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartReport}
              className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Camera className="w-4 h-4 text-blue-700" />
              <span>Report Issue Now</span>
            </button>

            <button
              onClick={() => setActiveTab('my_reports')}
              className="inline-flex items-center gap-2 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-300/30 text-white px-4 py-3 rounded-xl font-semibold text-sm transition"
            >
              <Clock className="w-4 h-4 text-blue-200" />
              <span>Track My Submissions</span>
            </button>

            <button
              onClick={() => setActiveTab('nearby_issues')}
              className="inline-flex items-center gap-2 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-300/30 text-white px-4 py-3 rounded-xl font-semibold text-sm transition"
            >
              <Map className="w-4 h-4 text-blue-200" />
              <span>View Community Map</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Offline Alert if Active */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Offline Capture Active (F-02)</p>
              <p className="text-xs text-amber-700">
                You can capture photos and report issues offline. Reports will queue locally and sync
                automatically once back online.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full">
            {offlineQueue.length} Queued
          </span>
        </div>
      )}

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Camera-First Capture</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In-app camera captures fresh photos with locked GPS coordinates and timestamps to prevent stale or fake submissions.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">AI Voice & Auto-Categorization</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Speak in Tamil, Hindi, or English. Gemini Vision suggests the category while preserving your human override option.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">75m Duplicate Detection</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multiple reports of the same pothole merge into one issue, boosting community corroboration and accelerating priority.
          </p>
        </div>
      </div>
    </div>
  );
};
