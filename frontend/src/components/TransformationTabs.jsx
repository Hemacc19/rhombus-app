import React from 'react';
import { Sparkles, ScanText, ShieldAlert } from 'lucide-react';

export default function TransformationTabs({ activeTab, onChangeTab }) {
  const tabs = [
    {
      id: 'NL_REGEX_REPLACE',
      label: '1. NL Regex Replace',
      badge: 'Core Requirement',
      icon: Sparkles,
      desc: 'Convert Natural Language to Regex & replace matches across PySpark partitions.'
    },
    {
      id: 'ENTITY_EXTRACTION',
      label: '2. Smart Entity Extractor',
      badge: 'Creative LLM #1',
      icon: ScanText,
      desc: 'Extract domain names, area codes, years, or structured patterns into new columns.'
    },
    {
      id: 'PII_MASKING',
      label: '3. PII Redaction Suite',
      badge: 'Creative LLM #2',
      icon: ShieldAlert,
      desc: 'Mask SSNs, Credit Cards, and Sensitive Data with dynamic regex patterns.'
    }
  ];

  return (
    <div className="flex flex-col gap-3 mb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`group flex items-center justify-between text-left rounded-2xl border transition-all duration-500 ease-out overflow-hidden transform-gpu ${
              isActive
                ? 'p-5 bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-100 ring-1 ring-blue-500/30 opacity-100'
                : 'p-4 bg-slate-900 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800 scale-[0.98] opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center space-x-4 relative z-10 w-full">
              {/* Icon Container */}
              <div className={`p-3 rounded-xl transition-all duration-500 ${
                isActive 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-inner scale-110' 
                : 'bg-slate-800 text-slate-400 group-hover:text-slate-300 scale-100'
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'animate-pulse' : ''}`} />
              </div>
              
              {/* Text Info */}
              <div className="flex-1">
                <div className="flex justify-between items-center w-full">
                  <h3 className={`font-semibold tracking-wide transition-all duration-500 ${
                    isActive 
                    ? 'text-base text-blue-300 translate-x-1' 
                    : 'text-sm text-slate-300 group-hover:text-white translate-x-0'
                  }`}>
                    {tab.label}
                  </h3>
                  
                  {/* Badge (moves to right when inactive on desktop) */}
                  <div className={`transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 hidden sm:block group-hover:opacity-100'}`}>
                    <span className={`text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-lg border ${
                      isActive 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  </div>
                </div>

                {/* Animated Description Collapse */}
                <div className={`grid transition-all duration-500 ease-in-out ${
                  isActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}>
                  <p className="overflow-hidden text-xs font-medium max-w-md leading-relaxed text-blue-200/70">
                    {tab.desc}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
