import React from 'react';
import { Zap, Lock, Video, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Features() {
  const featureList = [
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Lightning Fast Streaming',
      description: 'Extract and save Instagram Reels in seconds with our optimized backend resolution engine.'
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      title: '100% Anonymous & Free',
      description: 'No account registration, no login, no cookies. Paste link and download instantly.'
    },
    {
      icon: <Video className="w-6 h-6 text-pink-400" />,
      title: 'Full HD Quality MP4',
      description: 'Get original crisp high-definition video format directly from Instagram servers.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-400" />,
      title: 'Works Anywhere',
      description: 'Fully responsive for iPhone, Android, iPad, Mac, Windows, and Linux browsers.'
    }
  ];

  return (
    <section id="features" className="w-full max-w-5xl mx-auto mt-20 px-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Why Use <span className="text-gradient-instagram">ReelGrab</span>?
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
          The cleanest, most reliable way to save your favorite public Instagram video content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featureList.map((feat, idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {feat.icon}
            </div>
            <h3 className="font-bold text-white text-base mb-1.5">{feat.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
