FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Python 3 + yt-dlp (with yt-dlp-ejs for YouTube's JS challenges) and ffmpeg for merging HD video + audio
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip3 install --no-cache-dir --break-system-packages -U "yt-dlp[default]"

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

# YouTube/Instagram change often; refresh yt-dlp on each boot (falls back to the baked-in version)
CMD ["sh", "-c", "pip3 install -q --no-cache-dir --break-system-packages -U 'yt-dlp[default]' || true; exec node backend/src/server.js"]
