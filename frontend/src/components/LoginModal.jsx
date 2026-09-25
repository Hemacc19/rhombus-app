import React, { useState } from 'react';
import { Lock, Mail, UserCheck, ShieldCheck, Zap, X, Fingerprint, Loader2, User, Bot } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, currentUser }) {
  const [email, setEmail] = useState('hema@rhombusai.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [evaluatorLoading, setEvaluatorLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('candidate'); // 'candidate' or 'evaluator'
  const [error, setError] = useState('');

  if (!isOpen) return null;

    const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (email !== 'hema@rhombusai.com' || (password !== '••••••••••••' && password !== 'rhombus' && password !== 'password')) {
      setError("Unauthorized. Invalid clearance credentials provided.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: 'Hema (Candidate)',
        email: email,
        role: 'Senior Data Engineer',
        avatar: 'H'
      });
      onClose();
    }, 400);
  };

  const handleQuickEvaluatorLogin = () => {
    setEvaluatorLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        name: 'Rhombus AI Evaluator',
        email: 'careers@rhombusai.com',
        role: 'Reviewer / Admin',
        avatar: 'R'
      });
      setEvaluatorLoading(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-slide-up">
      <div className="bg-[#0b1120]/90 border border-fuchsia-500/20 rounded-[2.5rem] max-w-md w-full p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)] relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-600 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-500 hover:text-white p-2 rounded-full bg-slate-900/50 hover:bg-slate-800 transition z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center space-y-4 mb-6 relative z-10">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-fuchsia-600 rounded-2xl blur-md opacity-50 animate-pulse"></div>
            <div className="relative h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-fuchsia-500/30">
              <Fingerprint className="h-8 w-8 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Security Gateway</h3>
            <p className="text-xs text-slate-400 mt-1">Select your access clearance level</p>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="relative z-10 flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl mb-8">
          <button
            onClick={() => { setLoginMode('candidate'); setError(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'candidate' 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Candidate</span>
          </button>
          <button
            onClick={() => { setLoginMode('evaluator'); setError(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'evaluator' 
              ? 'bg-slate-800 text-fuchsia-400 shadow-md' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Evaluator</span>
          </button>
        </div>

        {loginMode === 'candidate' ? (
          <form onSubmit={handleLogin} className="space-y-4 relative z-10 animate-slide-up">
            <div className="space-y-1.5">
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-4 top-3.5 text-slate-500 group-focus-within:text-fuchsia-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@rhombusai.com"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-500/50 focus:bg-slate-900 transition-all font-mono shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-500 group-focus-within:text-fuchsia-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-500/50 focus:bg-slate-900 transition-all font-mono shadow-inner"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-fuchsia-600 hover:from-blue-500 hover:to-fuchsia-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all active:scale-[0.98] mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>{loading ? "Decrypting credentials..." : "Initialize Session"}</span>
            </button>
          </form>
        ) : (
          <div className="relative z-10 animate-slide-up space-y-6 flex flex-col items-center justify-center py-4">
            <p className="text-sm text-slate-400 text-center font-medium max-w-xs leading-relaxed">
              To proceed as an AI Evaluator, please complete the mandatory security verification.
            </p>
            
            {/* reCAPTCHA style Evaluator Login */}
            <div 
              className="relative bg-[#f9f9f9] border border-slate-300 rounded-sm p-3 shadow-lg hover:border-emerald-500 transition-all duration-300 group cursor-pointer flex items-center justify-between w-full max-w-[320px] mx-auto active:scale-[0.98]" 
              onClick={handleQuickEvaluatorLogin}
            >
              <div className="flex items-center space-x-4 pl-2">
                <div className={`w-8 h-8 bg-white rounded-sm border-2 flex items-center justify-center transition-all duration-300 ${evaluatorLoading ? 'border-transparent' : 'border-[#c1c1c1] group-hover:border-emerald-500 shadow-inner'}`}>
                  {evaluatorLoading ? (
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-transparent group-hover:text-emerald-500/30 transition-colors" />
                  )}
                </div>
                <span className="text-[15px] font-sans text-[#222] select-none">I'm an AI Evaluator</span>
              </div>
              <div className="flex flex-col items-center justify-center space-y-1 pr-2">
                <div className="flex space-x-1">
                  <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
                </div>
                <span className="text-[10px] text-[#555] font-sans tracking-tight">rhombusCAP</span>
                <span className="text-[8px] text-[#777] font-sans">Privacy - Terms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
