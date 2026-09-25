import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, X, Play, Code, Zap } from 'lucide-react';
import { validateRegex } from '../services/api';
import RegexSafetyBadge from './RegexSafetyBadge';

export default function ReDosTestModal({ isOpen, onClose }) {
  const [testPattern, setTestPattern] = useState('(a+)+');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTest = async (patternToTest = testPattern) => {
    if (!patternToTest) return;
    setLoading(true);
    try {
      const res = await validateRegex(patternToTest);
      setValidationResult(res);
    } catch (err) {
      console.error("ReDoS validation error", err);
    } finally {
      setLoading(false);
    }
  };

  const setDangerousPattern = (pattern) => {
    setTestPattern(pattern);
    handleTest(pattern);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-up">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ReDoS AST Safety Guard Tester</h3>
            <p className="text-xs text-slate-400">Test catastrophic backtracking detection in real-time</p>
          </div>
        </div>

        {/* Preset ReDoS Test Patterns */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Try Sample ReDoS Vulnerable Patterns:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDangerousPattern('(a+)+')}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
            >
              ⚠️ (a+)+ Nested Quantifier
            </button>
            <button
              onClick={() => setDangerousPattern('(a|a)+')}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
            >
              ⚠️ (a|a)+ Overlapping Group
            </button>
            <button
              onClick={() => setDangerousPattern('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,7}\\b')}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
            >
              ✅ Safe Email Pattern
            </button>
          </div>
        </div>

        {/* Test Pattern Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Enter Pattern to Validate:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testPattern}
              onChange={(e) => setTestPattern(e.target.value)}
              placeholder="e.g. (a+)+"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              onClick={() => handleTest()}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test</span>
            </button>
          </div>
        </div>

        {/* Validation Result Output */}
        {validationResult && (
          <div className="space-y-2 pt-1 animate-slide-up">
            <RegexSafetyBadge
              isSafe={validationResult.is_safe}
              isValid={validationResult.is_valid}
              error={validationResult.error}
              pattern={validationResult.cleaned_pattern}
            />
          </div>
        )}
      </div>
    </div>
  );
}
