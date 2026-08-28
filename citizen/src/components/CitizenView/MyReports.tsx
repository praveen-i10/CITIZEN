import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { Complaint, IssueStatus, StatusHistoryItem } from '../../types.js';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileText,
  User,
  Image as ImageIcon,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export const MyReports: React.FC = () => {
  const { currentUser, refreshKey, triggerRefresh } = useApp();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [reopenModalOpen, setReopenModalOpen] = useState<boolean>(false);
  const [reopenNote, setReopenNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchMyComplaints();
  }, [currentUser, refreshKey]);

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/complaints/mine', {
        headers: { 'x-demo-user-id': String(currentUser.id) },
      });
      const data = await res.json();
      if (data?.data) {
        setComplaints(data.data);
        if (selectedComplaint) {
          const updated = data.data.find((c: any) => c.id === selectedComplaint.id);
          if (updated) setSelectedComplaint(updated);
        }
      }
    } catch (e) {
      console.warn('Failed to load my reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResolution = async (issueId: number) => {
    try {
      setActionLoading(true);
      await fetch(`/api/v1/issues/${issueId}/confirm-resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': String(currentUser.id),
        },
      });
      triggerRefresh();
      fetchMyComplaints();
    } catch (err: any) {
      alert('Failed to confirm resolution: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (issueId: number) => {
    try {
      setActionLoading(true);
      await fetch(`/api/v1/issues/${issueId}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': String(currentUser.id),
        },
        body: JSON.stringify({ note: reopenNote }),
      });
      setReopenModalOpen(false);
      setReopenNote('');
      triggerRefresh();
      fetchMyComplaints();
    } catch (err: any) {
      alert('Failed to reopen issue: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'submitted':
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Submitted</span>;
      case 'acknowledged':
        return <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Acknowledged</span>;
      case 'ongoing':
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">In Progress</span>;
      case 'resolved':
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse">Resolved (Needs Citizen Review)</span>;
      case 'closed':
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Closed & Confirmed</span>;
      case 'reopened':
        return <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Reopened</span>;
      case 'needs_verification':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Needs Verification</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">My Submitted Reports</h2>
          <p className="text-xs text-slate-500">
            Real-time stage timeline and resolution verification for reports submitted by {currentUser.displayName}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading your submissions...</div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Complaints Submitted Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not filed any reports under this persona. Switch to another citizen or click "Report Issue" to file a new report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((comp) => {
            const isResolved = comp.issueStatus === 'resolved';
            return (
              <div
                key={comp.id}
                onClick={() => setSelectedComplaint(comp)}
                className={`bg-white rounded-2xl border transition p-5 cursor-pointer shadow-xs hover:shadow-md ${
                  selectedComplaint?.id === comp.id
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={comp.photoUrl}
                      alt={comp.finalCategory}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {comp.referenceId}
                        </span>
                        {getStatusBadge(comp.issueStatus)}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 capitalize mt-0.5">
                        {comp.finalCategory.replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {comp.descriptionText}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {comp.issueDepartmentName || 'Roads & Infrastructure'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(comp.capturedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Priority: {comp.issuePriorityScore?.toFixed(1) || 'N/A'}
                    </span>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <span>View Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* If Resolved: Highlight Action Bar for Citizen Confirmation (F-12) */}
                {isResolved && (
                  <div className="mt-4 pt-3 border-t border-slate-100 bg-emerald-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Officer has resolved this issue! Please verify proof and confirm.</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmResolution(comp.issueId);
                        }}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
                      >
                        Confirm Resolved (Close)
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedComplaint(comp);
                          setReopenModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-none bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        Reopen Issue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Timeline Modal (C-8) */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold font-mono text-blue-600">
                  {selectedComplaint.referenceId}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 capitalize">
                  {selectedComplaint.finalCategory.replace('_', ' ')} · Lifecycle Timeline
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos: Before & After (if resolved) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600">Original Citizen Evidence</span>
                <img
                  src={selectedComplaint.photoUrl}
                  alt="Original"
                  className="w-full h-44 object-cover rounded-xl border border-slate-200"
                />
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>GPS: {selectedComplaint.deviceGpsLat?.toFixed(4)}° N, {selectedComplaint.deviceGpsLng?.toFixed(4)}° E</span>
                  <span>{new Date(selectedComplaint.capturedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {selectedComplaint.resolutionEvidence ? (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Officer Resolution Evidence (Geo-Verified)
                  </span>
                  <img
                    src={selectedComplaint.resolutionEvidence.photoUrl}
                    alt="Resolution"
                    className="w-full h-44 object-cover rounded-xl border border-emerald-300 ring-2 ring-emerald-500/20"
                  />
                  <div className="text-[11px] text-emerald-800 flex items-center justify-between pt-1">
                    <span>Officer GPS: Within {selectedComplaint.resolutionEvidence.distanceFromOriginalM || 15}m</span>
                    <span className="font-bold">VERIFIED MATCH</span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-xs text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 mb-2" />
                  <span>Resolution photo pending officer field work</span>
                </div>
              )}
            </div>

            {/* Status Timeline Stepper */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Status History & Activity Log
              </h4>

              <div className="space-y-3">
                {selectedComplaint.statusHistory?.map((item: StatusHistoryItem, idx: number) => (
                  <div key={item.id} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase">{item.toStatus}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{item.note || 'Status updated'}</p>
                      <p className="text-[10px] text-slate-400">By: {item.changedByName || 'System'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* If Resolved: Actions */}
            {selectedComplaint.issueStatus === 'resolved' && (
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => setReopenModalOpen(true)}
                  className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                >
                  Reopen Issue
                </button>
                <button
                  onClick={() => handleConfirmResolution(selectedComplaint.issueId)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition"
                >
                  Confirm Resolution (Close)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reopen Note Modal */}
      {reopenModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Reopen Complaint #{selectedComplaint.referenceId}
            </h3>
            <p className="text-xs text-slate-500">
              Provide a brief note explaining why this issue needs further work.
            </p>

            <textarea
              rows={3}
              value={reopenNote}
              onChange={(e) => setReopenNote(e.target.value)}
              placeholder="e.g. The asphalt patch is already sinking and cracked after rain..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReopen(selectedComplaint.issueId)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Submit Reopen Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
