import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, StopCircle, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';
import { fetchJobStatus, cancelJob } from '../services/api';

export default function JobStatusTracker({ activeJobId, onJobCompleted }) {
  const [job, setJob] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!activeJobId) return;

    let interval = null;

    const pollStatus = async () => {
      try {
        const res = await fetchJobStatus(activeJobId);
        setJob(res);

        if (res.status === 'SUCCESS') {
          if (onJobCompleted) onJobCompleted(res);
          clearInterval(interval);
        } else if (['FAILED', 'CANCELLED'].includes(res.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Status poll error", err);
      }
    };

    pollStatus();
    interval = setInterval(pollStatus, 1000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  if (!job) return null;

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this job?")) return;
    setCancelling(true);
    try {
      await cancelJob(job.id);
    } catch (err) {
      console.error("Cancel failed", err);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>QUEUED</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>RUNNING ({job.progress}%)</span>
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUCCESS (100%)</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 shadow-sm">
            <StopCircle className="w-3.5 h-3.5" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-slide-up mb-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-lg border transition-all duration-500 ${job.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
              <Activity className={`w-5 h-5 ${job.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
                <span>Live Job Execution Tracker</span>
                <span className="text-slate-500 text-xs font-mono">[{job.id.slice(0, 8)}]</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 transition-opacity duration-300">
                {job.job_type_display} • File: <code className="text-blue-300 bg-slate-950 px-1 py-0.5 rounded font-mono">{job.s3_file_key}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`transition-all duration-500 ${job.status === 'RUNNING' ? 'scale-105' : 'scale-100'}`}>
              {getStatusBadge(job.status)}
            </div>

            {['QUEUED', 'RUNNING'].includes(job.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all active:scale-95 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              >
                <StopCircle className={`w-3.5 h-3.5 ${cancelling ? 'animate-spin' : ''}`} />
                <span>{cancelling ? 'Aborting...' : 'Abort'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar with Shimmer Effect */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Zap className={`w-4 h-4 ${job.status === 'RUNNING' ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Distributed Execution Progress</span>
            </span>
            <span className={`font-mono font-semibold transition-colors duration-300 ${job.status === 'SUCCESS' ? 'text-emerald-400' : 'text-blue-400'}`}>{job.progress}%</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
            <div
              className={`h-full transition-all duration-700 ease-out relative overflow-hidden ${
                job.status === 'SUCCESS'
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : job.status === 'FAILED'
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              }`}
              style={{ width: `${Math.max(2, job.progress)}%` }}
            >
              {job.status === 'RUNNING' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Spark Metrics Display on Success */}
        {job.status === 'SUCCESS' && (
          <div className="grid grid-cols-3 gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 animate-slide-up">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Rows Processed</span>
              <span className="text-lg font-bold text-slate-100 font-mono">
                {job.total_rows > 0 ? job.total_rows.toLocaleString() : "N/A"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">PySpark Partitions</span>
              <span className="text-lg font-bold text-blue-400 font-mono flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>{job.partition_count}</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Execution Speed</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{job.execution_time_seconds}s</span>
            </div>
          </div>
        )}

        {/* Error Message Box */}
        {job.error_message && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <span className="font-semibold block mb-1">Execution Error</span>
            <span className="font-mono text-xs text-rose-200/80">{job.error_message}</span>
          </div>
        )}

        {/* Execution Timeline Logs */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Execution Timeline</span>
          <div className="max-h-48 overflow-y-auto space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800 custom-scrollbar font-mono text-[11px] leading-relaxed">
            {job.logs && job.logs.length > 0 ? (
              <div className="space-y-4">
                {job.logs.map((log, idx) => {
                  const isError = log.message.includes('Error') || log.message.includes('FAILED');
                  const isSuccess = log.message.includes('completed successfully');

                  return (
                    <div key={log.id || idx} className="flex space-x-3 text-xs animate-slide-up" style={{ animationDelay: `${idx * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}>
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1 ${isError ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : isSuccess ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-blue-500'}`} />
                        {idx !== job.logs.length - 1 && (
                          <div className="w-px h-full bg-slate-800 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-slate-500 font-mono">[{log.timestamp_formatted}]</span>
                          <span className="text-slate-400 font-mono">({String(log.progress).padStart(3, ' ')}%)</span>
                        </div>
                        <p className={`${isError ? 'text-rose-400 font-semibold' : isSuccess ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
                          {log.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-500 font-medium">Initializing Celery background process...</span>
            )}
          </div>
        </div>
    </div>
  );
}
