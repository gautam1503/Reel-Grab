import React, { useState } from 'react';
import { Clipboard, Loader2, AlertCircle, X, Link2, ArrowRight, Instagram, Youtube, RotateCcw } from 'lucide-react';
import { detectPlatform, extractLink } from '../lib/api';

const PLATFORM_ICON = {
  instagram: <Instagram className="w-5 h-5 text-pink-400" />,
  youtube: <Youtube className="w-5 h-5 text-red-500" />
};

export default function DownloaderForm({ onSubmit, onReset, isLoading, hasResult, error, setError, url, setUrl }) {
  const [clipboardBlocked, setClipboardBlocked] = useState(false);
  const platform = detectPlatform(url);

  const submit = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setError('Paste an Instagram or YouTube link first.');
      return;
    }
    if (!detectPlatform(trimmed)) {
      setError('That doesn\'t look like an Instagram or YouTube link.');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  // Pasting a supported link fetches the video straight away — no extra click needed
  const handleInputPaste = (e) => {
    const link = extractLink(e.clipboardData.getData('text'));
    if (link) {
      e.preventDefault();
      setUrl(link);
      submit(link);
    }
  };

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const link = extractLink(text) || text.trim();
        setUrl(link);
        submit(link);
      }
    } catch {
      setClipboardBlocked(true);
      setTimeout(() => setClipboardBlocked(false), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-r from-pink-600 via-purple-600 to-red-600 opacity-25 group-focus-within:opacity-50 blur-lg transition duration-500"></div>

        <div className="relative glass-panel rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1 flex items-center bg-slate-900/90 rounded-xl pl-3.5 pr-2 border border-slate-800 focus-within:border-pink-500/50 transition-colors min-w-0">
            <span className="mr-2.5 shrink-0 transition-transform">
              {platform ? PLATFORM_ICON[platform] : <Link2 className="w-5 h-5 text-slate-500" />}
            </span>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={url}
              onPaste={handleInputPaste}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste Instagram or YouTube link…"
              disabled={isLoading}
              aria-label="Video link"
              className="w-full min-w-0 bg-transparent py-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
            />

            {url && !isLoading ? (
              <button
                type="button"
                onClick={onReset}
                className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Clear"
                aria-label="Clear link"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePasteButton}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-pink-400" />
                <span>Paste</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-600/25 hover:shadow-pink-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Fetching…</span>
              </>
            ) : (
              <>
                <span>Get Video</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {clipboardBlocked && (
        <p className="mt-3 text-center text-xs text-amber-300/90">
          Your browser blocked clipboard access — press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">V</kbd> in the box instead.
        </p>
      )}

      {error && (
        <div role="alert" className="mt-4 p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-sm flex items-start gap-3 animate-fade-up">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-rose-200">Couldn't get that video</p>
            <p className="mt-0.5 text-xs text-rose-300/80 leading-relaxed break-words">{error}</p>
            {url && !isLoading && (
              <button
                type="button"
                onClick={() => submit(url)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-200 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try again
              </button>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!hasResult && !isLoading && !error && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" /> instagram.com/reel/…</span>
          <span className="inline-flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5" /> youtube.com/watch?v=… · youtu.be/… · /shorts/…</span>
          <button
            type="button"
            onClick={() => {
              setUrl('https://www.instagram.com/reel/demo/');
              submit('https://www.instagram.com/reel/demo/');
            }}
            className="text-pink-400 hover:text-pink-300 font-semibold underline decoration-pink-500/40 cursor-pointer"
          >
            Try a demo
          </button>
        </div>
      )}
    </div>
  );
}
