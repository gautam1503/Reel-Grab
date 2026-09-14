import React, { useState, useEffect } from 'react';
import { Clipboard, Download, Loader2, AlertCircle, X, Sparkles, Link2 } from 'lucide-react';

export default function DownloaderForm({ onSubmit, isLoading, error, setError, url, setUrl }) {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Auto-detect Instagram URL from clipboard if user grants permission
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || !url.trim()) {
      setError('Please paste an Instagram Reel or Post link first.');
      return;
    }
    setError(null);
    onSubmit(url.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glowing border background */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-instagram opacity-30 group-hover:opacity-60 blur-lg transition duration-500 group-hover:duration-200"></div>

        <div className="relative glass-panel rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* URL Input */}
          <div className="relative flex-1 flex items-center bg-slate-900/90 rounded-xl px-3.5 border border-slate-800 focus-within:border-pink-500/50 transition-colors">
            <Link2 className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste Instagram Reel or Post link here..."
              disabled={isLoading}
              className="w-full bg-transparent py-3.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
            />

            {url && !isLoading && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="ml-2 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Paste from Clipboard"
            >
              <Clipboard className="w-3.5 h-3.5 text-pink-400" />
              <span>{pasteSuccess ? 'Pasted!' : 'Paste'}</span>
            </button>
          </div>

          {/* Download Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-instagram text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download MP4</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Callout */}
      {error && (
        <div className="mt-4 p-4 rounded-xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Unable to download video</p>
            <p className="mt-0.5 text-xs text-rose-300/80 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Demo Link Option */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span>Restricted network firewall?</span>
        <button
          type="button"
          onClick={() => {
            setUrl('https://www.instagram.com/reel/demo/');
            if (error) setError(null);
          }}
          className="text-pink-400 hover:text-pink-300 font-semibold underline decoration-pink-500/40 cursor-pointer"
        >
          Try Demo Link
        </button>
      </div>
    </div>
  );
}
