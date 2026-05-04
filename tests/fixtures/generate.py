"""
Test Data Generator
===================

Generate synthetic audio files for testing without needing real music downloads.

Why this matters:
- Creates diverse test files (different lengths, sample rates)
- Ensures tests work without external audio sources
- Documents expected behavior with known inputs

How we create synthetic audio:
- Use pure Python (no external audio libraries needed initially)
- Create random noise with controlled patterns
- Save as WAV for easy testing
"""

import numpy as np
import soundfile as sf
from pathlib import Path


def generate_test_audio_files() -> list:
    """
    Generate synthetic test audio files with known characteristics.
    
    Why we generate synthetic audio:
    - Don't need to download real songs
    - Each file has known properties for testing
    - Covers different audio scenarios
    
    Returns:
        List of created file paths
    """
    files_created = []
    
    synth_dir = Path("/home/kobe/brain_2/projects/stem_splitter/tests/fixtures/wav")
    synth_dir.mkdir(parents=True, exist_ok=True)
    
    # Scenario 1: Simple sine wave (very simple audio)
    create_synthetic_file(
        synth_dir / "simple_tone.wav",
        frequency=440,       # A4 note
        duration=3.0,        # 3 seconds
        amplitude=1.0,       # Full volume
        sample_rate=44100
    )
    files_created.append(("simple_tone.wav", "Simple 440Hz sine wave, 3 sec"))
    
    # Scenario 2: Noise with multiple frequencies
    create_synthetic_file(
        synth_dir / "complex_wave.wav",
        frequencies=[220, 330, 440, 880],  # Multiple tones
        duration=5.0,
        amplitude=0.7,
        sample_rate=44100
    )
    files_created.append(("complex_wave.wav", "Multiple frequencies, 5 sec"))
    
    # Scenario 3: Longer track
    create_synthetic_file(
        synth_dir / "long_track.wav",
        frequency=523,       # C5 note
        duration=30.0,       # 30 seconds
        amplitude=0.5,
        sample_rate=44100
    )
    files_created.append(("long_track.wav", "1 minute tone track"))
    
    files_created.append(("simple_tone.wav", "Simple 440Hz sine wave, 3 sec"))
    files_created.append(("complex_wave.wav", "Multiple frequencies, 5 sec"))
    files_created.append(("long_track.wav", "30 second tone track"))
    
    return files_created


def create_synthetic_file(
    filepath,                    # Path to save file
    frequency=440,              # Base frequency in Hz
    duration=3.0,               # Duration in seconds
    amplitude=1.0,              # Audio amplitude (0-1)
    sample_rate=44100           # Sample rate
) -> str:
    """
    Generate synthetic audio file with specified parameters.
    
    Why we need this:
    - Create test files without external audio
    - Each file has predictable, known content
    - Covers different audio characteristics
    
    Args:
        filepath: Where to save the generated audio
        frequency: Base frequency (pitch)
        duration: How long the audio is
        amplitude: Volume level (1.0 = max)
        sample_rate: Sample rate for audio creation
        
    Returns:
        Path to created file
    """
    # Generate time array
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Create simple waveform
    waveform = np.sin(2 * np.pi * frequency * t)
    
    # Apply amplitude and save
    sample_data = waveform * amplitude
    
    # Save to WAV file
    sf.write(filepath, sample_data, sample_rate)
    
    print(f"Created synthetic file: {filepath}")
    print(f"  Duration: {duration}s, Frequency: {frequency}Hz, Amplitude: {amplitude}")
    
    return str(filepath)
