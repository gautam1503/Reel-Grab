import React from 'react';
import { Film, Sparkles, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-instagram p-0.5 shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-pink-500 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-gradient-instagram">
                ReelGrab
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-md uppercase tracking-wider">
                v1.0
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Fast Instagram Reel Downloader</span>
          </div>
        </a>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free & Secure</span>
          </div>

          <a
            href="#features"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            How it works
          </a>
        </div>
      </div>
    </header>
  );
}
