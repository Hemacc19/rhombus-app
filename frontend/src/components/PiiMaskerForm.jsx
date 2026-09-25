import React, { useState } from 'react';
import { ShieldAlert, Zap, CheckSquare, Square } from 'lucide-react';

export default function PiiMaskerForm({ availableColumns, fileKey, onSubmitJob, loading }) {
  const [prompt, setPrompt] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);

  React.useEffect(() => {
    setSelectedCols([]);
    if (availableColumns && availableColumns.length > 0) {
      const firstCol = availableColumns[0];
      setPrompt(`mask sensitive data in ${firstCol}`);
    } else {
      setPrompt("");
    }
  }, [availableColumns, fileKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileKey) return alert("Select a file first.");
    if (selectedCols.length === 0) return alert("Select target columns.");

    onSubmitJob({
      job_type: 'PII_MASKING',
      s3_file_key: fileKey,
      natural_language_prompt: prompt,
      replacement_value: 'XXX-XX-$1',
      target_columns: selectedCols,
    });
  };

  const toggleColumn = (col) => {
    setSelectedCols(prev => {
      const next = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col];
      if (next.length > 0) {
        setPrompt(`mask sensitive data in ${next.join(' and ')}`);
      } else if (availableColumns.length > 0) {
        setPrompt(`mask sensitive data in ${availableColumns[0]}`);
      }
      return next;
    });
  };

  const handleTemplateClick = (templatePrompt) => {
    setPrompt(templatePrompt);
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-slate-950 border-2 border-rose-900/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 overflow-hidden">
      
      {/* Security Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#f43f5e 1px, transparent 1px), linear-gradient(90deg, #f43f5e 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-900/30 pb-5 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-rose-950 border border-rose-500/30 text-rose-400 relative">
            <div className="absolute inset-0 bg-rose-500/20 animate-pulse rounded-xl blur-md"></div>
            <ShieldAlert className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight flex items-center space-x-2">
              <span>PII Masker</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono border border-rose-500/20">v2.0</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">SECURE_DATA_ANONYMIZATION_PROTOCOL</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-950 px-3 py-1.5 rounded-lg border border-rose-500/30 flex items-center space-x-2 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          <span>SYSTEM ACTIVE</span>
        </span>
      </div>

      {/* Quick Prompt Templates */}
      <div className="space-y-3 relative z-10">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Inject Templates</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {availableColumns.length === 0 ? (
            <div className="w-full p-4 rounded-xl border border-dashed border-rose-900/50 bg-rose-950/20 text-center">
              <span className="text-xs font-mono text-rose-500/70">AWAITING_DATASET_CONTEXT...</span>
            </div>
          ) : (
            availableColumns.map(col => {
              let action = "Mask";
              let icon = "🛡️";
              const c = col.toLowerCase();
              
              if (c.includes('email')) { icon = "📧"; action = "Mask domains in"; }
              else if (c.includes('phone') || c.includes('contact')) { icon = "📞"; action = "Mask first 6 digits of"; }
              else if (c.includes('ssn') || c.includes('social')) { icon = "🔒"; action = "Mask first 5 digits of"; }
              else if (c.includes('name') || c.includes('ceo')) { icon = "👤"; action = "Anonymize full"; }
              else if (c.includes('card') || c.includes('credit')) { icon = "💳"; action = "Mask all but last 4 of"; }
              else if (c.includes('date') || c.includes('dob')) { icon = "📅"; action = "Remove birth day from"; }
              else { icon = "⚡"; action = "Anonymize data in"; }

              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    handleTemplateClick(`${action.toLowerCase()} ${col}`);
                    setSelectedCols([col]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-500 hover:bg-rose-950 transition-all flex items-center space-x-2 group"
                >
                  <span className="text-sm opacity-70 group-hover:opacity-100">{icon}</span>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-rose-300">
                    {action} <span className="font-bold text-slate-200 group-hover:text-rose-100">{col}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Prompt Input Box */}
      <div className="space-y-2 relative z-10">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Natural Language Prompt</label>
        <div className="relative">
          <div className="absolute left-3 top-3 text-rose-500/50">
            <Zap className="w-4 h-4" />
          </div>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={availableColumns.length > 0 ? `e.g. 'mask sensitive data in ${availableColumns[0]}'` : "Select a file to see suggestions"}
            className="w-full bg-[#0a0a0a] border border-rose-900/50 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-rose-100 placeholder-rose-900/50 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Target Columns */}
      <div className="space-y-2 relative z-10">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select Target Columns</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-[#0a0a0a] border border-rose-900/30 rounded-xl shadow-inner custom-scrollbar">
          {availableColumns.length === 0 ? (
            <span className="text-xs font-mono text-rose-500/50 p-1">NO_COLUMNS_DETECTED</span>
          ) : (
            availableColumns.map((col) => {
              const isChecked = selectedCols.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColumn(col)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    isChecked
                      ? 'bg-rose-600/20 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)] text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-rose-400" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{col}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Submit Job Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full relative group overflow-hidden rounded-xl bg-slate-900 border border-rose-500/50 hover:border-rose-400 transition-all p-0.5 z-10 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/0 via-rose-500/10 to-rose-900/0 group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
        <div className="w-full bg-slate-950 py-3.5 px-6 rounded-lg flex items-center justify-center space-x-2 relative z-10">
          <ShieldAlert className="w-4 h-4 text-rose-500 group-hover:animate-pulse" />
          <span className="text-rose-100 font-bold font-mono text-sm tracking-wide">
            {loading ? "SANITIZING..." : "EXECUTE REDACTION"}
          </span>
        </div>
      </button>
    </form>
  );
}
