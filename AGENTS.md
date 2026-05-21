# AGENTS.md — Sound Splittr

Audio stem splitter for DJs using Demucs AI. Separates vocals, drums, bass, melody for live remixing.

---

## Working With This Project

- **Explain code**: Agents explain key sections as they build
- **Clear comments**: Code should be self-documenting; docstrings explain what and why
- **Step-by-step**: Progress in phases; ask before making big decisions
- **No unexplained jargon**: Technical terms get a brief definition on first use

---

## Roles

### 1. Project Architect — "The Guide"

- Oversees system design and coordinates agent work
- Explains design choices and simplifies technical concepts
- Reviews code for clarity and educational value

### 2. Audio Engineer — "The Sound Expert"

- Integrates Demucs, configures models, ensures separation quality
- Explains audio concepts (sample rate, channels, bit depth)
- Optimizes the processing pipeline; comments *why* audio operations exist

### 3. Backend Developer — "The Pipeline Builder"

- Implements FastAPI endpoints, file management, queue system
- Manages metadata extraction and model caching
- Documents API endpoints and explains format choices

### 4. Frontend/CLI Developer — "The Interface Designer"

- Maintains the Click-based CLI and Angular 21 web frontend
- Implements REST API contracts and real-time status updates

### 5. QA Tester — "The Quality Checker"

- Tests across genres, file sizes, and edge cases
- Validates separation quality, memory usage, processing speed
- Documents limitations and creates troubleshooting guides

### 6. Documentation Specialist — "The Teacher"

- Writes installation guides, tutorials, API docs, and FAQ
- Ensures all documentation is beginner-appropriate
- Starts with "what" before "how"; always includes "why this matters"

### 7. Deployment Engineer — "The Container Maker"

- Dockerizes the app (Python backend + Angular frontend)
- Sets up Docker Compose for local dev
- Writes deployment guides with step-by-step instructions

---

## Communication Style

- **Architect**: Explain decisions in simple terms; use analogies; check understanding at milestones
- **Audio Engineer**: Never assume audio knowledge; comment *why*, not just *how*
- **Documentation**: Start with "what" → "how" → "why"; keep examples beginner-friendly

---

## Code Standards

### DO
- Add docstrings to public functions (what it does, args, returns)
- Comment non-obvious logic or trade-offs
- Use type hints

### AVOID
- Bare functions without docstrings
- Comments that restate what the code already says
- Verbose inline explanations for simple operations

---

## Workflow Phases

### Phase 1: Foundation (Weeks 1-2) ✅ Complete

- [x] Python project initialized with Demucs integration
- [x] CLI tool (`src/cli/main.py`) with GPU detection, dry-run mode
- [x] Processing pipeline (`src/pipeline/process.py`)
- [x] End-to-end: upload → process → download stems

### Phase 2: Web Frontend & Backend API (Weeks 3-4) ✅ Complete

- [x] Angular 21 frontend with UploadArea, ProcessingStatus, StemPlayer, StemList
- [x] Routing: Home, Jobs, Settings pages
- [x] TypeScript interfaces for API contracts
- [x] FastAPI backend (`src/api/server.py`) with job queue
- [x] End-to-end: upload via web UI → process → download stems
- [x] UI polish pass (accessibility, design tokens, no-pure-white rule)

### Phase 3: Production Readiness (Weeks 5-6)

- [ ] Quality testing suite
- [ ] Docker container (backend + frontend)
- [ ] Complete documentation and FAQ
- [x] `.gitignore` and `requirements.txt` cleanup

### Phase 4: Maintenance (Ongoing)

- Monitor usage, collect feedback
- Update for new Demucs versions
- Expand genre coverage

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Audio AI | Demucs (PyTorch) |
| Backend | Python 3.10+, FastAPI, click (CLI) |
| Frontend | Angular 21, TypeScript, SCSS |
| Container | Docker, Docker Compose |
| Audio I/O | soundfile, pydub |

---

## Project Structure

```
sound-splittr/
├── src/                      # Python backend
│   ├── api/                  # FastAPI server + job queue
│   │   ├── server.py         # REST endpoints
│   │   └── queue.py          # Job management with GPU fallback
│   ├── core/                 # Audio processing
│   │   ├── demucs_helper.py  # Model loading & metadata
│   │   └── audio_io.py       # Load/save audio (soundfile/pydub)
│   ├── pipeline/
│   │   └── process.py        # Main stem separation pipeline
│   ├── cli/
│   │   └── main.py           # Click-based CLI tool
│   └── utils/
│       ├── __init__.py       # Shared helpers (format_duration, file size)
│       └── quality.py        # Separation quality metrics
│
├── web/                      # Angular 21 frontend
│   └── src/app/
│       ├── core/             # Models, ApiService, SettingsService
│       ├── pages/            # Home, Jobs, Settings
│       └── shared/           # UploadArea, StemPlayer, StemList, etc.
│
├── uploads/                  # Uploaded files (gitignored)
├── jobs/                     # Job output + state (gitignored)
├── requirements.txt          # Python dependencies
├── .gitignore
├── PRODUCT.md                # Product vision
├── DESIGN.md                 # Design tokens & rules
└── AGENTS.md                 # This file
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/cli/main.py` | CLI tool — GPU detection, dry-run, format/bitrate options |
| `src/api/server.py` | FastAPI REST endpoints (upload, jobs, stems, models, health) |
| `src/api/queue.py` | Job queue with GPU fallback and JSON persistence |
| `src/pipeline/process.py` | Demucs integration — loads model, separates stems |
| `web/src/app/core/services/api.service.ts` | Angular HTTP client — single source for all API calls |
| `web/src/app/shared/stem-player/stem-player.ts` | Per-stem audio player with play/pause, volume, solo/mute |

---

## Notes

1. **Start simple**: First version should work, not be perfect
2. **Test often**: Catch issues early
3. **Quality over speed**: Audio quality matters for DJing

---

## Next Steps

1. Build quality testing suite
2. Dockerize backend + frontend
3. Write FAQ and troubleshooting guide
