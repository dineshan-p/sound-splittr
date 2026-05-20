# 🎚️ Sound Splittr - AI Audio Stem Separator

A Python-based audio stem splitter using Demucs AI to separate songs into vocals, drums, bass, and melody stems. Includes a CLI tool and an Angular web UI for DJs creating live remixes.

---

## 📋 What Exists Currently

| Component                      | Status                                   |
| ------------------------------ | ---------------------------------------- |
| Core splitting engine (Demucs) | ✅ Working                               |
| CLI command-line tool          | ✅ Working (`src/cli/main.py`)           |
| Angular web frontend           | ✅ Working (`web/`) — Angular 21          |
| Unit tests                     | ✅ Implemented (`tests/unit/`)           |
| Integration tests              | ✅ Implemented (`tests/integration/`)    |
| Docker deployment files        | ❌ Not yet set up                        |
| Documentation/tutorials        | ✅ Contains `docs/roadmap-live-dj.md`    |

---

## 🚀 Quick Start

### Option A: CLI (Python)

```bash
# Install Python dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Verify everything loads correctly
python demo.py

# Split a song
python src/cli/main.py -i my_song.mp3 -o output/
```

### Option B: Web UI (Angular)

```bash
# Install Node.js dependencies (requires Node 18+)
cd web
npm install

# Start development server with hot-reload
ng serve

# Open http://localhost:4200 in your browser
# The UI will show a warning until the Python backend API is running
```

### Option C: Full Stack (Backend + Frontend)

1. Start the Python backend (see Backend API section below)
2. Update the API URL in the web UI Settings (⚙️ top-right)
3. Upload songs via drag-and-drop, watch real-time progress, download stems

---

## 📁 Project Structure

```
sound_splittr/
├── web/                           # Angular 21 frontend
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── models/           # TypeScript interfaces (Job, Stem, etc.)
│   │   │   └── services/         # ApiService, SettingsService
│   │   ├── pages/                # Route-level components
│   │   │   ├── home-page/        # Upload + settings accordion
│   │   │   ├── jobs-page/        # Job history list
│   │   │   └── settings-page/    # Full settings view
│   │   ├── shared/               # Reusable components
│   │   │   ├── upload-area/      # Drag-and-drop zone
│   │   │   ├── processing-status/# Progress ring + stage labels
│   │   │   ├── stem-player/      # Per-stem audio player
│   │   │   ├── stem-list/        # Grid of stem players
│   │   │   └── settings-panel/   # API URL, model, format, bitrate
│   │   ├── app.ts / app.html     # Shell with nav bar
│   │   ├── app.routes.ts         # Route definitions
│   │   └── app.config.ts         # HTTP client + router providers
│   ├── src/styles.scss           # Global CSS variables (dark theme)
│   └── package.json              # Node.js dependencies
│
├── src/                           # Python backend
│   ├── cli/main.py               # Command-line interface (Click)
│   ├── core/
│   │   ├── audio_io.py           # File loading/saving with soundfile/pydub
│   │   └── demucs_helper.py      # Demucs model management & API wrapper
│   ├── pipeline/process.py       # Main splitting workflow orchestration
│   └── utils/                    # Shared helpers (format_duration, file size, etc.)
│       ├── __init__.py           # Common utility functions
│       └── quality.py            # Audio quality metrics
│
├── tests/
│   ├── unit/
│   │   ├── test_core.py          # Tests for audio_io, demucs_helper
│   │   ├── test_pipeline.py      # Tests for process.py pipeline
│   │   └── test_utils.py         # Unit tests for utility functions
│   ├── integration/test_integration.py  # Full workflow end-to-end tests
│   ├── conftest.py               # Shared pytest fixtures
│   └── fixtures/generate.py      # Creates sample audio files
│
├── config/config.yaml            # Configuration: model, output format, quality
├── demo.py                       # Standalone verification script
├── demo_test.py                  # Full test suite
├── requirements.txt              # Python package dependencies
├── AGENTS.md                     # Agent roles and project instructions
└── .gitignore                    # Git ignore patterns
```

---

## 🌐 Backend API (for Web Frontend)

The Angular frontend expects a REST API backend. Until you build one, the UI shows a warning and works in demo mode.

**Expected endpoints:**

| Method | Path                          | Description                              |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/upload`                 | Upload audio + start split → `{ jobId }` |
| GET    | `/api/jobs`                   | List all jobs (most recent first)        |
| GET    | `/api/jobs/:id`               | Get one job with full details            |
| DELETE | `/api/jobs/:id`               | Delete a job and its stem files          |
| GET    | `/api/stems/:jobId/:stem`     | Download a single stem file              |
| GET    | `/api/health`                 | Health check (`{ status: "ok" }`)        |

**Suggested implementation:** Build a FastAPI server that wraps `src/pipeline/process.py` and stores jobs on disk. See `web/src/app/core/services/api.service.ts` for the expected request/response shapes.

---

## 🔧 Configuration File (`config/config.yaml`)

Current settings in the project:

```yaml
model:
  name: htdemucs # Demucs model choice (htdemucs, mdxdemucs, etc.)
  device: auto   # Automatically uses GPU if available, else CPU
  num_workers: 2 # Parallel processing threads for faster splitting

output:
  format: mp3    # Output file format (mp3 or wav)
  bitrate: 320   # Audio quality for MP3 output
  stems:         # The 4 stem outputs
    - vocals     # Lead and backing vocals
    - drums      # Drums and percussion
    - bass       # Bass guitar and low frequencies
    - other      # Everything else (melody, etc.)

quality:
  level: 1       # Speed/quality tradeoff (0=fastest, 3=highest)
```

---

## 🧪 Testing the Project

### Run All Tests

```bash
pytest tests/ -v --tb=short
# Runs unit + integration tests with detailed output
```

### Run Specific Test Areas

```bash
# Core module imports and basic functionality
python demo.py

# Full verification suite
cd tests && python ../demo_test.py

# Unit tests only (fast)
pytest tests/unit/ -v

# Integration test with full pipeline
pytest tests/integration/test_integration.py -v --tb=short
```

### Angular Frontend Tests

```bash
cd web
ng test                  # Run unit tests (Vitest)
ng build                 # Build for production → dist/sound-splittr-web/
```

**Test fixtures:**

- `tests/fixtures/generate.py` — Creates sample audio files for testing
- Tests use short clips (< 10 seconds) to avoid long wait times

---

## 🎯 What This Project Does (Summary)

Given an input file:

- Takes an audio file → separates into vocals, drums, bass, other stems using Demucs AI
- Provides a CLI tool for batch processing and automation
- Provides a web UI (Angular) for drag-and-drop uploading and real-time progress
- Has comprehensive unit and integration tests
- Uses Demucs with PyTorch backend (GPU-accelerated when available)

**What it doesn't do (yet):**

- No Docker deployment setup
- No backend REST API (frontend expects one — build it with FastAPI)
- No written tutorials beyond this README
- No example audio files included — generate them with `python tests/fixtures/generate.py`

---

## 📖 Next Steps - What You Can Add

These are **not** in the project yet, but you can implement them:

1. **Backend REST API:** Build a FastAPI server wrapping `src/pipeline/process.py` to serve the Angular frontend
2. **Docker Deployment:** Create `docker/Dockerfile` and related files for both Python backend and Angular frontend
3. **Tutorials:** Write guides in `docs/tutorial/`
4. **Example Audio Files:** Add sample songs to the test directory
5. **Mock Mode:** Add a mock backend mode to the Angular UI for testing without the Python backend
