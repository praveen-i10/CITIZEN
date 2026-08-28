import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Navbar } from './components/Navbar.js';
import { LoginScreen } from './components/LoginScreen.js';
import { CitizenHome } from './components/CitizenView/CitizenHome.js';
import { ReportIssueWizard } from './components/CitizenView/ReportIssueWizard.js';
import { MyReports } from './components/CitizenView/MyReports.js';
import { NearbyIssuesMap } from './components/CitizenView/NearbyIssuesMap.js';
import { OfficerDashboard } from './components/OfficerView/OfficerDashboard.js';
import { AdminDashboard } from './components/AdminView/AdminDashboard.js';
import { HotspotMap } from './components/AdminView/HotspotMap.js';
import { SmsOutboxView } from './components/AdminView/SmsOutboxView.js';
import { DemoScenarioModal } from './components/DemoScenarioModal.js';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, isAuthenticated } = useApp();
  const [isReporting, setIsReporting] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* CITIZEN VIEWS */}
        {currentUser.role === 'citizen' && (
          <>
            {activeTab === 'citizen_home' && (
              <>
                {isReporting ? (
                  <ReportIssueWizard
                    onFinish={() => {
                      setIsReporting(false);
                      setActiveTab('my_reports');
                    }}
                  />
                ) : (
                  <CitizenHome onStartReport={() => setIsReporting(true)} />
                )}
              </>
            )}

            {activeTab === 'my_reports' && <MyReports />}
            {activeTab === 'nearby_issues' && <NearbyIssuesMap />}
          </>
        )}

        {/* OFFICER VIEWS */}
        {currentUser.role === 'officer' && (
          <>
            {(activeTab === 'officer_dashboard' || activeTab === 'officer_map') && (
              <OfficerDashboard />
            )}
          </>
        )}

        {/* ADMIN VIEWS */}
        {currentUser.role === 'admin' && (
          <>
            {activeTab === 'admin_dashboard' && <AdminDashboard />}
            {activeTab === 'admin_hotspots' && <HotspotMap />}
            {activeTab === 'admin_sms' && <SmsOutboxView />}
          </>
        )}
      </main>

      <DemoScenarioModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
