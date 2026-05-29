# 🎚️ Sound Splittr — AI Audio Stem Separator

Separate any song into vocals, drums, bass, and other stems using Demucs AI. Built for DJs who need fast, reliable stem separation for live remixing and mashups.

---

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
python -m venv .venv
source .venv/bin/activate        # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Choose Your Interface

| Method | Use when… |
|--------|-----------|
| **CLI** | You want quick terminal-based splitting, scripting, or batch processing |
| **Web UI** | You want drag-and-drop, real-time progress, and stem playback |
| **Both** | You want the full experience — CLI for batch, Web UI for preview |

---

## 🖥️ Method 1: CLI (Command Line)

The CLI is a single command that splits an audio file and outputs the stems.

### Basic Usage

```bash
python src/cli/main.py -i my_song.mp3 -o output/
```

This splits `my_song.mp3` into 4 stems (vocals, drums, bass, other) in the `output/` directory as MP3 files at 320 kbps.

### Full Options

```bash
python src/cli/main.py \
  -i my_song.mp3 \
  -o output/ \
  -m htdemucs \
  -d auto \
  -f mp3 \
  -b 320 \
  -v
```

### Option Reference

| Flag | Option | Default | Description |
|------|--------|---------|-------------|
| `-i, --input` | path | *(required)* | Input audio file (MP3, WAV, FLAC, OGG) |
| `-o, --output` | path | *(required)* | Directory for output stems |
| `-m, --model` | `htdemucs` \| `mdxdemucs` \| `htdemucs_6s` | `htdemucs` | Which AI model to use |
| `-d, --device` | `auto` \| `cuda` \| `cpu` | `auto` | Hardware device (`auto` picks GPU if available) |
| `-f, --format` | `mp3` \| `wav` \| `flac` | `mp3` | Output audio format |
| `-b, --bitrate` | integer | `320` | MP3 bitrate in kbps (only used with `--format mp3`) |
| `-v, --verbose` | flag | off | Show detailed processing info and GPU status |
| `--no-gpu` | flag | off | Force CPU mode even if GPU is available |
| `--dry-run` | flag | off | Validate inputs but don't actually process |

### Examples

**Split a WAV file to FLAC (lossless):**
```bash
python src/cli/main.py -i song.wav -o stems/ -f flac
```

**Use the higher-quality MDX model:**
```bash
python src/cli/main.py -i song.mp3 -o stems/ -m mdxdemucs -b 320
```

**Force CPU mode (no GPU):**
```bash
python src/cli/main.py -i song.mp3 -o stems/ --no-gpu
```

**Validate a file before processing:**
```bash
python src/cli/main.py -i song.mp3 -o stems/ --dry-run
```

### Output Structure

```
output/
├── vocals.mp3
├── drums.mp3
├── bass.mp3
└── other.mp3
```

---

## 🌐 Method 2: Web UI (Browser)

The web UI gives you drag-and-drop uploads, real-time progress tracking, per-stem audio playback, and batch job history.

### Prerequisites

- Python backend running (see below)
- Node.js 18+ installed
- Angular CLI installed (`npm install -g @angular/cli`)

### Step 1: Start the Backend API

The backend is a FastAPI server that wraps the splitting pipeline.

```bash
uvicorn src.api.server:app --host 0.0.0.0 --port 8000
```

You should see:
```
🎚️  Sound Splittr API starting on :8000
  GPU: 0.7GB free / 8.2GB total
  Queue: max 5 jobs, max 2 concurrent
```

The backend exposes these endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload audio + start split |
| `GET` | `/api/jobs` | List all jobs (newest first) |
| `GET` | `/api/jobs/:id` | Get job details with stems |
| `DELETE` | `/api/jobs/:id` | Delete a job and its stems |
| `GET` | `/api/stems/:jobId/:stem` | Download a single stem file |
| `GET` | `/api/models` | Available models list |
| `GET` | `/api/health` | Health check |

### Step 2: Start the Frontend

```bash
cd web
npm install          # Install once, or after dependencies change
ng serve --proxy-config proxy.conf.json
```

The `proxy.conf.json` routes all `/api/*` requests to the backend at `localhost:8000`, so the frontend and backend communicate seamlessly.

Open **`http://localhost:4200`** in your browser.

### Step 3: Use the UI

1. **Home Page** — Drag and drop an audio file (or click to browse). The UI shows GPU status and processing progress in real time.
2. **Jobs Page** — Browse your job history. Each job shows status, progress bar, and a list of available stems.
3. **Stem Player** — Click any stem to play it in the browser. Use play/pause, seek, volume, and mute/solo controls. Download individual stems or all stems for a job.
4. **Settings** — Configure API URL (default `http://localhost:8000`), default model, output format, and bitrate.

### Frontend Pages

| Page | Route | What it does |
|------|-------|--------------|
| Home | `/` | Upload area, GPU status, quick settings |
| Jobs | `/jobs` | Job history with status, progress, stem list |
| Settings | `/settings` | API URL, model, format, bitrate configuration |

### Building for Production

```bash
cd web
ng build --configuration production
# Output goes to dist/sound-splittr-web/
```

Serve the output with any static file server (nginx, Apache, `npx serve dist/sound-splittr-web`).

---

## 🔀 Full Stack: CLI + Web UI Together

Run both simultaneously for the best experience:

```bash
# Terminal 1 — Backend API
source .venv/bin/activate
uvicorn src.api.server:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd web
ng serve --proxy-config proxy.conf.json

# Open http://localhost:4200 in your browser
```

