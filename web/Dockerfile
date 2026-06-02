# Sound Splittr — Frontend (Angular + nginx)
#
# Multi-stage build:
#   Stage 1 — Node: install dependencies and build the Angular app
#   Stage 2 — nginx: serve the static files and proxy /api/* to the backend

# ---------------------------------------------------------------------------
# Stage 1 — Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (Docker layer caching).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build.
COPY . .
RUN npm run build -- --configuration production

# ---------------------------------------------------------------------------
# Stage 2 — Serve
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Replace the default nginx config with our proxy setup.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Angular app into nginx's serve directory.
COPY --from=builder /app/dist/sound-splittr-web/browser /usr/share/nginx/html

# nginx serves on port 80 by default.
EXPOSE 80

# Start nginx in the foreground (Docker best practice).
CMD ["nginx", "-g", "daemon off;"]
