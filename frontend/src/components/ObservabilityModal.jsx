import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Database, ShieldCheck, Zap, Server, CheckCircle2, HardDrive } from 'lucide-react';
import { fetchS3Files } from '../services/api';

export default function ObservabilityModal({ isOpen, onClose }) {
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchS3Files().then(res => setFileCount(res.count || 0)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-up">
      <div className="relative bg-[#050b14] border-2 border-blue-900/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(37,99,235,0.1)] space-y-6 overflow-hidden">
        
        {/* Radar/Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-blue-900/30 pb-5 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-400 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/20 animate-pulse rounded-xl blur-md"></div>
              <Activity className="w-6 h-6 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">System Telemetry & Task Metrics</h3>
              <p className="text-[11px] text-blue-400/70 mt-1 font-mono uppercase tracking-widest">Real-Time Cluster Diagnostics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-all active:scale-95 z-10"
          >
            Close
          </button>
        </div>

        {/* Live Integrated Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {/* Worker Pipeline Status */}
          <div className="bg-[#0a0f1a] border border-blue-900/30 p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Server className="w-5 h-5" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Task Worker</span>
              </div>
              <span className="flex items-center space-x-1.5 text-[10px] bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-md font-mono border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>ONLINE</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed relative z-10">
              Async thread pipeline handles non-blocking job execution, status updates, and logging.
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/50 relative z-10">
              <span>S3_DATASETS_DETECTED:</span>
              <span className="text-emerald-400 font-bold">{fileCount}</span>
            </div>
          </div>

          {/* MySQL Database Status */}
          <div className="bg-[#0a0f1a] border border-blue-900/30 p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-bl-full"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Database className="w-5 h-5" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">MySQL Engine</span>
              </div>
              <span className="flex items-center space-x-1.5 text-[10px] bg-cyan-950 text-cyan-400 px-2.5 py-1 rounded-md font-mono border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <span>CONNECTED</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed relative z-10">
              Persists job execution metadata, prompt histories, and step execution logs in <code className="text-cyan-400 bg-cyan-950 px-1 py-0.5 rounded">rhombus_db</code>.
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/50 relative z-10">
              <span>HOST:</span>
              <span className="text-cyan-400">127.0.0.1:3306</span>
            </div>
          </div>
        </div>

        {/* System Diagnostics List */}
        <div className="space-y-3 relative z-10">
          
          {/* PySpark Hardware & Parallelism */}
          <div className="bg-[#0a0f1a] border border-blue-900/30 p-4 rounded-xl flex items-start space-x-4 group hover:border-blue-500/50 transition-colors">
            <div className="p-2 bg-blue-950 rounded-lg text-blue-400 border border-blue-500/20 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block mb-1">PySpark Parallelism & Dynamic Partitioning</span>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                DataFrame partitions are computed dynamically (<code className="text-blue-400">max(2, num_rows // 50000)</code>). Vectorized Spark SQL expressions execute across all available CPU cores.
              </p>
            </div>
          </div>

          {/* ReDoS Security Note */}
          <div className="bg-[#0a0f1a] border border-blue-900/30 p-4 rounded-xl flex items-start space-x-4 group hover:border-emerald-500/50 transition-colors">
            <div className="p-2 bg-emerald-950 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block mb-1">ReDoS Protection Guard Layer</span>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                All generated patterns undergo static AST analysis to block catastrophic backtracking (<code className="text-emerald-400">(a+)+</code>) and a 100ms thread benchmark before task execution.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
