# 🎚️ Live DJ & Learning Roadmap

> Build Sound Splitter for live remixing + understanding audio separation internals  
> **Focus:** Speed, robustness, GPU efficiency (not post-production features)  
> **Timeline:** ~3-5 hours this week to get a working prototype

---

## 🎯 Your Goals (as you stated)

| Goal                                | Why it matters for live DJing                  |
| ----------------------------------- | ---------------------------------------------- |
| Fast GPU processing (<10ms latency) | No audio delay while performing live           |
| Robust error handling               | One failed track shouldn't crash the whole set |
| Understand internals                | Learn how AI audio separation actually works   |

**What you DON'T need yet:**

- ❌ Post-production quality metrics
- ❌ API endpoints for external DAWs (not a live DJ priority)
- ❌ Complex batch processing without crash recovery

---

## 📅 Day-by-Day Plan (First Week)

### **Day 1: Test & Understand Core Functionality** ⭐⭐⭐

_Goal: Verify everything works, understand Demucs' input/output workflow_

#### Step 1.1: Run the demo script

```bash
cd /home/kobe/brain_2/projects/stem_splitter
python demo.py
```

**Expected output:** Shows PyTorch version, CUDA availability, available models  
**Learning objective:** See what hardware you have (GPU vs CPU)

#### Step 1.2: Study the code with these questions:

```bash
# Read through core files with specific questions in mind:
cat src/core/demucs_helper.py | grep -A5 "def process_audio"
# Ask yourself: What does demucs.dominant() actually do?

cat src/core/audio_io.py | grep -A10 "def load_audio"
# Ask yourself: Why normalize audio? (prevents clipping on loud inputs)
```

#### Step 1.3: Create your first documentation file

```bash
mkdir -p docs/tutorial
cat > docs/tutorial/first-use.md << 'EOF'
# First Song Guide

## What This Is
A simple tutorial for new users to separate their first song.

## Why It Matters
Live DJs need to upload and split songs quickly before the gig.
This guide assumes no prior knowledge of audio separation.

## Step-by-Step (to write later)
1. Install dependencies (`python -m venv .venv && source .venv/bin/activate`)
2. Run `demo.py` to verify it works
3. ... [add steps as you test]
EOF
```

**Learning goal:** Understand Demucs' input/output workflow  
**Document in:** `docs/tutorial/first-use.md`

---

### **Day 2: Build GPU Status Display** ⭐⭐⭐

_Goal: Know your hardware before the gig, prevent surprises_

#### Step 2.1: Add GPU status to CLI startup

Edit `src/cli/main.py` and add:

```python
# At the start of main(), after logging setup:
def show_gpu_status():
    """Explain GPU vs CPU in beginner-friendly terms."""
    if torch.cuda.is_available():
        print(f"\n🎉 Great news! Found {torch.cuda.device_count()} GPU(s):")
        for i, gpu in enumerate(torch.cuda.get_device_name()):
            print(f"  GPU {i}: {gpu}")

    # Explain memory usage:
    free_memory = torch.cuda.mem_get_info()[0] / 1e9
    print(f"🧠 GPU Memory: {free_memory:.1f}GB available")
    print("🧠 GPU Memory needed for htdemucs model: ~2.5GB")

    if free_memory > 3.0:
        print("✅ Plenty of GPU memory - you can process many songs!")
    elif free_memory < 1.5:
        print("⚠️  GPU memory is tight - consider using CPU mode (--no-gpu)")

# Call it at startup (inside main() function, after logging setup)
show_gpu_status()
```

#### Step 2.2: Test with your laptop's actual GPU

```bash
python src/cli/main.py --help   # See the new GPU status output
```

**Why this matters for live DJing:**

