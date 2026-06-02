# Sound Splittr — Backend (FastAPI + Demucs)
#
# Multi-stage: build system deps, then runtime with only what's needed.
# GPU support is opt-in via docker-compose (see docker-compose.yml).

# ---------------------------------------------------------------------------
# Stage 1 — Build: install system-level dependencies
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

# libsndfile (required by soundfile), ffmpeg (required by pydub for MP3),
# and build tools for compiling the PyTorch wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libsndfile1-dev \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Stage 2 — Runtime: Python dependencies + application code
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime

# Runtime-only system deps (libsndfile runtime + ffmpeg for pydub).
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsndfile1 \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first (Docker layer caching).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source (not the virtualenv or runtime data).
COPY src/ src/
COPY config/ config/

# Create runtime directories.
RUN mkdir -p /app/uploads /app/jobs

# Expose the FastAPI port.
EXPOSE 8000

# Run the server.
CMD ["uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
