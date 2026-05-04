# 🎚️ Sound Splittr - Audio Stem Separator

A Python-based audio stem splitter using Demucs to separate songs into vocals, drums, bass, and other stems. Perfect for DJs creating live remixes.

---

## 📋 What Exists Currently

| Component                      | Status                                     |
| ------------------------------ | ------------------------------------------ |
| Core splitting engine (Demucs) | ✅ Working                                 |
| CLI command-line tool          | ✅ Working (`src/cli/main.py`)             |
| Web interface (Streamlit)      | ✅ Ready (`web/streamlit_app.py`)          |
| Unit tests                     | ✅ Implemented (`tests/unit/`)             |
| Integration tests              | ✅ Implemented (`tests/integration/`)      |
| Docker deployment files        | ❌ Empty directory (no `Dockerfile` yet)   |
| Documentation/tutorials        | ❌ Empty `docs/` folder, no guides written |

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

Or run the test suite directly:

```bash
cd tests && python ../demo_test.py
# Verifies imports work, pipeline is ready, utils function correctly
```

### Step 3: Run the Web Interface

```bash
streamlit run web/streamlit_app.py
```

Opens at `http://localhost:8501` - drag and drop any song to split it.

Or use the CLI:

```bash
python src/cli/main.py --help     # See all options
python src/cli/main.py --input my_song.mp3 --output_dir output/
```

---

## 📁 Project Structure

```
sound_splittr/
├── src/                           # Application code
│   ├── cli/main.py               # Command-line interface
│   ├── core/
│   │   ├── audio_io.py           # File loading/saving with torchaudio
│   │   └── demucs_helper.py      # Demucs model management & API wrapper
│   ├── pipeline/process.py       # Main splitting workflow orchestration
│   └── utils/quality.py          # Audio quality metrics (if implemented)
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
├── web/streamlit_app.py          # Streamlit-based web interface
├── config/config.yaml            # Configuration: model, output format, quality settings
├── demo.py                       # Standalone verification script (no audio file needed)
├── demo_test.py                  # Full test suite with detailed output
├── requirements.txt              # Python package dependencies
└── .gitignore                    # Git ignore patterns for venv/, __pycache__, etc.
```

**What's NOT in the project (yet):**

- ❌ No `Dockerfile` or docker deployment files (docker/ directory is empty)
- ❌ No tutorial guides, FAQs, or documentation (docs/ folder exists but is empty)
- ❌ No example audio files (you can add these later if needed)

---

## 🔧 Configuration File (`config/config.yaml`)

Current settings in the project:

```yaml
model:
  name: htdemucs # Demucs model choice (htdemucs, mdxdemucs, etc.)
  device: auto # Automatically uses GPU if available, else CPU
  num_workers: 2 # Parallel processing threads for faster splitting

output:
  format: mp3 # Output file format (mp3 or wav)
  bitrate: 320 # Audio quality for MP3 output
  stems: # The 4 stem outputs
    - vocals # Usually contains lead instruments
    - drums # Drums and percussion
    - bass # Bass guitar and low frequencies
    - other # Everything else (melody, backing vocals, etc.)

quality:
  level: 1 # Speed/quality tradeoff (0=fastest, 3=highest)
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

- `tests/fixtures/generate.py` - Creates sample audio files for testing
- Tests use short clips (< 10 seconds) to avoid long wait times

---

## 🎯 What This Project Does (Summary)

Given existing code:

- Takes an audio file → separates into vocals, drums, bass, other stems
- Provides web UI via Streamlit for easy file upload
- Provides CLI tool for batch processing
- Has comprehensive unit and integration tests
- Uses Demucs AI model with PyTorch backend

**What it doesn't do (yet):**

- No Docker deployment setup
- No written tutorials or documentation guides
- No example audio files included (add these when ready)

---

## 📖 Next Steps - What You Can Add

These are **not** in the project yet, but you can implement them:

1. **Docker Deployment:** Create `docker/Dockerfile` and related files
2. **Tutorials:** Write guides in `docs/tutorial/`
3. **Example Audio Files:** Add sample songs to test directory
4. **FAQ Documentation:** Document common issues in a guide file
