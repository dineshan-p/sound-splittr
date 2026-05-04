"""
Test Audio Fixtures Directory
=============================

This directory contains sample audio files for testing the stem splitter.

Why we need test fixtures:
- Verify audio processing with different file formats
- Test edge cases (very short/long songs, low/high quality)
- Ensure the splitter works across different genres
- Test error handling with corrupted files

How to use:
These files should be here for pytest to find them automatically.
If you don't have real audio files, the test suite will be skipped gracefully.
"""

import os
from pathlib import Path


# Create directories for test fixtures
TEST_FIXTURES_DIR = Path("./tests/fixtures")
WAV_FILES_DIR = TEST_FIXTURES_DIR / "wav"
MP3_FILES_DIR = TEST_FIXTURES_DIR / "mp3"


def check_fixture_exists(filename: str) -> bool:
    """
    Check if a specific test fixture exists.
    
    Why this is needed:
    - Some tests need actual audio files
    - If files don't exist, skip gracefully
    - Don't fail the entire test suite
    """
    wav_dir = WAV_FILES_DIR / filename
    mp3_dir = MP3_FILES_DIR / filename
    
    return wav_dir.exists() or mp3_dir.exists()


# Common test scenarios
def get_test_files() -> list:
    """
    Return list of available test files in fixtures.
    
    Returns:
        List of (filename, format, description) tuples
    """
    files = []
    
    wav_dir = "tests/fixtures/wav/"
    mp3_dir = "tests/fixtures/mp3/"
    
    try:
        # Check wav files
        if os.path.exists(wav_dir):
            for f in os.listdir(wav_dir):
                if os.path.isfile(os.path.join(wav_dir, f)):
                    files.append((f, "wav", f"WAV {f}"))
                    
        # Check mp3 files  
        if os.path.exists(mp3_dir):
            for f in os.listdir(mp3_dir):
                if os.path.isfile(os.path.join(mp3_dir, f)):
                    files.append((f, "mp3", f"MP3 {f}"))
                    
    except Exception:
        pass
    
    return files
