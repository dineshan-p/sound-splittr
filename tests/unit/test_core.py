"""
Unit Tests for Core Modules
===== ==================

Test core audio I/O and Demucs integration.
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


def test_core_imports():
    """Test that all core modules can be imported."""
    from src.core.audio_io import load_audio, save_audio
    assert True


def test_process_audio_exists():
    """Test that main process function exists."""
    from src.pipeline.process import process_audio_file
    assert callable(process_audio_file)


def test_utils_functions_exist():
    """Test utility functions."""
    from src.utils import get_file_size, format_duration
    assert callable(get_file_size)
    assert callable(format_duration)