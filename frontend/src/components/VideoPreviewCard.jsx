import React, { useState } from 'react';
import { Download, Clock, User, CheckCircle2, Loader2, Instagram, Youtube, ExternalLink, ImageOff } from 'lucide-react';
import { mediaUrl } from '../lib/api';

const PLATFORM = {
  instagram: { label: 'Instagram', icon: Instagram, badge: 'bg-pink-500/10 text-pink-300 border-pink-500/25' },
  youtube: { label: 'YouTube', icon: Youtube, badge: 'bg-red-500/10 text-red-300 border-red-500/25' }
};

export default function VideoPreviewCard({ videoData, download, onDownload }) {
  const [playerFailed, setPlayerFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const { url, platform, title, uploader, durationFormatted, quality, width, height, hasPreview, hasThumbnail, embedUrl } = videoData;
  const meta = PLATFORM[platform] || PLATFORM.instagram;
  const PlatformIcon = meta.icon;

  // Reels, Shorts and square posts sit beside the details; widescreen videos span the card
  const isPortrait = width && height ? height >= width : platform === 'instagram';
  const playerAspect = isPortrait && width && height ? { aspectRatio: `${width} / ${height}` } : undefined;
  const thumbnailSrc = hasThumbnail && !thumbFailed ? mediaUrl('/api/thumbnail', url) : null;
  const showEmbed = Boolean(embedUrl);
  const showPlayer = !showEmbed && hasPreview && !playerFailed;

  const isWorking = download.status === 'working';
  const isDone = download.status === 'done';

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-up">
      <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className={`relative flex gap-5 ${isPortrait ? 'flex-col sm:flex-row' : 'flex-col'}`}>
          {/* Player */}
          <div
            className={`relative rounded-2xl overflow-hidden bg-black border border-white/5 shrink-0 ${
              isPortrait ? 'w-full max-w-[300px] mx-auto sm:mx-0 aspect-[9/16]' : 'w-full aspect-video'
            }`}
            style={playerAspect}
          >
            {showEmbed ? (
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full border-0"
              />
            ) : showPlayer ? (
              <video
                src={mediaUrl('/api/stream', url)}
                poster={thumbnailSrc || undefined}
                controls
                playsInline
                preload="metadata"
                onError={() => setPlayerFailed(true)}
                className="w-full h-full object-contain bg-black"
              />
            ) : thumbnailSrc ? (
              <>
                <img
                  src={thumbnailSrc}
                  alt={title}
                  onError={() => setThumbFailed(true)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-[11px] text-slate-300">
                  Inline preview isn't available for this video — the download still works.
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <ImageOff className="w-8 h-8" />
                <span>No preview available</span>
              </div>
            )}

            {durationFormatted && !showPlayer && !showEmbed && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[11px] font-bold text-slate-100 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{durationFormatted}</span>
              </div>
            )}
          </div>

          {/* Details & actions */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.badge}`}>
                <PlatformIcon className="w-3.5 h-3.5" />
                {meta.label}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                MP4 · {quality}
              </span>
              {durationFormatted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                  <Clock className="w-3 h-3" /> {durationFormatted}
                </span>
              )}
            </div>

            <h2 className="font-bold text-lg sm:text-xl text-white leading-snug line-clamp-3 mb-2 break-words">{title}</h2>

            <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-6 min-w-0">
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{platform === 'instagram' ? `@${uploader}` : uploader}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
              >
                Open original <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="mt-auto">
              <button
                onClick={onDownload}
                disabled={isWorking}
                className={`relative w-full overflow-hidden py-4 px-5 rounded-2xl font-bold text-base text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait ${
                  isDone
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-pink-600/25 hover:brightness-110 active:scale-[0.99]'
                }`}
              >
                {isWorking && (
                  <span
                    className="absolute inset-y-0 left-0 bg-white/15 transition-[width] duration-500 ease-out"
                    style={{ width: `${download.progress}%` }}
                  ></span>
                )}
                <span className="relative flex items-center gap-2">
                  {isWorking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {download.phase || 'Preparing'}… {download.progress > 0 ? `${download.progress}%` : ''}
                    </>
                  ) : isDone ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Downloaded — save again
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download MP4
                    </>
                  )}
                </span>
              </button>

              <p className="mt-2.5 text-center text-xs text-slate-500">
                {isWorking
                  ? 'Keep this tab open — your download will start automatically.'
                  : isDone
                    ? 'Check your browser\'s downloads folder.'
                    : 'Free · No watermark · No sign-up'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoPreviewSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8" aria-label="Loading video" role="status">
      <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 animate-pulse">
        <div className="w-full max-w-[300px] mx-auto sm:mx-0 aspect-[9/16] rounded-2xl bg-slate-800/70"></div>
        <div className="flex-1 flex flex-col gap-3 py-1">
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded-full bg-slate-800/70"></div>
            <div className="h-6 w-20 rounded-full bg-slate-800/70"></div>
          </div>
          <div className="h-6 w-full rounded bg-slate-800/70"></div>
          <div className="h-6 w-2/3 rounded bg-slate-800/70"></div>
          <div className="h-4 w-1/3 rounded bg-slate-800/50"></div>
          <p className="mt-2 text-xs text-slate-500">Fetching video details… this can take a few seconds.</p>
          <div className="mt-auto h-14 w-full rounded-2xl bg-slate-800/70"></div>
        </div>
      </div>
    </div>
  );
}
