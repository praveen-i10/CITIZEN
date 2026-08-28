import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  HardHat,
  Building2,
  X,
  ArrowRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';

const DEMO_STEPS = [
  {
    step: 1,
    persona: 'Citizen A (Priya Narayanan)',
    title: '1. Priya Reports Severe Pothole in Adyar',
    desc: 'Priya captures in-app camera photo + GPS (13.0015° N, 80.2575° E on Adyar 2nd Ave) and voice description in Tamil/English.',
    actionEndpoint: '/api/v1/demo/step-1-priya-report',
    resultSummary: 'Report submitted. Auto-routed to Zone 13 Roads & Infrastructure (Ward 175). Priority calculated: 68.5.',
    targetTab: 'my_reports',
    targetRole: 'citizen_a' as const,
  },
  {
    step: 2,
    persona: 'Citizen B (Karthik Raja)',
    title: '2. Karthik Reports Same Pothole (25m Away)',
    desc: 'Karthik encounters the same pothole 25m away and submits a voice report. 75m duplicate algorithm detects Priya\'s open issue.',
    actionEndpoint: '/api/v1/demo/step-4-karthik-report',
    resultSummary: 'Duplicate merged! 2 independent reporters. Evidence Confidence jumps to HIGH; Priority increases from 68.5 → 83.5.',
    targetTab: 'citizen_home',
    targetRole: 'citizen_b' as const,
  },
  {
    step: 3,
    persona: 'Officer Ramesh Kumar',
    title: '3. Officer Ramesh Resolves Issue with Fresh Proof',
    desc: 'Officer Ramesh sees Priya & Karthik\'s pothole ranked #1 in queue (above lower-priority seed footpath issue). Acknowledges, starts work, and submits fresh photo within 15m GPS.',
    actionEndpoint: '/api/v1/demo/step-6-officer-resolve',
    resultSummary: '100m GPS cross-check PASSES (15m delta). Status moves to RESOLVED. Automated SMS dispatched to Priya & Karthik.',
    targetTab: 'officer_dashboard',
    targetRole: 'officer' as const,
  },
  {
    step: 4,
    persona: 'Citizen A (Priya Narayanan)',
    title: '4. Priya Verifies Proof & Closes Ticket',
    desc: 'Priya inspects before/after photos and confirms the road asphalt patch is smooth.',
    actionEndpoint: '/api/v1/demo/step-9-priya-confirm',
    resultSummary: 'Citizen confirmed! Ticket marked CLOSED. Complete closed-loop civic accountability achieved.',
    targetTab: 'my_reports',
    targetRole: 'citizen_a' as const,
  },
];

export const DemoScenarioModal: React.FC = () => {
  const {
    demoModalOpen,
    setDemoModalOpen,
    switchRole,
    setActiveTab,
    triggerRefresh,
  } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [stepSuccess, setStepSuccess] = useState<string | null>(null);

  if (!demoModalOpen) return null;

  const handleResetDb = async () => {
    try {
      setRunning(true);
      await fetch('/api/v1/demo/reset', { method: 'POST' });
      setCurrentStepIndex(0);
      setStepSuccess('Database successfully reset to initial clean demo state.');
      triggerRefresh();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleExecuteStep = async (stepIdx: number) => {
    const stepDef = DEMO_STEPS[stepIdx];
    try {
      setRunning(true);
      setStepSuccess(null);
      const res = await fetch(stepDef.actionEndpoint, { method: 'POST' });
      const json = await res.json();

      switchRole(stepDef.targetRole);
      setActiveTab(stepDef.targetTab);
      triggerRefresh();

      setStepSuccess(`Step ${stepIdx + 1} executed! ${stepDef.resultSummary}`);
      setCurrentStepIndex(Math.min(DEMO_STEPS.length - 1, stepIdx + 1));
    } catch (err: any) {
      alert('Step execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Interactive 4-Minute Demo Walkthrough
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic script from 10_DEMO_SCENARIO.md (Adyar Pothole Resolution Story)
              </p>
            </div>
          </div>
          <button
            onClick={() => setDemoModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Success Toast */}
        {stepSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{stepSuccess}</span>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-3">
          {DEMO_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className={`p-4 rounded-xl border transition space-y-2 ${
                currentStepIndex === idx
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {s.step}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{s.title}</span>
                </div>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {s.persona}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-8">{s.desc}</p>

              <div className="pl-8 pt-1 flex items-center justify-between">
                <span className="text-[11px] text-blue-700 font-semibold italic">
                  → Switches to {s.persona} & navigates to {s.targetTab}
                </span>

                <button
                  onClick={() => handleExecuteStep(idx)}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Step {s.step}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleResetDb}
            disabled={running}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>

          <button
            onClick={() => setDemoModalOpen(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm transition"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
