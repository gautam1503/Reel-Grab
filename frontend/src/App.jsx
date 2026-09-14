import React, { useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import DownloaderForm from './components/DownloaderForm';
import VideoPreviewCard from './components/VideoPreviewCard';
import Features from './components/Features';
import Disclaimer from './components/Disclaimer';
import { Sparkles, Film, CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch metadata for preview and setup download stream
  const handleSubmit = async (targetUrl) => {
    setIsLoading(true);
    setError(null);
    setVideoData(null);

    try {
      const response = await axios.post(`${API_BASE}/api/info`, { url: targetUrl });
      if (response.data && response.data.success) {
        setVideoData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch Reel details.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const serverMsg = err.response?.data?.error || err.message;
      if (err.response?.status === 400) {
        setError(serverMsg || 'Please enter a valid Instagram Reel or Post link.');
      } else if (err.response?.status === 403) {
        setError(serverMsg || 'This Instagram Reel is from a private account or unavailable.');
      } else if (err.response?.status === 404) {
        setError(serverMsg || 'Reel not found. It may have been deleted.');
      } else if (err.response?.status === 429) {
        setError(serverMsg || 'Instagram rate limits reached. Please try again in a minute.');
      } else {
        setError(serverMsg || 'Unable to connect to downloader server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger raw binary file download from /api/download with automatic fallback
  const handleDownloadFile = async () => {
    if (!url && !videoData?.streamUrl) return;
    setIsDownloading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/api/download`, { url }, {
        responseType: 'blob',
        timeout: 60000
      });

      // Extract filename from header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `reel-${videoData?.id || 'video'}.mp4`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Create download link blob
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Backend proxy stream failed, attempting direct browser download fallback:', err);
      if (videoData?.streamUrl) {
        const filename = `reel-${videoData?.id || 'video'}.mp4`;
        const link = document.createElement('a');
        link.href = videoData.streamUrl;
        link.setAttribute('download', filename);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        setError('Failed to download video file stream. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Background glowing gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-radial-glow pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Navigation Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>The #1 Instagram Reel & Video Downloader</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            Download <span className="text-gradient-instagram">Instagram Reels</span> in HD
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Paste any public Reel or video link below to download high-quality MP4 files directly to your device. Free, instant, and unlimited.
          </p>
        </div>

        {/* Input Form */}
        <DownloaderForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          setError={setError}
          url={url}
          setUrl={setUrl}
        />

        {/* Video Preview Result */}
        <VideoPreviewCard
          videoData={videoData}
          onDownload={handleDownloadFile}
          isDownloading={isDownloading}
        />

        {/* Features Grid */}
        <Features />
      </main>

      {/* Footer */}
      <Disclaimer />
    </div>
  );
}
