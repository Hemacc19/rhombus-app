import React, { useState } from 'react';
import Header from './components/Header';
import FileExplorer from './components/FileExplorer';
import TransformationTabs from './components/TransformationTabs';
import NLRegexForm from './components/NLRegexForm';
import EntityExtractorForm from './components/EntityExtractorForm';
import PiiMaskerForm from './components/PiiMaskerForm';
import JobStatusTracker from './components/JobStatusTracker';
import DataTable from './components/DataTable';
import ObservabilityModal from './components/ObservabilityModal';
import LoginModal from './components/LoginModal';
import ReDosTestModal from './components/ReDosTestModal';
import JvmMetricsModal from './components/JvmMetricsModal';
import { submitJob } from './services/api';
import { Sparkles, Layers, ShieldCheck, Cpu, ChevronUp, Lock, Activity, ChevronLeft } from 'lucide-react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [activeTab, setActiveTab] = useState('NL_REGEX_REPLACE');
  const [currentStep, setCurrentStep] = useState(1);
  
  const [activeJobId, setActiveJobId] = useState(null);
  const [completedJob, setCompletedJob] = useState(null);
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [isObservabilityOpen, setIsObservabilityOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isReDosOpen, setIsReDosOpen] = useState(false);
  const [isJvmOpen, setIsJvmOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);

  const handleFilePreviewLoaded = (preview) => {
    if (preview && preview.columns) {
      setAvailableColumns(preview.columns);
    }
  };

  const handleJobSubmit = async (payload) => {
    setJobSubmitting(true);
    setCompletedJob(null);
    try {
      const res = await submitJob(payload);
      setActiveJobId(res.job_id);
      setCurrentStep(3);
    } catch (err) {
      console.error("Job submit error", err);
      alert(err.response?.data?.error || "Failed to submit job. Check server connection.");
    } finally {
      setJobSubmitting(false);
    }
  };

  const handleJobCompleted = (jobData) => {
    setCompletedJob(jobData);
  };

  return (
    <>
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      <div className="min-h-screen text-slate-100 font-sans pb-16 flex flex-col relative overflow-x-hidden z-10">
      
      {/* Top Header Navigation */}
      <Header
        onOpenObservability={() => setIsObservabilityOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => setCurrentUser(null)}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full space-y-6">

        {/* Enterprise Hero Banner Section */}
        {showBanner && (
          <div className="relative rounded-[2rem] overflow-hidden glass-panel-ultra shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] animate-slide-up group glowing-border p-[1px]">
            <div className="absolute inset-0 bg-slate-900/60 rounded-[2rem] z-10" />
            <img
              src="/hero_banner.jpg"
              alt="Rhombus Data Platform Banner"
              className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 object-cover object-right opacity-30 group-hover:scale-105 transition-all duration-700 pointer-events-none rounded-[2rem]"
              onError={(e) => { e.target.style.display = 'none'; }}
            />

            <div className="relative z-20 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Distributed PySpark 3.5 Engine</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  AI-Powered <br />
                  <span className="bg-gradient-to-r from-fuchsia-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    Distributed Data Processing Platform
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Transform millions of rows across PySpark partitions using natural language. 
                  Guarded against ReDoS vulnerabilities with Redis prompt caching and Celery task execution.
                </p>

                {/* Interactive Clickable Feature Chips */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsObservabilityOpen(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Dynamic Partitions</span>
                  </button>
                  <button
                    onClick={() => setIsReDosOpen(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>ReDoS AST Guard (Test Live)</span>
                  </button>
                  <button
                    onClick={() => setIsJvmOpen(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>Multi-Core JVM Speed (View Specs)</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowBanner(false)}
                className="self-end lg:self-start p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                title="Hide Banner"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Workspace Layout Grid */}
        {!currentUser ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center space-y-5 backdrop-blur-md max-w-2xl mx-auto mt-12 shadow-2xl animate-slide-up">
            <div className="h-20 w-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">401 Unauthorized Access</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                You must be authenticated to access the Enterprise Data Platform workspace. <br/><br/>
                Please click the <strong className="text-white">Login</strong> button in the top right corner to securely authenticate your session.
              </p>
            </div>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition active:scale-95"
            >
              Open Login Portal
            </button>
          </div>
        ) : (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
          
          {/* Step Indicator */}
          <div className="relative mb-12 pt-6">
            {/* Connecting Line Background */}
            <div className="absolute top-[2.25rem] left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden shadow-inner hidden sm:block">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-emerald-500 transition-all duration-700 ease-in-out"
                style={{ width: currentStep === 1 ? '15%' : currentStep === 2 ? '50%' : '100%' }}
              ></div>
            </div>

            {/* Steps Container */}
            <div className="relative flex justify-between w-full max-w-2xl mx-auto px-4 z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all duration-500 bg-slate-950 ${
                  currentStep >= 1 
                  ? 'border-blue-500 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.5)] rotate-45 scale-110' 
                  : 'border-slate-800 text-slate-600 rotate-0'
                }`}>
                  <div className={`${currentStep >= 1 ? '-rotate-45' : 'rotate-0'} transition-transform duration-500`}>
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className={`mt-5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${currentStep >= 1 ? 'text-blue-400 drop-shadow-md' : 'text-slate-600'}`}>
                  Data Source
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all duration-500 bg-slate-950 ${
                  currentStep >= 2 
                  ? 'border-fuchsia-500 text-fuchsia-400 shadow-[0_0_25px_rgba(217,70,239,0.5)] rotate-45 scale-110' 
                  : 'border-slate-800 text-slate-600 rotate-0'
                }`}>
                  <div className={`${currentStep >= 2 ? '-rotate-45' : 'rotate-0'} transition-transform duration-500`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>
                <div className={`mt-5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${currentStep >= 2 ? 'text-fuchsia-400 drop-shadow-md' : 'text-slate-600'}`}>
                  Pipeline Config
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all duration-500 bg-slate-950 ${
                  currentStep >= 3 
                  ? 'border-emerald-500 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] rotate-45 scale-110' 
                  : 'border-slate-800 text-slate-600 rotate-0'
                }`}>
                  <div className={`${currentStep >= 3 ? '-rotate-45' : 'rotate-0'} transition-transform duration-500`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className={`mt-5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${currentStep >= 3 ? 'text-emerald-400 drop-shadow-md' : 'text-slate-600'}`}>
                  Execution Results
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: Select Source */}
          {currentStep === 1 && (
            <div className="flex flex-col space-y-6 animate-slide-up">
              <div className="w-full space-y-6">
                {/* Live Cluster Health Widget */}
                <div className="bg-[#0b1120] border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden group font-mono">
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(6, 182, 212, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity duration-700">
                    <Cpu className="w-32 h-32 text-cyan-500" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-5 relative z-10 border-b border-cyan-900/50 pb-3">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      <span>SPARK CLUSTER TERMINAL [ONLINE]</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] text-cyan-500/70">
                      <span>SYS.OP.NORMAL</span>
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-sm h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <div className="bg-cyan-950/20 p-4 border border-cyan-900/30 rounded-sm">
                      <div className="flex justify-between text-[11px] mb-2 uppercase text-cyan-500/70">
                        <span>Master Memory</span>
                        <span className="text-cyan-300">4.2GB / 16GB</span>
                      </div>
                      <div className="h-2 w-full bg-[#040814] border border-cyan-900/50 p-[1px]">
                        <div className="h-full bg-cyan-500 w-[26%] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                      </div>
                    </div>
                    
                    <div className="bg-cyan-950/20 p-4 border border-cyan-900/30 rounded-sm">
                      <div className="flex justify-between text-[11px] mb-2 uppercase text-cyan-500/70">
                        <span>Worker CPU Load</span>
                        <span className="text-cyan-300">12%</span>
                      </div>
                      <div className="h-2 w-full bg-[#040814] border border-cyan-900/50 p-[1px]">
                        <div className="h-full bg-cyan-500 w-[12%] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-cyan-600 pt-4 mt-3 border-t border-cyan-900/30 relative z-10">
                    <span>> WORKER_NODES: <strong className="text-cyan-400">3</strong></span>
                    <span>> TASKS_QUEUED: <strong className="text-cyan-400">0</strong></span>
                    <span className="animate-pulse">> _</span>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-6">
                <FileExplorer
                  selectedFile={selectedFile}
                  onSelectFile={(file) => {
                    setSelectedFile(file);
                    setAvailableColumns([]); // Instantly clear old columns so they don't leak into Next step
                  }}
                  onFilePreviewLoaded={handleFilePreviewLoaded}
                />
                <div className="flex justify-end pt-2">
                  <button 
                    disabled={!selectedFile || availableColumns.length === 0}
                    onClick={() => setCurrentStep(2)}
                    className="glowing-border relative group px-10 py-4 rounded-2xl font-extrabold text-white bg-slate-900/80 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)] backdrop-blur-md transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative flex items-center justify-center space-x-3">
                      <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="tracking-widest uppercase text-sm bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent group-hover:text-white transition-colors duration-300">
                        Design Transformation
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Configure */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-slide-up max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex justify-between items-center bg-slate-900 p-4 sm:px-6 sm:py-4 rounded-xl border border-slate-700/80 shadow-sm">
                  
                  <button 
                    onClick={() => setCurrentStep(1)} 
                    className="group/btn flex items-center space-x-2 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold uppercase tracking-widest transition-all duration-200 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors" /> 
                    <span>Back to Data Source</span>
                  </button>
                  
                  <div className="flex items-center space-x-3 text-xs sm:text-sm">
                    <span className="hidden sm:inline text-slate-500 font-semibold tracking-widest uppercase text-[10px]">Active Dataset</span>
                    <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="font-semibold text-slate-200 font-mono tracking-tight">{selectedFile}</span>
                    </div>
                  </div>
                </div>
              </div>

              <TransformationTabs
                activeTab={activeTab}
                onChangeTab={setActiveTab}
              />

              <div className="pt-2">
                {activeTab === 'NL_REGEX_REPLACE' && (
                  <NLRegexForm
                    availableColumns={availableColumns}
                    fileKey={selectedFile}
                    onSubmitJob={handleJobSubmit}
                    loading={jobSubmitting}
                  />
                )}

                {activeTab === 'ENTITY_EXTRACTION' && (
                  <EntityExtractorForm
                    availableColumns={availableColumns}
                    fileKey={selectedFile}
                    onSubmitJob={handleJobSubmit}
                    loading={jobSubmitting}
                  />
                )}

                {activeTab === 'PII_MASKING' && (
                  <PiiMaskerForm
                    availableColumns={availableColumns}
                    fileKey={selectedFile}
                    onSubmitJob={handleJobSubmit}
                    loading={jobSubmitting}
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Results */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  className="text-slate-400 hover:text-white text-sm font-semibold flex items-center space-x-1.5 transition"
                  disabled={activeJobId && !completedJob}
                >
                  <ChevronLeft className="w-4 h-4"/> 
                  <span>Back to Configuration</span>
                </button>
                <button 
                  onClick={() => { setCurrentStep(1); setCompletedJob(null); setActiveJobId(null); setSelectedFile(null); }} 
                  className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 font-bold text-sm border border-emerald-500/30 transition active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  Start New Transformation
                </button>
              </div>

              {activeJobId && (
                <JobStatusTracker
                  activeJobId={activeJobId}
                  onJobCompleted={handleJobCompleted}
                />
              )}

              <DataTable completedJob={completedJob} />
            </div>
          )}

        </div>
        )}

      </main>

      {/* Observability & Metrics Modal */}
      <ObservabilityModal
        isOpen={isObservabilityOpen}
        onClose={() => setIsObservabilityOpen(false)}
      />

      {/* User Login & Profile Modal */}
      <LoginModal
        isOpen={isLoginOpen || !currentUser}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={setCurrentUser}
        currentUser={currentUser}
      />

      {/* ReDoS Live Testing Modal */}
      <ReDosTestModal
        isOpen={isReDosOpen}
        onClose={() => setIsReDosOpen(false)}
      />

      {/* Multi-Core JVM Performance Metrics Modal */}
      <JvmMetricsModal
        isOpen={isJvmOpen}
        onClose={() => setIsJvmOpen(false)}
      />
      </div>
    </>
  );
}
