import React, { useState, useEffect } from 'react';
import { Sparkles, Code, CheckSquare, Square, RefreshCw, Zap } from 'lucide-react';
import { previewLLM } from '../services/api';
import RegexSafetyBadge from './RegexSafetyBadge';

export default function NLRegexForm({ availableColumns, fileKey, onSubmitJob, loading }) {
  const [prompt, setPrompt] = useState("");
  const [replacement, setReplacement] = useState("REDACTED");
  const [selectedCols, setSelectedCols] = useState([]);
  
  const [llmPreview, setLlmPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setSelectedCols([]);
    setPrompt("");
  }, [availableColumns, fileKey]);

  const handleTemplateClick = (templatePrompt, templateReplacement) => {
    setPrompt(templatePrompt);
    if (templateReplacement) setReplacement(templateReplacement);
    triggerLLMPreview(templatePrompt);
  };

  const triggerLLMPreview = async (customPrompt = prompt) => {
    if (!customPrompt.trim()) return;
    setPreviewLoading(true);
    try {
      const res = await previewLLM(customPrompt, 'NL_REGEX_REPLACE');
      setLlmPreview(res);
      if (res.replacement_suggestion && !replacement) {
        setReplacement(res.replacement_suggestion);
      }
    } catch (err) {
      console.error("Failed to generate LLM regex preview", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleColumn = (col) => {
    setSelectedCols(prev => {
      return prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col];
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileKey) {
      alert("Please select a file from S3 first.");
      return;
    }
    if (selectedCols.length === 0) {
      alert("Please select at least one target column.");
      return;
    }
    onSubmitJob({
      job_type: 'NL_REGEX_REPLACE',
      s3_file_key: fileKey,
      natural_language_prompt: prompt,
      replacement_value: replacement,
      target_columns: selectedCols,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Natural Language Regex Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">AI-Powered Pattern Matching</p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
          Async PySpark Task
        </span>
      </div>

      {/* Quick Prompt Templates */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-slate-500" />
          <span>Quick Templates</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {availableColumns.length === 0 ? (
            <div className="w-full p-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 text-center">
              <span className="text-xs text-slate-500">Select a file first to view contextual templates.</span>
            </div>
          ) : (
            availableColumns.map(col => {
              let action = "Mask";
              let icon = "✨";
              let replaceVal = "[REDACTED]";
              const c = col.toLowerCase();
              
              if (c.includes('email')) { icon = "📧"; action = "Find emails in"; }
              else if (c.includes('phone') || c.includes('contact')) { icon = "📞"; action = "Mask phone numbers in"; replaceVal = "[PHONE_REDACTED]"; }
              else if (c.includes('ssn') || c.includes('social')) { icon = "🛡️"; action = "Redact SSNs in"; replaceVal = "XXX-XX-XXXX"; }
              else if (c.includes('card') || c.includes('credit')) { icon = "💳"; action = "Mask credit cards in"; replaceVal = "[CARD_REDACTED]"; }
              else if (c.includes('date') || c.includes('dob')) { icon = "📅"; action = "Format dates in"; replaceVal = "YYYY-MM-DD"; }
              else if (c.includes('amount') || c.includes('salary') || c.includes('price')) { icon = "💲"; action = "Anonymize currency in"; replaceVal = "$0.00"; }
              else if (c.includes('ip')) { icon = "🌐"; action = "Mask IP addresses in"; replaceVal = "0.0.0.0"; }
              else if (c.includes('zip') || c.includes('postal')) { icon = "📍"; action = "Extract zip codes from"; replaceVal = "MATCHED_ZIP"; }
              else if (c.includes('wallet') || c.includes('crypto') || c.includes('btc') || c.includes('hash')) { icon = "🪙"; action = "Extract wallet addresses from"; replaceVal = "MATCHED_WALLET"; }
              else if (c.includes('id') || c.includes('number') || c.includes('code')) { icon = "🔢"; action = "Extract numbers from"; replaceVal = "MATCHED_NUM"; }
              else { icon = "⚡"; action = "Extract keywords from"; replaceVal = "MATCHED_VAL"; }

              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    handleTemplateClick(`${action} the ${col} column`, replaceVal);
                    setSelectedCols([col]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
                >
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium text-slate-300">
                    {action} <span className="font-semibold text-slate-100">{col}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Prompt Input Box */}
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400">Natural Language Prompt</label>
          <button
            type="button"
            onClick={() => triggerLLMPreview()}
            disabled={previewLoading}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
            <span>{previewLoading ? 'Generating...' : 'Live Regex Preview'}</span>
          </button>
        </div>
        <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={availableColumns.length > 0 ? `e.g. 'find specific values in ${availableColumns[0]}'` : "Select a file to see suggestions"}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
        />
      </div>

      {/* Replacement Value & Target Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Replacement Expression</label>
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="e.g. REDACTED, XXX-XX-XXXX"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Target Partitions (Columns)</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-sm custom-scrollbar">
            {availableColumns.length === 0 ? (
              <span className="text-xs text-slate-500 p-1">No columns detected.</span>
            ) : (
              availableColumns.map((col) => {
                const isChecked = selectedCols.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleColumn(col)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      isChecked
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isChecked ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>{col}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* LLM Regex Pattern Preview & ReDoS Safety Badge */}
      {llmPreview && (
        <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Generated Regex Signature</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
              Provider: {llmPreview.provider_used} {llmPreview.cached ? '(Cache Hit)' : ''}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-700 font-mono text-sm text-blue-300 overflow-x-auto">
            {llmPreview.regex_pattern || "No pattern generated"}
          </div>

          <RegexSafetyBadge
            isSafe={llmPreview.is_safe}
            isValid={llmPreview.is_valid}
            error={llmPreview.validation_error}
            pattern={llmPreview.regex_pattern}
          />
        </div>
      )}

      {/* Submit Job Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 shadow-sm"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        <span>{loading ? "Dispatching Task..." : "Execute Transformation"}</span>
      </button>
    </form>
  );
}
