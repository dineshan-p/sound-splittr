"""
Test Audio File Generator
==========================

Creates synthetic WAV files for unit/integration tests.  No real music
download needed – every file contains a deterministic sine wave so the
output is always reproducible.

Usage::

    python tests/fixtures/generate.py          # generates all fixtures
    python -c "from fixtures.generate import generate_sine; print(generate_sine('/tmp/test.wav', 440, 2))"

File format:
- WAV (PCM 16-bit) – portable and easy for soundfile to read/write
- Duration ≤ 5 s per file so tests stay fast
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Tuple

import numpy as np
import soundfile as sf


# Directory where generated files will live.
FIXTURES_DIR = Path(__file__).resolve().parent / "wav"


def generate_sine(
    filepath: str | Path,
    frequency: float = 440.0,
    duration: float = 3.0,
    sample_rate: int = 44100,
) -> Path:
    """Generate a simple sine wave and save it as WAV.

    Args:
        filepath: Where to write the file (``.wav`` extension added if missing).
        frequency: Pitch in Hz (e.g. 440 = A4).
        duration: Length in seconds.
        sample_rate: Samples per second.

    Returns:
        Path to the created file.
    """
    fp = Path(filepath)
    if fp.suffix.lower() != ".wav":
        fp = fp.with_suffix(".wav")
    fp.parent.mkdir(parents=True, exist_ok=True)

    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    waveform = (np.sin(2 * np.pi * frequency * t) * 0.8).astype(np.float32)

    sf.write(str(fp), waveform, sample_rate, subtype="PCM_16")
    print(f"  ✓ {fp.name} ({duration:.1f}s @ {frequency:.0f}Hz)")
    return fp


def generate_noise(
    filepath: str | Path,
    duration: float = 3.0,
    sample_rate: int = 44100,
) -> Path:
    """Generate white noise and save as WAV."""
    fp = Path(filepath).with_suffix(".wav")
    fp.parent.mkdir(parents=True, exist_ok=True)

    data = (np.random.randn(int(sample_rate * duration)) * 0.3).astype(np.float32)
    sf.write(str(fp), data, sample_rate, subtype="PCM_16")
    print(f"  ✓ {fp.name} ({duration:.1f}s noise)")
    return fp


def generate_stereo(
    filepath: str | Path,
    freq_left: float = 440.0,
    freq_right: float = 523.0,
    duration: float = 3.0,
) -> Path:
    """Generate a stereo file with different tones in each channel."""
    fp = Path(filepath).with_suffix(".wav")
    fp.parent.mkdir(parents=True, exist_ok=True)

    sr = 44100
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    left = (np.sin(2 * np.pi * freq_left * t) * 0.5).astype(np.float32)
    right = (np.sin(2 * np.pi * freq_right * t) * 0.5).astype(np.float32)
    stereo = np.stack([left, right], axis=-1)

    sf.write(str(fp), stereo, sr, subtype="PCM_16")
    print(f"  ✓ {fp.name} (stereo L={freq_left:.0f}R={freq_right:.0f})")
    return fp


def generate_all() -> List[Tuple[str, str]]:
    """Generate every test fixture file.

    Returns:
        List of ``(filename, description)`` tuples for reporting.
    """
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

    files = [
        ("simple_tone.wav", "440 Hz sine wave, 3 s"),
        ("complex_wave.wav", "Multiple frequencies mixed, 3 s"),
        ("stereo_test.wav", "Different tones in L/R channels, 3 s"),
        ("noise_sample.wav", "White noise, 2 s (edge case)"),
    ]

    print(f"\nGenerating test fixtures in {FIXTURES_DIR}:\n")

    generate_sine(FIXTURES_DIR / "simple_tone.wav", frequency=440.0, duration=3.0)
    # Complex wave: sum of multiple frequencies
    fp = FIXTURES_DIR / "complex_wave.wav"
    sr = 44100
    t = np.linspace(0, 3, int(sr * 3), endpoint=False)
    waveform = (np.sin(2 * np.pi * 220 * t) +
                np.sin(2 * np.pi * 330 * t) +
                np.sin(2 * np.pi * 440 * t) +
                np.sin(2 * np.pi * 880 * t)) * 0.2
    sf.write(str(fp), waveform.astype(np.float32), sr, subtype="PCM_16")
    print(f"  ✓ {fp.name} (multiple frequencies)")

    generate_stereo(FIXTURES_DIR / "stereo_test.wav", freq_left=440, freq_right=523)
    generate_noise(FIXTURES_DIR / "noise_sample.wav", duration=2.0)

    print(f"\n✅ {len(files)} fixture files created in {FIXTURES_DIR}\n")
    # Return list of (filename_string, description)
    result: List[Tuple[str, str]] = []
    for fname, desc in files:
        result.append((Path(fname).name, desc))
    return result


if __name__ == "__main__":
    generate_all()
