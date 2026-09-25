import React from 'react';
import { Activity, Database, ShieldCheck, Zap, Sparkles, LogIn, FileCode2, LogOut } from 'lucide-react';

export default function Header({ onOpenObservability, onOpenLogin, onLogout, currentUser }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-400 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse-glow" />
            <div className="relative h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800">
              <Sparkles className="h-5 w-5 text-fuchsia-400 fill-fuchsia-400/20 animate-float" />
            </div>
          </div>

          <div className="pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-lg">
                Rhombus <span className="font-light opacity-90">Enterprise Engine</span>
              </h1>
              <span className="inline-flex items-center mt-1 sm:mt-0 px-3 py-1 text-[10px] sm:text-xs font-black tracking-widest text-fuchsia-300 uppercase bg-fuchsia-950/50 rounded-lg border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                <Zap className="w-3 h-3 mr-1.5 text-fuchsia-400 animate-pulse" />
                PySpark 3.5 + Celery
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
              Distributed <span className="text-blue-400">NL-to-Regex</span> Data Transformation Platform
            </p>
          </div>
        </div>

        {/* Navigation & Swagger API Button */}
        <div className="flex items-center space-x-2.5">
          {/* Interactive Swagger Docs Link */}
          <a
            href="http://localhost:8000/api/swagger/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-400 transition hover:border-emerald-500/40 active:scale-95"
            title="Open Interactive Swagger API Documentation"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Swagger Docs</span>
          </a>

          <button
            onClick={onOpenObservability}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-xs font-semibold text-slate-200 active:scale-95"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Observability</span>
          </button>

          {/* User Profile / Login Button */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 transition"
                title="Click to Switch User / Account"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.avatar}
                </div>
                <span className="hidden md:inline">{currentUser.name}</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-transparent hover:bg-slate-800/80 border border-transparent hover:border-slate-700 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-all active:scale-95"
                title="Securely Logout"
              >
                <LogOut className="w-3.5 h-3.5 opacity-70" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition text-xs font-semibold text-white shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