- Know upfront if your laptop can handle it before the gig
- Explain to venue tech why you need specific hardware
- Switch to CPU gracefully if GPU fails (don't crash)

**Learning goal:** Understand GPU memory management  
**Document in:** `docs/troubleshooting/gpu-memory.md`

---

### **Day 3: Implement Batch Playlist with Crash Recovery** ⭐⭐⭐

_Goal: One failed track shouldn't abort your entire set_

#### Step 3.1: Edit `src/pipeline/process.py` to add error recovery

```python
# At the top of process.py, after imports:
def process_playlist(audio_files: list, output_dir: str = "output") -> dict:
    """
    Process multiple files with automatic error recovery.

    This is CRITICAL for live DJing - if one song fails,
    we don't want to abort the entire set.
    """
    results = {}
    errors = []

    for i, audio_file in enumerate(audio_files):
        try:
            print(f"\n[Song {i+1}/{len(audio_files)}] Processing: {audio_file}")
            result = process_audio_file(
                input_file=audio_file,
                output_dir=output_dir,
                model="htdemucs",
                device="auto"
            )
            results[audio_file] = {
                "status": "success",
                "stems": [s["path"] for s in result["stems"]]
            }
            print(f"✅ {audio_file} → {len(result['stems'])} stems created")
        except Exception as e:
            # Log error but CONTINUE with next file!
            error_msg = f"❌ Error on {audio_file}: {str(e)}"
            errors.append(error_msg)
            print(f"  -> Continuing to next song (don't panic!)")

    return {
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }
```

#### Step 3.2: Test with a playlist of files (if you have some)

```bash
# Create a fake playlist of audio files in a directory
mkdir -p test_playlist && cd test_playlist
echo "fake1.mp3" > file1.txt
echo "fake2.mp3" > file2.txt
echo "fake3.mp3" > file3.txt

# Then call the function (you'd need actual files to truly test this)
python src/pipeline/process.py --playlist test_playlist/
```

**Learning goal:** Understand exception handling in audio pipelines  
**Document this in:** `docs/tutorial/batch-processing.md` - explain why we continue on error for live use

---

### **Day 4: Benchmark Different Models** ⭐⭐

_Goal: Learn which models work best for different genres_

#### Step 4.1: Create a simple benchmark script in `src/demo.py`

```python
#!/usr/bin/env python3
"""
Model Benchmark Tool - Compare speed and quality of Demucs models.

This is essential for understanding tradeoffs before the gig:
- Some genres work better with specific models (rock vs. pop)
- Speed matters more than perfection in a live setting
"""
import time
import sys
sys.path.insert(0, "src")
from core.demucs_helper import DemucsEngine, ModelInfo

def benchmark_models(song_path: str) -> dict:
    """Compare speed and quality of different Demucs models."""
    models = ["htdemucs", "mdxdemucs"]  # Start with these two
    results = {}

    for model_name in models:
        if not ModelInfo.get(model_name, {}).get("description"):
            print(f"⚠️  Skipping {model_name} (not installed)")
            continue

        start_time = time.time()
        try:
            engine = DemucsEngine(model_name=model_name)
            result = engine.process_audio(song_path, f"benchmarks/{model_name}/")
            elapsed = time.time() - start_time

            # Measure output file sizes (quality proxy: larger = more detail)
            total_size = sum(os.path.getsize(s) for s in result.values()) / 1024  # KB

            print(f"\n{model_name}:")
            print(f"  Speed: {elapsed:.2f}s for {song_path}")
            print(f"  Output size (quality proxy): {total_size:.1f} KB")
            results[model_name] = {
                "speed": elapsed,
                "size": total_size
            }
        except Exception as e:
            print(f"❌ Error testing {model_name}: {e}")

    return results
```

#### Step 4.2: Run on a sample track (or one you have)

```bash
# Replace "your_song.mp3" with an actual audio file path
python src/demo.py --benchmark your_song.mp3
```

**Learning goal:** Understand model architecture tradeoffs  
**Document in:** `docs/comparison/README.md` - include a table comparing speed vs. quality

---

### **Day 5: Experiment with "Live Mode" Settings** ⭐⭐

_Goal: Zero-generation-loss output for critical live moments_

#### Step 5.1: Add a `--live-mode` flag to CLI in `src/cli/main.py`

```python
@click.option('--live-mode', is_flag=True,
              help='Disable normalization, use best quality model')
def main(
    input_file: str,
    output_dir: str,
    model: str = "htdemucs",
    device: str = "auto",
    format: str = "mp3",        # Change to 'wav' for zero-generation loss
    bitrate: int = 320,
    normalize: bool = True,      # Disable for live mode (keep original dynamics)
    ...
):
    if live_mode:
        model = "mdxdemucs"     # Best quality for critical moments
        format = "wav"           # Zero-generation loss
        normalize = False        # Keep original dynamics
```

#### Step 5.2: Test the effect of different settings

```bash
# Compare normalized vs non-normalized output (if you have audio files)
python src/cli/main.py --input song.mp3 --output test_normalized/
python src/cli/main.py --live-mode --input song.mp3 --output test_live/
```

**Learning goal:** Understand real-time audio processing constraints  
**Experiment with:** Different output formats and their effect on sound quality

---

## 📋 Quick Reference: What to Build This Week

| Day       | Priority | Build                                 | Why it matters                              |
| --------- | -------- | ------------------------------------- | ------------------------------------------- |
| **Day 1** ✅ | ⭐⭐⭐   | Test core + create first tutorial doc | Verify functionality, understand basics     |
| **Day 2** 🟡 | ⭐⭐⭐   | GPU status display in CLI             | Know your hardware before the gig           |
| **Day 3** 🔴 | ⭐⭐⭐   | Batch playlist with crash recovery    | One failed track shouldn't abort the set    |
| **Day 4** 🔴 | ⭐⭐     | Benchmark different models            | Learn which model works best for each genre |
| **Day 5** 🔴 | ⭐       | "Live mode" settings (WAV output)     | Zero-generation loss for critical moments   |

### Progress Legend:
- 🟡 Day 2: GPU status display - **in progress**
- 🔴 Days 3-5: Not yet started

---

## ✅ What's Been Completed

- [x] Created comprehensive day-by-day roadmap (`docs/roadmap-live-dj.md`)
- [x] Tested core functionality - `demo.py` loads successfully with CUDA
- [x] All unit & integration tests passing (11 tests total, ~1s runtime)
- [x] Committed roadmap to git repository with proper documentation

---

## 🧪 Learning Goals (as you build)

### Core Audio Separation Understanding

- [ ] Understand how Demucs separates stems without manual editing
- [ ] Document what happens when a song is longer than the model's window
- [ ] Explain why audio normalization prevents clipping in loud venues

### GPU vs. CPU Processing (Live DJ Critical)

- [ ] Measure processing speed on your actual laptop
- [ ] Diagnose GPU memory issues before they happen
- [ ] Switch to CPU gracefully when GPU fails (don't crash)

### Error Handling & Robustness

- [ ] Make the CLI continue on error instead of crashing
- [ ] Log errors so you can debug later without losing context
- [ ] Explain why DJ software crashes are unacceptable in live settings

---

## 📝 Documentation Template (to fill as you build)

For each feature, write a short doc:

### Example: `docs/tutorial/first-use.md`

```markdown
# First Song Guide

## What This Is

A simple tutorial for new users to separate their first song.

## Why It Matters

Live DJs need to upload and split songs quickly before the gig.  
This guide assumes no prior knowledge of audio separation.

## Step-by-Step (fill in as you test)

1. Install dependencies (`python -m venv .venv && source .venv/bin/activate`)
2. Run `demo.py` to verify it works
3. ...
```

---

## ✅ Success Criteria for This Week

By the end of Day 5, you should be able to:

1. Run any audio file through the CLI and get working stems (GPU or CPU)
2. Explain what GPU vs. CPU processing means for live DJing
3. Handle one failed track gracefully without crashing the whole set
4. Document your findings in beginner-friendly terms
5. Understand the basics of Demucs' architecture from reading the code

**If you hit any issues, let me know!**  
I can help debug GPU detection errors or model download problems.
