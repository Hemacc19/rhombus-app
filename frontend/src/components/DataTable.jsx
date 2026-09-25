import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, FileSpreadsheet, Search, Sparkles, Download } from 'lucide-react';
import { fetchJobResults } from '../services/api';

export default function DataTable({ completedJob }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const loadResults = async (p = page, l = limit) => {
    if (!completedJob) return;
    setLoading(true);
    try {
      const res = await fetchJobResults(completedJob.id, p, l);
      setData(res);
    } catch (err) {
      console.error("Failed to load job results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadResults(1, limit);
  }, [completedJob, limit]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadResults(newPage, limit);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleExportCSV = async () => {
    if (!completedJob) return;
    try {
      // Fetch ALL rows (-1 limit) instead of just the current page
      const fullData = await fetchJobResults(completedJob.id, 1, -1);
      if (!fullData || !fullData.rows) return;
      
      const headers = fullData.columns.join(',');
      const rowsCSV = fullData.rows.map(row => 
        fullData.columns.map(col => `"${String(row[col]).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([`${headers}\n${rowsCSV}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `transformed_full_${completedJob.id.slice(0, 8)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export full CSV", err);
      alert("Failed to export full file.");
    }
  };

  if (!completedJob) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 space-y-3 backdrop-blur-md">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-600">
          <FileSpreadsheet className="w-6 h-6 opacity-60" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-300">No Processed Results Loaded</h4>
          <p className="text-xs text-slate-500 mt-1">Select an S3 dataset, submit a transformation, and view results here.</p>
        </div>
      </div>
    );
  }

  const filteredRows = data?.rows?.filter(row => {
    if (!tableSearch) return true;
    return Object.values(row).some(val => String(val).toLowerCase().includes(tableSearch.toLowerCase()));
  }) || [];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-sm animate-slide-up">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-6 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center space-x-3">
              <span>PySpark Processed Output</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md font-medium border border-emerald-500/20">
                Paginated S3 Stream
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Applied Pattern: <code className="text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded ml-1 font-mono">{completedJob.generated_regex}</code>
            </p>
          </div>
        </div>

        {data && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Download Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition-all active:scale-95"
              title="Download Transformed Dataset as CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* Page Size Selector */}
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span>Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value={15}>15 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={-1}>All rows</option>
              </select>
            </div>

            <div className="relative">
              <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg focus-within:border-blue-500 transition-colors">
                <Search className="w-4 h-4 absolute left-3 text-slate-500" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search rows..."
                  className="bg-transparent pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-48"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-700/50 rounded-xl bg-slate-950">
        {loading ? (
          <div className="py-24 text-center text-xs font-medium text-blue-400 space-y-4">
            <Sparkles className="w-6 h-6 mx-auto animate-spin text-blue-400" />
            <span className="block animate-pulse">Fetching dataset slice from Spark cluster...</span>
          </div>
        ) : !data || filteredRows.length === 0 ? (
          <div className="py-24 text-center text-xs text-slate-500">No matching rows found in current partition layer.</div>
        ) : (
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold sticky top-0">
              <tr>
                {data.columns.map((col) => {
                  const isTarget = completedJob.target_columns?.includes(col) || col.endsWith('_extracted');
                  return (
                    <th key={col} className={`px-5 py-3 ${isTarget ? 'text-blue-400 bg-blue-900/10' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <span>{col}</span>
                        {isTarget && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {filteredRows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-slate-900/50 transition-colors duration-150 text-slate-300 animate-slide-up"
                  style={{ animationDelay: `${idx * 0.02}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  {data.columns.map((col) => {
                    const val = String(row[col]);
                    const isTarget = completedJob.target_columns?.includes(col) || col.endsWith('_extracted');
                    const isReplaced = isTarget && (val.includes('REDACTED') || val.includes('MASKED') || val.includes('XXX') || col.endsWith('_extracted'));

                    return (
                      <td key={col} className={`px-5 py-2.5 truncate max-w-sm ${isTarget ? 'bg-blue-900/5' : ''}`}>
                        {isReplaced ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                            {val}
                          </span>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {data && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-4">
          <span className="text-xs text-slate-400">
            Page <strong className="text-slate-200">{data.page}</strong> of <strong className="text-slate-200">{data.total_pages}</strong> 
            <span className="mx-2 text-slate-600">•</span> 
            Viewing {data.rows.length} of <strong className="text-slate-200">{data.total_rows.toLocaleString()}</strong> rows
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 text-slate-300 transition-colors text-xs font-medium flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.total_pages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 text-slate-300 transition-colors text-xs font-medium flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
