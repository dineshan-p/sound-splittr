"""
Unit Tests for Pipeline Functionality
======================================

Tests that verify process_audio_file has the expected signature and behaviour
with synthetic (non-existent) input files.  No GPU or real audio required.

Run with::

    pytest tests/unit/test_pipeline.py -v
"""

from __future__ import annotations

import sys
import inspect
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


class TestProcessAudioFileSignature:
    """Verify process_audio_file has the expected parameters."""

    def test_function_exists(self):
        from src.pipeline.process import process_audio_file

        assert callable(process_audio_file), "process_audio_file must be callable"

    def test_has_required_parameters(self):
        from src.pipeline.process import process_audio_file

        sig = inspect.signature(process_audio_file)
        params = list(sig.parameters.keys())

        # Core parameters that callers depend on
        assert "input_file" in params, "Must accept input_file argument"
        assert "output_dir" in params, "Must accept output_dir argument"
        assert "model_name" in params, "Must accept model_name argument"
        assert "device" in params, "Must accept device argument"

    def test_default_output_format(self):
        from src.pipeline.process import process_audio_file

        sig = inspect.signature(process_audio_file)
        fmt_param = sig.parameters.get("format")

        assert fmt_param is not None, "format parameter should exist"
        # Default should be 'mp3' per the project config
        assert str(fmt_param.default) == "mp3", f"Default format should be 'mp3', got {fmt_param.default!r}"


class TestProcessAudioFileRaisesOnMissingInput:
    """Verify process_audio_file raises FileNotFoundError for missing input."""

    def test_missing_input_raises(self):
        from src.pipeline.process import process_audio_file

        try:
            process_audio_file(
                input_file="/nonexistent/path/song.mp3",
                output_dir="./test_output_placeholder",
            )
        except FileNotFoundError:
            return  # Expected – test passes
        except ImportError as exc:
            # If demucs isn't installed yet, that's fine for this smoke test
            assert "demucs" in str(exc).lower() or "torch" in str(exc).lower()
            return

        raise AssertionError("Expected FileNotFoundError was not raised")


class TestPipelineModuleStructure:
    """Verify the pipeline module has expected exports."""

    def test_get_demucs_model_exists(self):
        from src.pipeline.process import get_demucs_model

        assert callable(get_demucs_model)
