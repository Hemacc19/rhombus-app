import React from 'react';
import { Cpu, Zap, X, Gauge, HardDrive, CheckCircle2 } from 'lucide-react';

export default function JvmMetricsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-up">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Multi-Core JVM Speed & PySpark Metrics</h3>
            <p className="text-xs text-slate-400">JVM Thread Saturation & Vectorized Memory Allocation</p>
          </div>
        </div>

        {/* Hardware & JVM Specs Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Driver Memory</span>
            <div className="text-sm font-extrabold text-cyan-400 font-mono flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>2.0 GB Allocated</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Executor Memory</span>
            <div className="text-sm font-extrabold text-blue-400 font-mono flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>2.0 GB per Core</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">PyArrow Vectorization</span>
            <div className="text-xs font-bold text-emerald-400 font-mono flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apache Arrow Active</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Serialization Engine</span>
            <div className="text-xs font-bold text-indigo-400 font-mono flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>KryoSerializer</span>
            </div>
          </div>
        </div>

        {/* Dynamic Parallelism Description */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-white flex items-center space-x-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>Why PySpark JVM Speed Scales to Millions of Rows</span>
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike Python row-by-row loops, PySpark translates regular expression replacements (<code className="text-cyan-300">regexp_replace</code>) into native JVM C++ bytecode executed simultaneously across all CPU cores without Python GIL bottlenecks.
          </p>
        </div>
      </div>
    </div>
  );
}
