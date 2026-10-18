import React from 'react';
import { Zap, Lock, Video, Smartphone, ClipboardPaste, PlayCircle, Download } from 'lucide-react';

const steps = [
  { icon: ClipboardPaste, title: 'Paste the link', description: 'Copy a Reel, post, YouTube video or Short and paste it in the box.' },
  { icon: PlayCircle, title: 'Preview it here', description: 'The video loads on this page so you can check it\'s the right one.' },
  { icon: Download, title: 'Download MP4', description: 'One click saves the video to your phone or computer.' }
];

const featureList = [
  { icon: <Zap className="w-5 h-5 text-amber-400" />, title: 'Fast', description: 'Videos are fetched and prepared in seconds.' },
  { icon: <Lock className="w-5 h-5 text-emerald-400" />, title: 'Private & free', description: 'No account, no login. Files are deleted from our server within minutes.' },
  { icon: <Video className="w-5 h-5 text-pink-400" />, title: 'Best quality', description: 'We grab the highest quality available, merged into one MP4.' },
  { icon: <Smartphone className="w-5 h-5 text-purple-400" />, title: 'Works everywhere', description: 'iPhone, Android, Windows, Mac — any modern browser.' }
];

export default function Features() {
  return (
    <section id="features" className="w-full max-w-5xl mx-auto mt-24 scroll-mt-24">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">How it works</h2>
        <p className="text-slate-400 text-sm sm:text-base mt-2">Three steps. No apps to install.</p>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
        {steps.map(({ icon: Icon, title, description }, idx) => (
          <li key={title} className="glass-card rounded-2xl p-5 flex gap-4 items-start">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-pink-300" />
              <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                {idx + 1}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base mb-1">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featureList.map((feat) => (
          <div key={feat.title} className="glass-card rounded-2xl p-5 hover:bg-slate-800/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
              {feat.icon}
            </div>
            <h3 className="font-bold text-white text-sm mb-1">{feat.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
