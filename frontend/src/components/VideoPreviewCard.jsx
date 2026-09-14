import React, { useState } from 'react';
import { Download, Clock, User, Check, Copy, Film, ExternalLink, Play } from 'lucide-react';

export default function VideoPreviewCard({ videoData, onDownload, isDownloading }) {
  const [copied, setCopied] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  if (!videoData) return null;

  const { title, thumbnail, durationFormatted, uploader, streamUrl, id } = videoData;

  const handleCopyLink = () => {
    if (streamUrl) {
      navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel rounded-2xl p-5 border border-slate-700/60 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Thumbnail / Video Player */}
          <div className="relative w-full md:w-48 aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 group">
            {showPlayer && streamUrl ? (
              <video
                src={streamUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <img
                  src={thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60'}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="w-12 h-12 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg shadow-pink-600/40 hover:scale-110 transition-transform cursor-pointer"
                    title="Preview Video"
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </button>
                </div>
              </>
            )}

            {durationFormatted && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-pink-400" />
                <span>{durationFormatted}</span>
              </div>
            )}
          </div>

          {/* Info & Actions */}
          <div className="flex-1 flex flex-col justify-between h-full w-full py-1">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 mb-1.5">
                <User className="w-3.5 h-3.5" />
                <span>@{uploader || 'instagram'}</span>
              </div>

              <h3 className="font-bold text-lg text-white leading-snug line-clamp-2 mb-2">
                {title}
              </h3>

              {title.includes('Seqrite') || title.includes('Quick Heal') || title.includes('Blocked') ? (
                <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                  <p className="font-bold text-amber-300 mb-1">Why am I seeing a placeholder video?</p>
                  <p>
                    Your computer’s antivirus (<strong>Seqrite Endpoint Protection / Quick Heal</strong>) is currently blocking connection attempts to <code>instagram.com</code>.
                  </p>
                  <p className="mt-1.5 font-medium text-amber-100">
                    👉 To download the <strong>ACTUAL real video</strong> from your Instagram link, add <code>www.instagram.com</code> to Allowed Sites in Quick Heal / Seqrite settings, or connect to an unblocked mobile hotspot/Wi-Fi.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/50">
                  Format: MP4 (Full HD)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  Ready to save
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onDownload}
                disabled={isDownloading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-instagram text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Saving File...' : 'Save Video File (.MP4)'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                title="Copy Direct Video Link"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Stream Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
