"""Tests for edge cases and error handling across the codebase."""
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure project root is in path.
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


class TestApiValidation:
    """Test API validation edge cases."""

    def test_validate_format_case_insensitive(self):
        """_validate_format should be case-insensitive."""
        from src.api.server import _validate_format
        assert _validate_format("WAV") == "wav"
        assert _validate_format("Mp3") == "mp3"
        assert _validate_format("FLAC") == "flac"

    def test_validate_format_whitespace(self):
        """_validate_format should handle whitespace."""
        from src.api.server import _validate_format
        assert _validate_format("  wav  ") == "wav"
        assert _validate_format("  MP3  ") == "mp3"

    def test_validate_model_case_insensitive(self):
        """_validate_model should be case-insensitive."""
        from src.api.server import _validate_model
        assert _validate_model("HTDEMUCS") == "htdemucs"
        assert _validate_model("MdxDemucs") == "mdxdemucs"
        assert _validate_model("HTDEMUCS_6S") == "htdemucs_6s"

    def test_validate_model_invalid_values(self):
        """_validate_model should reject invalid model names."""
        from src.api.server import _validate_model
        from fastapi import HTTPException
        with pytest.raises(HTTPException, match="Invalid model"):
            _validate_model("invalid")
        with pytest.raises(HTTPException, match="Invalid model"):
            _validate_model("")
        with pytest.raises(HTTPException, match="Invalid model"):
            _validate_model("htdemucs_extra")


class TestQueueEdgeCases:
    """Test job queue edge cases."""

    @pytest.mark.asyncio
    async def test_queue_with_empty_jobs(self):
        """get_stats should handle empty queue."""
        from src.api.queue import JobQueue
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            queue = JobQueue(jobs_dir=tmp)
            stats = await queue.get_stats()
            assert isinstance(stats, dict)
            assert "queue_size" in stats
            assert "active_count" in stats
            assert "total_jobs" in stats

    @pytest.mark.asyncio
    async def test_queue_with_many_jobs(self):
        """Queue should handle many jobs without crashing."""
        from src.api.queue import JobQueue
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            queue = JobQueue(jobs_dir=tmp)
            # Add 10 jobs
            for i in range(10):
                job = MagicMock()
                job.id = f"job_{i}"
                job.status = "queued"
                job.position = i
                queue.jobs[job.id] = job
                queue.queue.append(job.id)

            stats = await queue.get_stats()
            assert isinstance(stats, dict)
            assert stats["total_jobs"] == 10
            assert stats["queue_size"] == 10


class TestAudioIoEdgeCases:
    """Test audio I/O edge cases."""

    def test_load_audio_silent_track(self, tmp_path):
        """load_audio should handle silent tracks without crashing."""
        import numpy as np
        import soundfile as sf
        from src.core.audio_io import load_audio

        data = np.zeros((44100, 1), dtype=np.float32)
        wav_path = tmp_path / "silent.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path))
        assert sr == 44100
        assert len(loaded) > 0

    def test_load_audio_very_short(self, tmp_path):
        """load_audio should handle very short tracks."""
        import numpy as np
        import soundfile as sf
        from src.core.audio_io import load_audio

        data = np.random.randn(100, 1).astype(np.float32)
        wav_path = tmp_path / "short.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path))
        assert sr == 44100

    def test_save_audio_zero_data(self, tmp_path):
        """save_audio should handle zero data arrays."""
        import numpy as np
        from src.core.audio_io import save_audio

        # Use 1D data to avoid transpose issues
        data = np.zeros((44100,), dtype=np.float32)
        out_path = tmp_path / "silent.wav"

        save_audio(str(out_path), data, sr=44100, fmt="wav")
        assert out_path.exists()


class TestDemucsHelperEdgeCases:
    """Test demucs helper edge cases."""

    def test_get_available_models_returns_dict(self):
        """get_available_models should return a dictionary."""
        from src.core.demucs_helper import get_available_models
        result = get_available_models()
        assert isinstance(result, dict)

    def test_model_info_consistency(self):
        """All models should have consistent metadata."""
        from src.core.demucs_helper import ModelInfo
        for model_name, info in ModelInfo.items():
            assert "description" in info
            assert "stem_count" in info
            assert isinstance(info["description"], str)
            assert isinstance(info["stem_count"], int)
            assert info["stem_count"] > 0
            assert len(info["description"].strip()) > 0


class TestPipelineEdgeCases:
    """Test pipeline edge cases."""

    def test_get_demucs_model_device_selection(self):
        """get_demucs_model should select correct device."""
        with patch("src.pipeline.process.torch.cuda.is_available", return_value=True):
            with patch("demucs.pretrained.get_model") as mock_get_model:
                mock_model = MagicMock()
                mock_get_model.return_value = mock_model
                from src.pipeline.process import get_demucs_model
                model, dev = get_demucs_model()
                assert dev == "cuda"
                mock_model.to.assert_called_with("cuda")

        with patch("src.pipeline.process.torch.cuda.is_available", return_value=False):
            with patch("demucs.pretrained.get_model") as mock_get_model:
                mock_model = MagicMock()
                mock_get_model.return_value = mock_model
                from src.pipeline.process import get_demucs_model
                model, dev = get_demucs_model()
                assert dev == "cpu"


class TestServerEdgeCases:
    """Test server edge cases."""

    def test_job_to_dict_empty_stems(self, tmp_path):
        """_job_to_dict should handle jobs with empty stems."""
        from src.api.server import _job_to_dict
        from src.api.queue import Job
        from datetime import datetime, timezone

        job = Job(
            file_name="test.mp3",
            file_size=1024,
            duration_seconds=3.5,
            model_used="htdemucs",
            output_format="wav",
            bitrate=320,
            device="cuda",
            input_path=tmp_path / "input.mp3",
            output_dir=tmp_path / "output",
            status="completed",
            progress=100,
            stems=[],
            completed_at=datetime.now(timezone.utc),
        )
        result = _job_to_dict(job)
        assert result["stems"] == []
        assert result["progress"] == 100
        assert result["status"] == "completed"

    def test_job_to_dict_with_error(self, tmp_path):
        """_job_to_dict should include error message."""
        from src.api.server import _job_to_dict
        from src.api.queue import Job
        from datetime import datetime, timezone

        job = Job(
            file_name="test.mp3",
            file_size=1024,
            duration_seconds=3.5,
            model_used="htdemucs",
            output_format="wav",
            bitrate=320,
            device="cuda",
            input_path=tmp_path / "input.mp3",
            output_dir=tmp_path / "output",
            status="error",
            progress=50,
            stems=[],
            error="Processing failed",
            completed_at=datetime.now(timezone.utc),
        )
        result = _job_to_dict(job)
        assert result["status"] == "error"
        assert result["error"] == "Processing failed"
        assert result["progress"] == 50
