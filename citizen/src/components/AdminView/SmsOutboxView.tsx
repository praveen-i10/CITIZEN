import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { SmsOutboxItem } from '../../types.js';
import { MessageSquare, ArrowLeft, Send, CheckCircle2, Phone, Clock } from 'lucide-react';

export const SmsOutboxView: React.FC = () => {
  const { refreshKey, setActiveTab, currentUser } = useApp();
  const [messages, setMessages] = useState<SmsOutboxItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSmsOutbox();
  }, [refreshKey]);

  const fetchSmsOutbox = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/sms-outbox', { headers: { 'x-demo-user-id': String(currentUser.id) } });
      const data = await res.json();
      if (data?.data) {
        setMessages(data.data);
      }
    } catch (e) {
      console.warn('Failed to load SMS outbox:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
              <h2 className="text-xl font-extrabold text-slate-900">Simulated SMS Outbox (F-11)</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                Diagnostic Audit Log
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Captures all simulated SMS notifications dispatched to citizens across every stage transition.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading SMS logs...</div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No SMS dispatches recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {messages.map((sms) => (
            <div key={sms.id} className="p-4 hover:bg-slate-50 transition space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {sms.complaintReferenceId}
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {sms.toPhoneNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(sms.createdAt).toLocaleString()}</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                    {sms.sendStatus}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono leading-relaxed">
                {sms.messageBody}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
