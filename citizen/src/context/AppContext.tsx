import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Complaint, Issue, SmsOutboxItem } from '../types.js';

interface AppContextType {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: 'citizen_a' | 'citizen_b' | 'officer' | 'admin') => void;
  isAuthenticated: boolean;
  login: (userId: number, password: string) => Promise<string | null>;
  logout: () => void;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  offlineQueue: any[];
  addOfflineReport: (report: any) => void;
  syncOfflineQueue: () => Promise<number>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedIssueId: number | null;
  setSelectedIssueId: (id: number | null) => void;
  recentSms: SmsOutboxItem | null;
  dismissRecentSms: () => void;
  demoModalOpen: boolean;
  setDemoModalOpen: (open: boolean) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const defaultUser: User = {
  id: 1,
  role: 'citizen',
  displayName: 'Priya Narayanan (Citizen A)',
  phoneNumber: '+91 98401 23456',
  createdAt: '2026-08-20T10:00:00Z',
};

const SESSION_KEY = 'citizen_session';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const restoreSession = (): { user: User; token: string } | null => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedSession = restoreSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!savedSession);
  const [currentUser, setCurrentUser] = useState<User>(savedSession?.user || defaultUser);
  const [sessionToken, setSessionToken] = useState<string | null>(savedSession?.token || null);
  const [users, setUsers] = useState<User[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('citizen_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<string>(
    currentUser.role === 'officer' ? 'officer_dashboard' : currentUser.role === 'admin' ? 'admin_dashboard' : 'citizen_home'
  );
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [recentSms, setRecentSms] = useState<SmsOutboxItem | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/v1/users')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      })
      .catch(() => {});
  }, [refreshKey, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const checkSms = () => {
      fetch('/api/v1/admin/sms-outbox')
        .then((res) => res.json())
        .then((data) => {
          if (data?.data && data.data.length > 0) {
            const latest = data.data[0];
            if (latest.toPhoneNumber === currentUser.phoneNumber || currentUser.role === 'admin') {
              setRecentSms((prev) => (prev?.id === latest.id ? prev : latest));
            }
          }
        })
        .catch(() => {});
    };
    const interval = setInterval(checkSms, 3000);
    return () => clearInterval(interval);
  }, [currentUser, refreshKey, isAuthenticated]);

  const login = async (userId: number, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return data?.error?.message || 'Login failed';
      }
      const { user, token } = data.data;
      setCurrentUser(user);
      setSessionToken(token);
      setIsAuthenticated(true);
      if (user.role === 'officer') setActiveTab('officer_dashboard');
      else if (user.role === 'admin') setActiveTab('admin_dashboard');
      else setActiveTab('citizen_home');
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
      return null;
    } catch (e: any) {
      return 'Network error. Please try again.';
    }
  };

  const logout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    setIsAuthenticated(false);
    setCurrentUser(defaultUser);
    setSessionToken(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const switchRole = (roleType: 'citizen_a' | 'citizen_b' | 'officer' | 'admin') => {
    let targetUser: User | undefined;
    if (roleType === 'citizen_a') {
      targetUser = users.find((u) => u.id === 1);
      setActiveTab('citizen_home');
    } else if (roleType === 'citizen_b') {
      targetUser = users.find((u) => u.id === 2);
      setActiveTab('citizen_home');
    } else if (roleType === 'officer') {
      targetUser = users.find((u) => u.id === 3 && u.role === 'officer');
      setActiveTab('officer_dashboard');
    } else {
      targetUser = users.find((u) => u.id === 4 && u.role === 'admin');
      setActiveTab('admin_dashboard');
    }
    if (targetUser) {
      setCurrentUser(targetUser);
      const token = `session-${targetUser.id}-${Date.now()}`;
      setSessionToken(token);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: targetUser, token }));
    }
  };

  const addOfflineReport = (report: any) => {
    const updated = [...offlineQueue, { ...report, queuedAt: new Date().toISOString() }];
    setOfflineQueue(updated);
    try { localStorage.setItem('citizen_offline_queue', JSON.stringify(updated)); } catch {}
  };

  const syncOfflineQueue = async (): Promise<number> => {
    if (offlineQueue.length === 0) return 0;
    try {
      await fetch('/api/v1/complaints/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user-id': String(currentUser.id) },
        body: JSON.stringify({ reports: offlineQueue }),
      });
      const count = offlineQueue.length;
      setOfflineQueue([]);
      try { localStorage.removeItem('citizen_offline_queue'); } catch {}
      triggerRefresh();
      return count;
    } catch (e) {
      console.error('Failed to sync offline queue:', e);
      return 0;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser, users, setCurrentUser, switchRole,
        isAuthenticated, login, logout,
        isOffline, setIsOffline,
        offlineQueue, addOfflineReport, syncOfflineQueue,
        activeTab, setActiveTab,
        selectedIssueId, setSelectedIssueId,
        recentSms, dismissRecentSms: () => setRecentSms(null),
        demoModalOpen, setDemoModalOpen,
        refreshKey, triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};


