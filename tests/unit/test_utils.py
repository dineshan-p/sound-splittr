"""
Unit Tests for Utility Functions
==================================

Tests that run without any external dependencies (no GPU, no audio files).

Run with::

    pytest tests/unit/test_utils.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


class TestFormatDuration:
    """Tests for the format_duration helper."""

    def test_short_duration(self):
        from src.utils import format_duration

        result = format_duration(225.0)  # 3 min 45 sec
        assert result == "03:45", f"Expected '03:45', got '{result}'"

    def test_longer_duration(self):
        from src.utils import format_duration

        result = format_duration(7261.0)  # 2 hours 1 min 1 sec
        assert result == "02:01:01", f"Expected '02:01:01', got '{result}'"

    def test_zero(self):
        from src.utils import format_duration

        assert format_duration(0.0) == "00:00"


class TestGetFileSize:
    """Tests for the get_file_size helper."""

    def test_nonexistent_file_returns_zero(self):
        from src.utils import get_file_size

        result = get_file_size("/tmp/does_not_exist_12345.txt")
        assert result == 0, "Non-existent file should return size 0"


class TestNormalizeAudioPath:
    """Tests for the normalize_audio_path helper."""

    def test_returns_absolute_path(self):
        from src.utils import normalize_audio_path

        result = normalize_audio_path("./relative/path")
        assert Path(result).is_absolute(), "Should return an absolute path"


class TestGetAvailableModels:
    """Tests for the get_available_models utility."""

    def test_returns_list_of_strings(self):
        from src.utils import get_available_models

        models = get_available_models()
        assert isinstance(models, list), "Must return a list"
        assert all(isinstance(m, str) for m in models), "All items must be strings"

    def test_contains_default_model(self):
        from src.utils import get_available_models

        models = get_available_models()
        assert "htdemucs" in models


class TestGetStemOutputNames:
    """Tests for the stem naming helper."""

    def test_returns_dict_with_four_stems(self):
        from src.utils import get_stem_output_names

        names = get_stem_output_names()
        expected_keys = {"vocals", "drums", "bass", "other"}
        assert set(names.keys()) == expected_keys, f"Expected keys {expected_keys}, got {set(names.keys())}"


class TestValidateDemucsModelPath:
    """Tests for the model path validator."""

    def test_existing_path_returns_true(self):
        from src.utils import validate_demucs_model_path

        # /dev/null always exists on Unix-like systems
        assert validate_demucs_model_path("/dev/null") is True

    def test_nonexistent_path_returns_false(self):
        from src.utils import validate_demucs_model_path

        result = validate_demucs_model_path("/tmp/does_not_exist_xyz_12345")
        assert result is False


class TestQualityMetrics:
    """Tests for the quality metrics module."""

    def test_validate_stem_integrity_nonexistent(self):
        from src.utils.quality import validate_stem_integrity

        assert validate_stem_integrity("vocals", "/tmp/nonexistent_stem.wav") is False

    def test_compute_reconstruction_error_empty_stems(self):
        from src.utils.quality import compute_reconstruction_error
        import numpy as np

        result = compute_reconstruction_error(np.array([0.1, 0.2]), {})
        assert result == float("inf"), "Empty stems should return inf reconstruction error"
