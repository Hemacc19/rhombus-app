import React, { useState, useEffect } from 'react';
import { FileText, Database, RefreshCw, Eye, CheckCircle, Search, Table, Sparkles } from 'lucide-react';
import { fetchS3Files, fetchFilePreview } from '../services/api';

export default function FileExplorer({ selectedFile, onSelectFile, onFilePreviewLoaded }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewModal, setPreviewModal] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetchS3Files();
      setFiles(res.files || []);
      if (res.files && res.files.length > 0 && !selectedFile) {
        handleSelect(res.files[0].key);
      }
    } catch (err) {
      console.error("Failed to fetch S3 files", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleSelect = async (fileKey) => {
    onSelectFile(fileKey);
    try {
      const preview = await fetchFilePreview(fileKey, 1, 10);
      if (onFilePreviewLoaded) {
        onFilePreviewLoaded(preview);
      }
    } catch (err) {
      console.error("Error loading file columns", err);
    }
  };

  const openQuickPreview = async (e, fileKey) => {
    e.stopPropagation();
    setPreviewLoading(true);
    try {
      const res = await fetchFilePreview(fileKey, 1, 15);
      setPreviewModal({ fileKey, ...res });
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredFiles = files.filter(f => f.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative group p-1">
      {/* Animated Glowing Outline */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-blue-500 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-700"></div>
      
      <div className="relative bg-[#080b14]/90 border border-indigo-500/30 rounded-[2rem] p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-fuchsia-500 blur-sm opacity-50 rounded-full animate-pulse"></div>
              <div className="relative p-2.5 rounded-full bg-[#0a1024] text-fuchsia-400 border border-fuchsia-500/40">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-blue-300 uppercase tracking-widest">
                Data Lake Storage
              </h2>
              <p className="text-[10px] font-mono text-indigo-400/80">S3://rhombus-enterprise-bucket</p>
            </div>
          </div>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="p-2.5 rounded-full bg-indigo-950/50 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] active:scale-90"
            title="Scan Bucket"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Bar - Sci-Fi style */}
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 rounded-xl blur-sm"></div>
          <div className="relative flex items-center bg-[#050811] border border-indigo-500/20 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-indigo-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SCAN DATASETS..."
              className="w-full bg-transparent pl-3 text-xs font-mono text-indigo-100 placeholder-indigo-800 focus:outline-none uppercase tracking-wider"
            />
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {loading && files.length === 0 ? (
            <div className="py-10 text-center text-xs text-indigo-400 space-y-3 font-mono">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-fuchsia-400" />
              <div className="animate-pulse">Scanning Amazon S3 Quantum Bucket...</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-8 text-center text-xs text-indigo-600 font-mono uppercase">No data clusters found.</div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedFile === file.key;
              return (
                <div
                  key={file.key}
                  onClick={() => handleSelect(file.key)}
                  className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border backdrop-blur-md transition-all duration-300 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-fuchsia-500/70 shadow-[0_0_30px_rgba(217,70,239,0.3)] scale-[1.02]'
                      : 'bg-[#0a0f1d] border-indigo-900/40 hover:border-indigo-500/50 hover:bg-indigo-950/40 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center space-x-4 truncate mr-2">
                    <div className={`p-2.5 rounded-xl transition-all duration-500 ${isSelected ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] rotate-3' : 'bg-indigo-950/50 text-indigo-400 group-hover:text-indigo-300 border border-indigo-800/50'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className={`text-xs font-bold truncate block tracking-wide ${isSelected ? 'text-white' : 'text-indigo-200'}`}>
                        {file.key}
                      </span>
                      <span className="text-[10px] text-indigo-500 block font-mono mt-0.5 uppercase">
                        VOL:{file.size_formatted} // SRC:{file.source}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => openQuickPreview(e, file.key)}
                      className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-fuchsia-950/50 text-fuchsia-300 hover:bg-fuchsia-900 border border-fuchsia-500/30' : 'bg-indigo-950/50 hover:bg-indigo-900 text-indigo-400 hover:text-indigo-200 border border-indigo-800/30'}`}
                      title="Quantum Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-fuchsia-500/20">
                        <CheckCircle className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-up">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">S3 File Preview: {previewModal.fileKey}</h3>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                Close Preview
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 border border-slate-800/80 rounded-2xl bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    {previewModal.columns.map((c) => (
                      <th key={c} className="px-3 py-2.5 font-bold text-blue-300">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                  {previewModal.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 text-slate-300">
                      {previewModal.columns.map((c) => (
                        <td key={c} className="px-3 py-2 truncate max-w-xs">{String(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
