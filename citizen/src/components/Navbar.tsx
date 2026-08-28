import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  ShieldAlert,
  UserCheck,
  Building2,
  HardHat,
  Wifi,
  WifiOff,
  Sparkles,
  MessageSquare,
  RefreshCw,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    switchRole,
    logout,
    isOffline,
    setIsOffline,
    offlineQueue,
    syncOfflineQueue,
    activeTab,
    setActiveTab,
    recentSms,
    dismissRecentSms,
    setDemoModalOpen,
  } = useApp();

  const [demoSwitcherOpen, setDemoSwitcherOpen] = useState(false);

  const handleSync = async () => {
    const count = await syncOfflineQueue();
    if (count > 0) {
      alert(`Successfully synced ${count} pending offline report(s) to the server!`);
    }
  };

  return (
    <>
      {/* Top Banner: Demo Jurisdiction Notice (NFR-03) */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-medium text-amber-300">Demo Prototype</span>
          <span className="text-slate-400">| Hand-authored Chennai Jurisdiction Demo Data (Zone 13 Adyar)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDemoModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-0.5 rounded text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Interactive Demo Story (9 Steps)</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('citizen_home')}>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-extrabold text-lg tracking-wider">
                CZ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">CITIZEN</h1>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Chennai
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Evidence-Backed Civic Issue Resolution</p>
              </div>
            </div>

            {/* Current User Identity + Logout */}
            <div className="flex items-center gap-2">
              {/* Demo Mode Switcher (hidden by default, for judges) */}
              <div className="relative">
                <button
                  onClick={() => setDemoSwitcherOpen((o) => !o)}
                  title="Demo Mode: Switch Account"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 border border-slate-200 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden lg:inline">Demo</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${demoSwitcherOpen ? 'rotate-180' : ''}`} />
                </button>

                {demoSwitcherOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden py-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-3 py-2 tracking-wider">Switch Demo Account</p>
                    {[{ key: 'citizen_a', label: 'Priya (Citizen A)', icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" /> },
                      { key: 'citizen_b', label: 'Karthik (Citizen B)', icon: <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> },
                      { key: 'officer', label: 'Officer Ramesh', icon: <HardHat className="w-3.5 h-3.5 text-amber-600" /> },
                      { key: 'admin', label: 'Admin Dr. Sundar', icon: <Building2 className="w-3.5 h-3.5 text-purple-600" /> },
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => { switchRole(key as any); setDemoSwitcherOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition text-left"
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                title="Sign Out"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            {/* Offline Toggle & Actions */}
            <div className="flex items-center gap-2">
              {/* Offline toggle */}
              <button
                onClick={() => setIsOffline(!isOffline)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isOffline
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                }`}
                title={isOffline ? 'Simulating Offline Mode' : 'Online'}
              >
                {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{isOffline ? 'Offline Mode' : 'Online'}</span>
              </button>

              {/* Pending Offline Sync Badge */}
              {offlineQueue.length > 0 && (
                <button
                  onClick={handleSync}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs animate-pulse transition"
                  title="Click to sync offline reports"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync ({offlineQueue.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs based on Role */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="flex space-x-6 overflow-x-auto py-2.5 text-xs font-semibold">
            {currentUser.role === 'citizen' && (
              <>
                <button
                  onClick={() => setActiveTab('citizen_home')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'citizen_home'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Home / Report Issue
                </button>
                <button
                  onClick={() => setActiveTab('my_reports')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'my_reports'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  My Reports & Timeline
                </button>
                <button
                  onClick={() => setActiveTab('nearby_issues')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'nearby_issues'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Community Map (Nearby)
                </button>
              </>
            )}

            {currentUser.role === 'officer' && (
              <>
                <button
                  onClick={() => setActiveTab('officer_dashboard')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'officer_dashboard'
                      ? 'border-amber-600 text-amber-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Priority Work Queue (Zone 13)
                </button>
                <button
                  onClick={() => setActiveTab('officer_map')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'officer_map'
                      ? 'border-amber-600 text-amber-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Jurisdiction Map & Heatmap
                </button>
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin_dashboard')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'admin_dashboard'
                      ? 'border-purple-600 text-purple-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  City Overview & Department Backlogs
                </button>
                <button
                  onClick={() => setActiveTab('admin_hotspots')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'admin_hotspots'
                      ? 'border-purple-600 text-purple-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Chronic Hotspot Clusters (F-18)
                </button>
                <button
                  onClick={() => setActiveTab('admin_sms')}
                  className={`pb-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'admin_sms'
                      ? 'border-purple-600 text-purple-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Simulated SMS Notification Outbox (F-11)
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Floating Simulated SMS Alert Banner */}
      {recentSms && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">Simulated SMS Received</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    To: {recentSms.toPhoneNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-mono leading-relaxed">
                  {recentSms.messageBody}
                </p>
              </div>
            </div>
            <button
              onClick={dismissRecentSms}
              className="text-slate-400 hover:text-white transition p-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
