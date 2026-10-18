import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import DownloaderForm from './components/DownloaderForm';
import VideoPreviewCard, { VideoPreviewSkeleton } from './components/VideoPreviewCard';
import Features from './components/Features';
import Disclaimer from './components/Disclaimer';
import {
  fetchVideoInfo,
  startDownloadJob,
  getDownloadJob,
  downloadFileUrl,
  saveFile,
  errorMessage
} from './lib/api';

const IDLE_DOWNLOAD = { status: 'idle', progress: 0, phase: '', jobId: null, filename: null };

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);
  const [download, setDownload] = useState(IDLE_DOWNLOAD);

  // Incremented on every new lookup so late responses from older requests are ignored
  const requestIdRef = useRef(0);
  const pollTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(pollTimerRef.current), []);

  const resetDownload = () => {
    clearTimeout(pollTimerRef.current);
    setDownload(IDLE_DOWNLOAD);
  };

  const handleSubmit = async (targetUrl) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    setVideoData(null);
    resetDownload();

    try {
      const data = await fetchVideoInfo(targetUrl);
      if (requestId === requestIdRef.current) setVideoData(data);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(errorMessage(err, 'Could not fetch this video. Please check the link and try again.'));
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const handleReset = () => {
    requestIdRef.current += 1;
    setUrl('');
    setVideoData(null);
    setError(null);
    setIsLoading(false);
    resetDownload();
  };

  const pollJob = (jobId, requestId) => {
    pollTimerRef.current = setTimeout(async () => {
      if (requestId !== requestIdRef.current) return;
      try {
        const job = await getDownloadJob(jobId);
        if (requestId !== requestIdRef.current) return;

        if (job.status === 'ready') {
          const href = downloadFileUrl(jobId);
          setDownload({ status: 'done', progress: 100, phase: 'Saved to your device', jobId, filename: job.filename });
          saveFile(href, job.filename);
        } else if (job.status === 'error') {
          setDownload(IDLE_DOWNLOAD);
          setError(job.error || 'Download failed. Please try again.');
        } else {
          setDownload((prev) => ({ ...prev, status: 'working', progress: job.progress, phase: job.phase }));
          pollJob(jobId, requestId);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setDownload(IDLE_DOWNLOAD);
        setError(errorMessage(err, 'Lost track of the download. Please try again.'));
      }
    }, 700);
  };

  const handleDownload = async () => {
    if (!videoData) return;

    // File is already prepared on the server; just save it again
    if (download.status === 'done' && download.jobId) {
      saveFile(downloadFileUrl(download.jobId), download.filename);
      return;
    }

    const requestId = requestIdRef.current;
    setError(null);
    setDownload({ ...IDLE_DOWNLOAD, status: 'working', phase: 'Preparing download' });

    try {
      const job = await startDownloadJob(videoData.url);
      if (requestId !== requestIdRef.current) return;
      setDownload((prev) => ({ ...prev, jobId: job.jobId, filename: job.filename }));
      pollJob(job.jobId, requestId);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setDownload(IDLE_DOWNLOAD);
      setError(errorMessage(err, 'Could not start the download. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] max-w-[200vw] h-[520px] bg-radial-glow pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[420px] h-[420px] bg-red-900/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 relative z-10">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Instagram Reels · Posts · YouTube Videos · Shorts</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5">
            Paste a link.
            <br />
            <span className="text-gradient-glow">Watch it. Save it.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Drop any public Instagram or YouTube link below. We'll load the video right here so you can
            preview it, then save it to your device as an MP4.
          </p>
        </div>

        <DownloaderForm
          onSubmit={handleSubmit}
          onReset={handleReset}
          isLoading={isLoading}
          hasResult={Boolean(videoData)}
          error={error}
          setError={setError}
          url={url}
          setUrl={setUrl}
        />

        {isLoading && <VideoPreviewSkeleton />}

        {videoData && (
          <VideoPreviewCard
            key={videoData.url}
            videoData={videoData}
            download={download}
            onDownload={handleDownload}
          />
        )}

        <Features />
      </main>

      <Disclaimer />
    </div>
  );
}
