import React from 'react';
import { ShieldAlert, Heart } from 'lucide-react';

export default function Disclaimer() {
  return (
    <footer className="w-full mt-24 border-t border-slate-900 bg-slate-950/80 py-10">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Legal Disclaimer & Usage Terms</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mx-auto">
          ReelGrab is an independent web utility designed to process publicly accessible media links. 
          ReelGrab is not affiliated with, endorsed by, or associated with Instagram, Meta Platforms, Inc., 
          or any of their subsidiaries. All Instagram™ trademarks, logos, and brand names are the property 
          of their respective owners. We do not store, host, or cache downloaded media files on our servers.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <span>&copy; {new Date().getFullYear()} ReelGrab. All rights reserved.</span>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />
            <span>for seamless video downloads</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
