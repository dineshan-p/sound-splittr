"""
Unit Tests for Utility Functions
==================================

Test utility functions like file size, duration formatting, etc.
"""

import os
import sys
sys.path.insert(0, 'src')

from src.utils import get_file_size, format_duration, normalize_audio_path


def test_get_file_size(tmp_path):
    """Test file size function with a temp file."""
    # Create a test file
    test_file = tmp_path / "test.txt"
    test_file.write_text("test content")
    
    # Get file size
    size = get_file_size(str(test_file))
    assert size > 0, "File size should be positive"


def test_format_duration():
    """Test duration formatting."""
    # Test various durations
    assert format_duration(60) == "01:00"
    assert format_duration(3661) == "01:01:01"
    assert format_duration(0) == "00:00"


def test_normalize_audio_path(tmp_path):
    """Test path normalization."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("test")
    
    normalized = normalize_audio_path(str(test_file))
    assert os.path.isabs(normalized)
