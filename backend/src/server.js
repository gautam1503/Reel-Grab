import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getInfoController,
  startDownloadController,
  downloadStatusController,
  downloadFileController,
  streamController,
  thumbnailController
} from './controllers/downloadController.js';
import { infoRateLimiter, downloadRateLimiter, mediaRateLimiter } from './middleware/rateLimiter.js';
import { getYtdlpRuntime } from './services/ytdlpService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

// Hosting platforms sit behind a reverse proxy; needed for correct per-IP rate limiting
if (isProduction) app.set('trust proxy', 1);

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: isProduction ? true : [FRONTEND_ORIGIN, 'http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Range', 'Accept-Ranges']
}));

app.use(express.json());
app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms', {
  // Progress polling would flood the log
  skip: (req) => req.method === 'GET' && /^\/api\/download\/[^/]+$/.test(req.path)
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const runtime = await getYtdlpRuntime();
  res.json({
    status: runtime ? 'ok' : 'degraded',
    service: 'ReelGrab API',
    ytdlp: runtime ? runtime.version : null,
    ffmpeg: runtime ? runtime.hasFfmpeg : false,
    timestamp: new Date().toISOString()
  });
});

// API Endpoints
app.post('/api/info', infoRateLimiter, getInfoController);
app.post('/api/download', downloadRateLimiter, startDownloadController);
app.get('/api/download/:jobId', mediaRateLimiter, downloadStatusController);
app.get('/api/download/:jobId/file', mediaRateLimiter, downloadFileController);
app.get('/api/stream', mediaRateLimiter, streamController);
app.get('/api/thumbnail', mediaRateLimiter, thumbnailController);

// Serve frontend static build in production
if (isProduction) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Check yt-dlp / ffmpeg on startup
getYtdlpRuntime().then((runtime) => {
  if (!runtime) {
    console.warn('⚠️ WARNING: yt-dlp was not found. Install it with: python -m pip install -U "yt-dlp[default]"');
    return;
  }
  console.log(`✅ yt-dlp detected (version ${runtime.version}) via "${runtime.cmd}"`);
  if (!runtime.hasFfmpeg) {
    console.warn('⚠️ ffmpeg not found: downloads are limited to single-file formats (YouTube max ~360p). Install ffmpeg for full HD.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ReelGrab Backend server running on http://localhost:${PORT}`);
});
