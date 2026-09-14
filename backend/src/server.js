import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { downloadController, getInfoController } from './controllers/downloadController.js';
import { downloadRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : [FRONTEND_ORIGIN, 'http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());
app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ReelGrab API', timestamp: new Date().toISOString() });
});

// Download & Info Endpoints
app.post('/api/download', downloadRateLimiter, downloadController);
app.post('/api/info', downloadRateLimiter, getInfoController);

// Serve frontend static build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Check yt-dlp on startup
execFile('python', ['-m', 'yt_dlp', '--version'], (err, stdout) => {
  if (err) {
    console.warn('⚠️ WARNING: yt-dlp was not detected on python path! Ensure python and yt-dlp are installed.');
  } else {
    console.log(`✅ yt-dlp detected (version ${stdout.trim()})`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ReelGrab Backend server running on http://localhost:${PORT}`);
});
