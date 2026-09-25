import React, { useState } from 'react';
import { ScanText, Zap, CheckSquare, Square } from 'lucide-react';

export default function EntityExtractorForm({ availableColumns, fileKey, onSubmitJob, loading }) {
  const [prompt, setPrompt] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);

  React.useEffect(() => {
    setSelectedCols([]);
    if (availableColumns && availableColumns.length > 0) {
      const firstCol = availableColumns[0];
      setPrompt(`extract data from ${firstCol}`);
    } else {
      setPrompt("");
    }
  }, [availableColumns, fileKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileKey) return alert("Select a file first.");
    if (selectedCols.length === 0) return alert("Select at least one column.");

    onSubmitJob({
      job_type: 'ENTITY_EXTRACTION',
      s3_file_key: fileKey,
      natural_language_prompt: prompt,
      replacement_value: '',
      target_columns: selectedCols,
    });
  };

  const toggleColumn = (col) => {
    setSelectedCols(prev => {
      const next = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col];
      if (next.length > 0) {
        setPrompt(`extract data from ${next.join(' and ')}`);
      } else if (availableColumns.length > 0) {
        setPrompt(`extract data from ${availableColumns[0]}`);
      }
      return next;
    });
  };

  const handleTemplateClick = (templatePrompt) => {
    setPrompt(templatePrompt);
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-slate-950 border-2 border-cyan-900/40 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.05)] space-y-8 overflow-hidden">
      
      {/* Neural Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-600 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-900/40 pb-5 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <ScanText className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight flex items-center space-x-2">
              <span>Smart Entity Extractor</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">v3.0</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">NEURAL_FEATURE_EXTRACTION_ENGINE</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950 px-3 py-1.5 rounded-lg border border-cyan-500/30 flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
          <span>MODEL LOADED</span>
        </span>
      </div>

      {/* Quick Prompt Templates */}
      <div className="space-y-3 relative z-10">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Extraction Playbooks</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {availableColumns.length === 0 ? (
            <div className="w-full p-4 rounded-xl border border-dashed border-cyan-900/50 bg-cyan-950/20 text-center">
              <span className="text-xs font-mono text-cyan-500/70">AWAITING_DATASET_CONTEXT...</span>
            </div>
          ) : (
            availableColumns.map(col => {
              let action = "Extract";
              let icon = "✨";
              const c = col.toLowerCase();
              
              if (c.includes('email')) { icon = "🌐"; action = "Extract domain from"; }
              else if (c.includes('phone') || c.includes('contact')) { icon = "📞"; action = "Extract area code from"; }
              else if (c.includes('name') || c.includes('ceo')) { icon = "👤"; action = "Extract first name from"; }
              else if (c.includes('date') || c.includes('dob')) { icon = "📅"; action = "Extract year from"; }
              else if (c.includes('address') || c.includes('location')) { icon = "📍"; action = "Extract zip code from"; }
              else if (c.includes('url') || c.includes('website')) { icon = "🔗"; action = "Extract protocol from"; }
              else { icon = "⚡"; action = "Extract keywords from"; }

              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    handleTemplateClick(`${action.toLowerCase()} ${col}`);
                    setSelectedCols([col]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:bg-cyan-950 transition-all flex items-center space-x-2 group"
                >
                  <span className="text-sm opacity-70 group-hover:opacity-100">{icon}</span>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-cyan-300">
                    {action} <span className="font-bold text-slate-200 group-hover:text-cyan-100">{col}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Prompt Input Box */}
      <div className="space-y-2 relative z-10">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Natural Language Extraction Prompt</label>
        <div className="relative">
          <div className="absolute left-3 top-3 text-cyan-500/50">
            <ScanText className="w-4 h-4" />
          </div>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={availableColumns.length > 0 ? `e.g. 'extract data from ${availableColumns[0]}'` : "Select a file to see suggestions"}
            className="w-full bg-[#0a0a0a] border border-cyan-900/50 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-cyan-100 placeholder-cyan-900/50 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Target Columns */}
      <div className="space-y-2 relative z-10">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target Feature Column</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-[#0a0a0a] border border-cyan-900/30 rounded-xl shadow-inner custom-scrollbar">
          {availableColumns.length === 0 ? (
            <span className="text-xs font-mono text-cyan-500/50 p-1">NO_COLUMNS_DETECTED</span>
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
                      ? 'bg-cyan-600/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
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
        className="w-full relative group overflow-hidden rounded-xl bg-slate-900 border border-cyan-500/50 hover:border-cyan-400 transition-all p-0.5 z-10 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 via-cyan-500/10 to-cyan-900/0 group-hover:-translate-x-full translate-x-full transition-transform duration-1000 ease-in-out"></div>
        <div className="w-full bg-slate-950 py-3.5 px-6 rounded-lg flex items-center justify-center space-x-2 relative z-10">
          <ScanText className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
          <span className="text-cyan-100 font-bold font-mono text-sm tracking-wide">
            {loading ? "EXTRACTING..." : "INITIALIZE PIPELINE"}
          </span>
        </div>
      </button>
    </form>
  );
}
