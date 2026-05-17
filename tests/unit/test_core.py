"""
Unit Tests for Core Modules (audio_io, demucs_helper)
=====================================================

Tests that run without needing a GPU or real audio files.
Run with::

    pytest tests/unit/test_core.py -v

or all unit tests::

    pytest tests/unit/ -v
"""

from __future__ import annotations

import sys
import os
from pathlib import Path

# Ensure project root is on sys.path for imports
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


class TestAudioIOImports:
    """Verify that audio I/O modules can be imported cleanly."""

    def test_load_audio_exists(self):
        from src.core.audio_io import load_audio

        assert callable(load_audio), "load_audio should be a callable function"

    def test_save_audio_exists(self):
        from src.core.audio_io import save_audio

        assert callable(save_audio)

    def test_get_audio_metadata_exists(self):
        from src.core.audio_io import get_audio_metadata

        assert callable(get_audio_metadata)


class TestDemucsHelperImports:
    """Verify that the Demucs helper module can be imported."""

    def test_demucs_engine_class_exists(self):
        from src.core.demucs_helper import DemucsEngine

        assert DemucsEngine is not None, "DemucsEngine class should exist"

    def test_get_available_models_returns_dict(self):
        from src.core.demucs_helper import get_available_models

        models = get_available_models()
        assert isinstance(models, dict), "Should return a dictionary of model info"
        assert "htdemucs" in models, "Default model htdemucs should be listed"


class TestPipelineImports:
    """Verify that the pipeline module can be imported."""

    def test_process_audio_file_exists(self):
        from src.pipeline.process import process_audio_file

        assert callable(process_audio_file)