Or use the CLI for batch processing while the UI handles preview:

```bash
# Batch process multiple files from the terminal
for f in /path/to/songs/*.mp3; do
  python src/cli/main.py -i "$f" -o "stems/$(basename "$f" .mp3)/"
done
```

---

## 🧪 Testing

### Run All Tests

```bash
pytest tests/ -v --tb=short
```

### Run Specific Test Areas

```bash
# All Python tests (unit + integration + edge cases)
pytest tests/ -v

# Unit tests only (fast, no I/O)
pytest tests/unit/ -v

# Integration tests (full pipeline with real audio I/O)
pytest tests/integration/test_integration.py -v --tb=short

# Edge case tests
pytest tests/test_edge_cases.py -v

# Angular unit tests
cd web && npx ng test
```

### Test Coverage

The test suite includes **115 Python tests** and **60+ Angular tests** covering:

- **API endpoints** — upload, job management, validation, error handling
- **Job queue** — serialization, GPU memory gating, concurrency limits, persistence
- **Audio I/O** — loading, saving, normalization, clipping detection, metadata
- **CLI** — input validation, dry-run mode, verbose GPU status, help text
- **Edge cases** — empty responses, timeouts, invalid inputs, silent tracks, zero-length files
- **Frontend services** — API client, settings persistence, notifications
- **Frontend components** — upload area, stem player, processing status, job list

See `TEST_SUMMARY.md` for the full breakdown.

---

## ⚙️ Models

| Model | Stems | Description | Best For |
|-------|-------|-------------|----------|
| `htdemucs` | 4 (vocals, drums, bass, other) | Balanced speed and quality | General purpose, live DJing |
| `mdxdemucs` | 4 (vocals, drums, bass, other) | Higher quality, slower | Studio-grade separation |
| `htdemucs_6s` | 6 (vocals, drums, bass, other, guitar, piano) | 6-way split | Detailed stem extraction |

---

## ⚙️ Configuration

A `config/config.yaml` file provides default settings for the pipeline:

```yaml
model:
  name: htdemucs
  device: auto
  gpu_mem_frac: 0.5
  num_workers: 2

output:
  format: mp3
  bitrate: 320
  stems: [vocals, drums, bass, other]

preprocessing:
  normalize: true
  min_amplitude: 0.001
  denoise: false

quality:
  level: 1
```

---

## 📁 Project Structure

```
sound-splittr/
├── src/                          # Python code
│   ├── cli/main.py               # CLI tool (Click framework)
│   ├── api/server.py             # FastAPI REST API backend
│   ├── api/queue.py              # Job queue and storage
│   ├── core/                     # Audio processing helpers
│   │   ├── demucs_helper.py      # Model discovery & metadata
│   │   └── audio_io.py           # Load/save audio (soundfile/pydub)
│   ├── pipeline/process.py       # Core splitting pipeline
│   └── utils/                    # Shared helpers
│       └── quality.py            # Separation quality metrics
│
├── web/                          # Angular 21 frontend
│   ├── proxy.conf.json           # API proxy config (dev)
│   ├── angular.json              # Angular build configuration
│   └── src/app/
│       ├── pages/                # Home, Jobs, Settings
│       ├── shared/               # Upload, Player, Status components
│       └── core/                 # Models, API service, Settings service
│
├── tests/                        # Test suite (115 Python + 60+ Angular tests)
│   ├── unit/                     # Unit tests (pipeline, core, utils)
│   ├── integration/              # Integration tests
│   ├── fixtures/                 # Synthetic audio generators for tests
│   ├── test_server.py            # API endpoint tests
│   ├── test_queue.py             # Job queue tests
│   ├── test_cli.py               # CLI tests
│   ├── test_audio_io.py          # Audio I/O tests
│   ├── test_demucs_helper.py     # Model helper tests
│   └── test_edge_cases.py        # Edge case / error handling tests
│
├── config/                       # Pipeline configuration (YAML)
├── docs/                         # Additional documentation
├── requirements.txt              # Python dependencies
├── pytest.ini                    # pytest configuration
├── AGENTS.md                     # Project instructions
└── README.md                     # This file
```

---

## ❓ Troubleshooting

**"ModuleNotFoundError: No module named 'demucs'"**
→ Make sure you activated the virtual environment: `source .venv/bin/activate`

**"demucs.pretrained has no attribute 'get_model'"**
→ This was a bug in an older version. Make sure you're on the latest code.

**"GPU out of memory"**
→ Use `--no-gpu` or `-d cpu` to force CPU mode. The first model download will cache for faster subsequent runs.

**"Frontend shows 'Backend not connected'"**
→ Make sure the backend is running: `curl http://localhost:8000/api/health` should return `{"status":"ok",...}`

**"Stems are all silence or empty"**
→ Try a different model (`mdxdemucs` often works better for complex mixes). Some audio formats may need conversion first.

---

## 📋 What's Working

| Component | Status |
|-----------|--------|
| Core splitting engine (Demucs 4.0+) | ✅ Working |
| CLI tool (`src/cli/main.py`) | ✅ Working |
| Backend REST API (`src/api/server.py`) | ✅ Working |
| Angular 21 web frontend (`web/`) | ✅ Working |
| End-to-end upload → process → download | ✅ Verified |
| Unit + integration tests (115 Python + 60+ Angular) | ✅ Passing |

## 📋 What's Coming

| Feature | Status |
|---------|--------|
| Docker deployment | ❌ Not yet |
| Batch queue (multiple files) | Partial — single job at a time |
| Production build pipeline | ❌ Not yet |
