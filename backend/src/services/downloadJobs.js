import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { getYtdlpRuntime, buildCommonArgs, parseYtdlpError } from './ytdlpService.js';
import { httpAgent, httpsAgent } from '../utils/httpAgents.js';

const TEMP_ROOT = path.join(os.tmpdir(), 'reelgrab');
const JOB_TTL_MS = 15 * 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_ACTIVE_JOBS = Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 3;

const jobs = new Map();

// Files are only kept long enough for the browser to fetch them
fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
fs.mkdirSync(TEMP_ROOT, { recursive: true });

setInterval(() => {
  const now = Date.now();
  for (const job of jobs.values()) {
    if (now - job.createdAt > JOB_TTL_MS) removeJob(job);
  }
}, 60 * 1000).unref();

function removeJob(job) {
  if (job.child && job.child.exitCode === null) job.child.kill('SIGKILL');
  fs.rm(job.dir, { recursive: true, force: true }, () => {});
  jobs.delete(job.id);
}

export function getJob(id) {
  return jobs.get(id) || null;
}

export function toPublicJob(job) {
  return {
    jobId: job.id,
    status: job.status,
    phase: job.phase,
    progress: Math.round(job.progress),
    filename: job.filename,
    error: job.error
  };
}

/**
 * Starts a background download into a private temp folder.
 * Returns the job, or null when the server is already at its concurrency limit.
 */
export function createDownloadJob(metadata) {
  const active = [...jobs.values()].filter((job) => job.status === 'downloading' || job.status === 'processing');
  if (active.length >= MAX_ACTIVE_JOBS) return null;

  const id = crypto.randomUUID();
  const job = {
    id,
    status: 'downloading',
    phase: 'Preparing download',
    progress: 0,
    filename: buildFilename(metadata.data),
    filePath: null,
    error: null,
    dir: path.join(TEMP_ROOT, id),
    createdAt: Date.now(),
    child: null
  };
  fs.mkdirSync(job.dir, { recursive: true });
  jobs.set(id, job);

  const run = metadata.source.direct ? runDirectDownload(job, metadata) : runYtdlpDownload(job, metadata);
  run.catch((err) => failJob(job, err.message || 'Download failed. Please try again.'));

  return job;
}

function failJob(job, message) {
  if (job.status === 'ready') return;
  job.status = 'error';
  job.error = message;
  job.phase = 'Failed';
}

function buildFilename({ platform, title, id }) {
  const slug = (title || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${platform}-${slug || 'video'}-${id}.mp4`.replace(/--+/g, '-');
}

async function runYtdlpDownload(job, { data, source }) {
  const runtime = await getYtdlpRuntime();
  if (!runtime) throw new Error('The video engine (yt-dlp) is not installed on the server.');

  // Prefer H.264 + AAC so the merged MP4 plays everywhere (iPhone, Windows, WhatsApp)
  const format = runtime.hasFfmpeg
    ? 'bv*[vcodec^=avc1]+ba[ext=m4a]/bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b[ext=mp4]/b/bv*[ext=mp4]/bv*'
    : 'b[ext=mp4]/b/bv*[ext=mp4]/bv*';

  const args = [
    ...buildCommonArgs(runtime, source.youtubeClient),
    '-f', format,
    '--newline',
    '--no-part',
    '--no-mtime',
    '-o', path.join(job.dir, 'video.%(ext)s')
  ];
  if (runtime.hasFfmpeg) args.push('--merge-output-format', 'mp4');
  if (source.playlistItem) args.push('--playlist-items', String(source.playlistItem));
  args.push(data.url);

  const child = spawn(runtime.cmd, args, { windowsHide: true });
  job.child = child;

  let phases = 1;
  let phaseIndex = 0;
  let stderr = '';
  let buffer = '';

  const timeout = setTimeout(() => child.kill('SIGKILL'), DOWNLOAD_TIMEOUT_MS);

  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
      const formatsMatch = line.match(/Downloading \d+ format\(s\):\s*(\S+)/);
      if (formatsMatch) phases = formatsMatch[1].split('+').length;

      if (line.startsWith('[download] Destination:')) {
        phaseIndex += 1;
        job.phase = phases > 1 ? (phaseIndex === 1 ? 'Downloading video' : 'Downloading audio') : 'Downloading';
      }

      const pctMatch = line.match(/^\[download\]\s+([\d.]+)%/);
      if (pctMatch) {
        const pct = Math.min(100, parseFloat(pctMatch[1]));
        const completedPhases = Math.max(0, phaseIndex - 1);
        job.progress = Math.max(job.progress, ((completedPhases + pct / 100) / phases) * 95);
      }

      if (line.startsWith('[Merger]') || line.startsWith('[VideoConvertor]') || line.startsWith('[FixupM')) {
        job.status = 'processing';
        job.phase = 'Merging audio & video';
        job.progress = Math.max(job.progress, 96);
      }
    }
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', (err) => {
      stderr += err.message;
      resolve(-1);
    });
  });
  clearTimeout(timeout);
  job.child = null;

  if (!jobs.has(job.id)) return;

  if (exitCode !== 0) {
    failJob(job, parseYtdlpError(stderr || 'Download process was stopped.', data.platform).error);
    return;
  }

  const file = fs.readdirSync(job.dir).find((name) => !name.endsWith('.part') && !name.endsWith('.ytdl'));
  if (!file) {
    failJob(job, 'The download finished but no video file was produced. Please try again.');
    return;
  }
  finishJob(job, path.join(job.dir, file));
}

async function runDirectDownload(job, { source }) {
  job.phase = 'Downloading';
  const response = await axios({
    method: 'GET',
    url: source.preview.url,
    responseType: 'stream',
    timeout: 60000,
    httpAgent,
    httpsAgent,
    headers: source.preview.headers
  });

  const total = Number(response.headers['content-length']) || 0;
  let received = 0;
  const filePath = path.join(job.dir, 'video.mp4');

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    response.data.on('data', (chunk) => {
      received += chunk.length;
      if (total) job.progress = (received / total) * 95;
    });
    response.data.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
    response.data.pipe(out);
  });

  if (jobs.has(job.id)) finishJob(job, filePath);
}

function finishJob(job, filePath) {
  job.filePath = filePath;
  job.status = 'ready';
  job.phase = 'Ready';
  job.progress = 100;
}
