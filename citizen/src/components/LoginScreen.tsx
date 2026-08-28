import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, LogIn, UserCheck, HardHat, Building2, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';

const ACCOUNTS = [
  { id: 1, name: 'Priya Narayanan', label: 'Citizen A', role: 'citizen' as const, hint: 'priya123', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 2, name: 'Karthik Raja', label: 'Citizen B', role: 'citizen' as const, hint: 'karthik123', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: 3, name: 'Officer Ramesh Kumar', label: 'Field Officer', role: 'officer' as const, hint: 'officer123', icon: HardHat, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 4, name: 'Dr. Sundar Murthy', label: 'Municipal Admin', role: 'admin' as const, hint: 'admin123', icon: Building2, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
];

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedAccount = ACCOUNTS.find((a) => a.id === selectedAccountId)!;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }
    setError(null);
    setLoading(true);
    const err = await login(selectedAccountId, password);
    if (err) {
      setError(err);
    }
    setLoading(false);
  };

  const handleDemoFill = () => {
    setPassword(selectedAccount.hint);
    setError(null);
  };

  const Icon = selectedAccount.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-900/50 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CITIZEN</h1>
          <p className="text-slate-400 text-sm mt-1">Evidence-Backed Civic Issue Resolution · Chennai</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-lg font-bold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Account Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Account</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${selectedAccount.border} bg-white/5 hover:bg-white/10 transition-colors text-left`}
                >
                  <div className={`w-10 h-10 rounded-xl ${selectedAccount.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${selectedAccount.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{selectedAccount.name}</div>
                    <div className={`text-xs font-bold ${selectedAccount.color}`}>{selectedAccount.label}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                    >
                      {ACCOUNTS.map((account) => {
                        const AIcon = account.icon;
                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setPassword('');
                              setError(null);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${selectedAccountId === account.id ? 'bg-white/10' : ''}`}
                          >
                            <div className={`w-9 h-9 rounded-xl ${account.bg} flex items-center justify-center flex-shrink-0`}>
                              <AIcon className={`w-4 h-4 ${account.color}`} />
                            </div>
                            <div>
                              <div className="text-white text-sm font-semibold">{account.name}</div>
                              <div className={`text-xs font-bold ${account.color}`}>{account.label}</div>
                            </div>
                            {selectedAccountId === account.id && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Use Demo Password
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm shadow-lg shadow-blue-900/40 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Hackathon Demo — Hackfusion CIT · CITIZEN Platform
        </p>
      </motion.div>
    </div>
  );
};
