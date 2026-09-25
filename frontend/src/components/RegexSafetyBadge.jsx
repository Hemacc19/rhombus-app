import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RegexSafetyBadge({ isSafe, isValid, error, pattern }) {
  if (!pattern) return null;

  if (isValid && isSafe) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">ReDoS Guard Passed: Pattern is Syntactically Valid & Safe</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[11px] font-mono">
          Safe for Millions of Rows
        </span>
      </div>
    );
  }

  if (isValid && !isSafe) {
    return (
      <div className="flex items-start space-x-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block">Catastrophic Backtracking Warning (ReDoS Risk):</span>
          <span className="text-amber-300/80">{error || "Pattern contains nested quantifiers that can freeze workers."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold block">Invalid Regex Pattern:</span>
        <span className="text-rose-300/80">{error || "Syntax error in regex construction."}</span>
      </div>
    </div>
  );
}
