# 🎬 ReelGrab — High Performance Instagram Reel Downloader

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![yt--dlp](https://img.shields.io/badge/Engine-yt--dlp-red)](https://github.com/yt-dlp/yt-dlp)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**ReelGrab** is a full-stack, stateless web application designed to download public Instagram Reels and Posts directly in original high-definition MP4 video format. Built with **React**, **Tailwind CSS**, **Node.js (Express)**, and powered by **yt-dlp**, it offers a clean, ad-free experience with no registration, no user accounts, and zero server-side media storage.

---

## ✨ Features

- 🚀 **High-Definition MP4 Downloads**: Direct resolution streaming of original video files without watermarks.
- ⚡ **Instant Metadata Preview**: Displays video title, creator handle, thumbnail, and duration before downloading.
- 🔒 **100% Stateless & Anonymous**: Zero database, no user tracking, no authentication, no file caching on the server.
- 📋 **One-Click Clipboard Auto-Paste**: Built-in clipboard API detection to auto-fill copied Instagram links.
- 🛡️ **Network & Firewall Resilient**: Enhanced SSL handling, optional proxy support (`HTTP_PROXY`/`HTTPS_PROXY`), and intelligent error diagnostics for firewalled networks (Seqrite / Quick Heal / Corporate Endpoint proxies).
- 📱 **Fully Responsive Glassmorphism UI**: Instagram-inspired vibrant dark theme aesthetic built with Tailwind CSS.
- 🐳 **Docker-Ready**: Multi-stage `Dockerfile` with pre-configured Node 20, Python 3.12, `yt-dlp`, and `ffmpeg`.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS v4 (Glassmorphism & modern gradient design system)
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Extraction Engine**: `yt-dlp` (via Python 3.12 subprocess execution)
- **Security & Middleware**: `express-rate-limit` (10 req/min/IP), CORS, Helmet, Morgan logger

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **Python**: 3.10+ (with `yt-dlp` installed)

```bash
python -m pip install -U yt-dlp
```

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ReelGrab.git
   cd ReelGrab
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```
   *Or install individually:*
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=5000
   FRONTEND_ORIGIN=http://localhost:5173
   NODE_ENV=development
   
   # Optional: Proxy settings for firewalled corporate networks
   # HTTP_PROXY=http://127.0.0.1:8080
   # HTTPS_PROXY=http://127.0.0.1:8080
   ```

4. **Run Development Servers**:
   - Start Backend (Port 5000):
     ```bash
     cd backend && npm run dev
     ```
   - Start Frontend (Port 5173):
     ```bash
     cd frontend && npm run dev
     ```

5. Open your browser and navigate to **`http://localhost:5173`**.

---

## 🐳 Docker Deployment

Run the entire stack in a single container with Node.js, Python, `yt-dlp`, and `ffmpeg` pre-packaged:

```bash
# Build Docker image
docker build -t reelgrab .

# Run container
docker run -d -p 5000:5000 --name reelgrab-app reelgrab
```

Access the production build at **`http://localhost:5000`**.

---

## 📁 Project Structure

```
ReelGrab/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── downloadController.js   # Endpoint handlers (info & binary streaming)
│   │   ├── middleware/
│   │   │   └── rateLimiter.js          # IP rate limiting middleware
│   │   ├── services/
│   │   │   └── ytdlpService.js         # yt-dlp secure execution & metadata parser
│   │   ├── utils/
│   │   │   └── urlValidator.js         # Instagram URL pattern validator & sanitizer
│   │   └── server.js                   # Main Express application entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # App branding header
│   │   │   ├── DownloaderForm.jsx      # Input field, paste trigger & loading states
│   │   │   ├── VideoPreviewCard.jsx    # Metadata preview & MP4 download trigger
│   │   │   ├── Features.jsx            # Feature showcase grid
│   │   │   └── Disclaimer.jsx          # Legal terms & copyright footer
│   │   ├── App.jsx                     # State management & layout shell
│   │   └── index.css                   # Custom glassmorphism design tokens
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Dockerfile                          # Multi-stage production build definition
├── package.json                        # Root workspace scripts
└── README.md
```

---

## ⚠️ Important Considerations & Firewalls

- **Public Media Only**: This tool exclusively processes publicly accessible Instagram content. It does not attempt to bypass login walls, private account restrictions, or user authentication.
- **Corporate Firewalls / Antivirus Notice**: If running on a system with strict Endpoint Security (e.g. Seqrite / Quick Heal / Corporate Proxy) that intercepts HTTPS connections to `instagram.com`, ensure `instagram.com` is added to your antivirus exclusions or configure `HTTP_PROXY` in `backend/.env`.

---

## 📄 Legal Disclaimer

ReelGrab is an independent open-source educational utility. It is not affiliated with, authorized, maintained, sponsored, or endorsed by Instagram, Meta Platforms, Inc., or any of their affiliates. All trademarks and brand names belong to their respective owners. No media files are stored or hosted on ReelGrab servers.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.
