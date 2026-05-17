# 🎚️ Sound Splittr - Audio Stem Separator

A Python-based audio stem splitter using Demucs AI to separate songs into vocals, drums, bass, and other stems. Perfect for DJs creating live remixes.

---

## 📋 What Exists Currently

| Component                      | Status                                   |
| ------------------------------ | ---------------------------------------- |
| Core splitting engine (Demucs) | ✅ Working                               |
| CLI command-line tool          | ✅ Working (`src/cli/main.py`)           |
| Unit tests                     | ✅ Implemented (`tests/unit/`)           |
| Integration tests              | ✅ Implemented (`tests/integration/`)    |
| Docker deployment files        | ❌ Not yet set up                        |
| Documentation/tutorials        | ✅ Contains `docs/roadmap-live-dj.md`    |

---

## 🚀 Quick Start - Test It Right Now

### Step 1: Install Dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Verify Core Functionality (No Audio File Needed)

Run the demo script to verify everything loads correctly:

```bash
python demo.py
# Expected output shows PyTorch, Demucs, and all modules loaded
```

Or run the full test suite:

```bash
cd tests && python ../demo_test.py
# Verifies imports work, pipeline is ready, utils function correctly
```

### Step 3: Use the CLI

```bash
python src/cli/main.py --help     # See all options
python src/cli/main.py -i my_song.mp3 -o output/
```

---

## 📁 Project Structure

```
sound_splittr/
├── src/                           # Application code
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
│   │   ├── test_core.py         # Tests for audio_io, demucs_helper modules
│   │   ├── test_pipeline.py     # Tests for process.py pipeline functions
│   │   └── test_utils.py        # Unit tests for utility functions
│   ├── integration/test_integration.py  # Full workflow end-to-end tests
│   ├── conftest.py              # Shared pytest fixtures and helper generators
│   └── fixtures/generate.py     # Creates sample audio files for testing
│
├── config/config.yaml            # Configuration: model, output format, quality settings
├── demo.py                       # Standalone verification script (no audio file needed)
├── demo_test.py                  # Full test suite with detailed output
├── requirements.txt              # Python package dependencies
├── AGENTS.md                     # Agent roles and project instructions
└── .gitignore                    # Git ignore patterns for venv/, __pycache__, etc.
```

**What's NOT in the project (yet):**

- 📦 Docker deployment not yet set up (no `docker/` directory)
- 🖥️ Web UI — removed Streamlit; a new Angular frontend is planned
- ❌ No example audio files (generate them with `python tests/fixtures/generate.py`)

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

**Test fixtures:**

- `tests/fixtures/generate.py` — Creates sample audio files for testing
- Tests use short clips (< 10 seconds) to avoid long wait times

---

## 🎯 What This Project Does (Summary)

Given an input file:

- Takes an audio file → separates into vocals, drums, bass, other stems using Demucs AI
- Provides a CLI tool for batch processing and automation
- Has comprehensive unit and integration tests
- Uses Demucs with PyTorch backend (GPU-accelerated when available)

**What it doesn't do (yet):**

- No Docker deployment setup
- No written tutorials or documentation guides beyond this README
- No example audio files included — generate them with `python tests/fixtures/generate.py`

---

## 📖 Next Steps - What You Can Add

These are **not** in the project yet, but you can implement them:

1. **Docker Deployment:** Create `docker/Dockerfile` and related files
2. **Angular Frontend:** Build a web UI for drag-and-drop uploading and stem downloads
3. **Tutorials:** Write guides in `docs/tutorial/`
4. **Example Audio Files:** Add sample songs to the test directory
