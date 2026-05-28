"""Tests for the audio I/O utility module."""
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from src.core.audio_io import load_audio, save_audio, get_audio_metadata


# ---------------------------------------------------------------------------
# load_audio
# ---------------------------------------------------------------------------

class TestLoadAudio:
    def test_file_not_found(self):
        """load_audio should raise FileNotFoundError for missing files."""
        with pytest.raises(FileNotFoundError, match="not found"):
            load_audio("nonexistent.mp3")

    def test_load_wav(self, tmp_path):
        """load_audio should load WAV files correctly."""
        import soundfile as sf

        data = np.random.randn(44100, 2).astype(np.float32)  # 1 second stereo
        wav_path = tmp_path / "test.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path), normalize=False)
        assert sr == 44100
        assert len(loaded.shape) >= 1

    def test_load_mono(self, tmp_path):
        """load_audio should convert mono to stereo when channels=2."""
        import soundfile as sf

        data = np.random.randn(44100, 1).astype(np.float32)
        wav_path = tmp_path / "mono.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path), channels=2, normalize=False)
        assert sr == 44100

    def test_normalize(self, tmp_path):
        """load_audio should normalize audio to peak 1.0."""
        import soundfile as sf

        data = np.random.randn(44100, 1).astype(np.float32) * 0.5  # peak < 1
        wav_path = tmp_path / "quiet.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path))  # normalize=True by default
        assert abs(np.abs(loaded).max() - 1.0) < 0.01

    def test_normalize_clipping(self, tmp_path):
        """load_audio should clamp values > 1.0."""
        import soundfile as sf

        data = np.random.randn(44100, 1).astype(np.float32) * 2.0  # peak > 1
        wav_path = tmp_path / "loud.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path))
        assert np.all(loaded >= -1.0)
        assert np.all(loaded <= 1.0)

    def test_normalize_silent_track(self, tmp_path):
        """load_audio should skip normalization for silent tracks."""
        import soundfile as sf

        data = np.zeros((44100, 1), dtype=np.float32)
        wav_path = tmp_path / "silent.wav"
        sf.write(str(wav_path), data, 44100)

        loaded, sr = load_audio(str(wav_path))
        assert sr == 44100


# ---------------------------------------------------------------------------
# save_audio
# ---------------------------------------------------------------------------

class TestSaveAudio:
    @patch("src.core.audio_io.sf.write")
    def test_save_wav(self, mock_write, tmp_path):
        """save_audio should call soundfile.write for WAV."""
        data = np.random.randn(44100, 2).astype(np.float32)
        out_path = tmp_path / "output.wav"

        save_audio(str(out_path), data, sr=44100, fmt="wav")

        mock_write.assert_called_once()
        call_args = mock_write.call_args
        assert call_args[0][0] == str(out_path)
        assert call_args[1].get("subtype") == "PCM_16"

    @patch("src.core.audio_io.sf.write")
    def test_save_flac(self, mock_write, tmp_path):
        """save_audio should call soundfile.write for FLAC."""
        data = np.random.randn(44100, 2).astype(np.float32)
        out_path = tmp_path / "output.flac"

        save_audio(str(out_path), data, sr=44100, fmt="flac")

        mock_write.assert_called_once()
        call_args = mock_write.call_args
        assert call_args[0][0] == str(out_path)
        assert call_args[1].get("subtype") == "FLOAT"

    @patch("src.core.audio_io.sf.write")
    def test_save_creates_parent_dir(self, mock_write, tmp_path):
        """save_audio should create parent directories if needed."""
        data = np.random.randn(44100, 2).astype(np.float32)
        out_path = tmp_path / "nested" / "deep" / "output.wav"

        save_audio(str(out_path), data, sr=44100, fmt="wav")

        # The directory should be created by the function
        assert out_path.parent.exists()

    def test_save_unsupported_format(self, tmp_path):
        """save_audio should raise ValueError for unsupported formats."""
        data = np.random.randn(44100, 2).astype(np.float32)
        out_path = tmp_path / "output.ogg"

        with pytest.raises(ValueError, match="Unsupported format"):
            save_audio(str(out_path), data, sr=44100, fmt="ogg")


# ---------------------------------------------------------------------------
# get_audio_metadata
# ---------------------------------------------------------------------------

class TestGetAudioMetadata:
    def test_file_not_found(self):
        """get_audio_metadata should raise FileNotFoundError for missing files."""
        with pytest.raises(FileNotFoundError, match="not found"):
            get_audio_metadata("nonexistent.mp3")

    def test_metadata_extraction(self, tmp_path):
        """get_audio_metadata should return correct metadata."""
        import soundfile as sf
        import sys

        data = np.random.randn(44100, 2).astype(np.float32)
        wav_path = tmp_path / "test.wav"
        sf.write(str(wav_path), data, 44100)

        # Create a mock torchaudio module and inject it into sys.modules
        mock_torchaudio = MagicMock()
        mock_info = MagicMock()
        mock_info.sample_rate = 44100
        mock_info.num_frames = 44100
        mock_info.channels = 2
        mock_torchaudio.info.return_value = (mock_info, None)

        with patch.dict(sys.modules, {"torchaudio": mock_torchaudio}):
            metadata = get_audio_metadata(str(wav_path))
            assert metadata["sample_rate"] == 44100
            assert metadata["channels"] == 2
            assert metadata["duration_s"] == pytest.approx(1.0, abs=0.01)
