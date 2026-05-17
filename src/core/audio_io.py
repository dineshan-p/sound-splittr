"""
Audio I/O Utility Module
========================

This module handles reading and writing audio files with proper
format conversion, normalization, and metadata handling.

Why this matters for DJs:
- Input files can be any common format (mp3, wav, flac, ogg)
- Output format is configurable per user preference
- Audio quality is preserved through the separation pipeline

Key concepts explained inline:
- Sample rate : how many samples per second  (44100 = CD quality)
- Bit depth   : precision of each sample     (16-bit, 24-bit, or float32)
- Channels    : mono (1) vs stereo (2)
- Bitrate     : for lossy formats like MP3   (higher = better quality)
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Tuple, Optional

import numpy as np
import soundfile as sf


def load_audio(
    file_path: str | Path,
    sr: int | None = None,
    channels: int = 2,
    normalize: bool = True,
) -> Tuple[np.ndarray, int]:
    """Load an audio file into a NumPy array.

    Demucs and PyTorch expect audio as float32 arrays with values in the
    range ``[-1.0, 1.0]``. This function handles format conversion so the
    caller never has to worry about whether the input is MP3, WAV, or FLAC.

    Args:
        file_path: Path to the audio file (MP3, WAV, FLAC, OGG, …).
        sr: Target sample rate in Hz.  ``None`` keeps the native rate.
        channels: Number of output channels – 1 for mono, 2 for stereo.
        normalize: Whether to scale the signal so its peak is at -1.0.

    Returns:
        Tuple of ``(audio_array, sample_rate)`` where *audio_array* has shape
        ``(*channels, samples)`` or ``(samples,)`` for mono.

    Raises:
        FileNotFoundError: If *file_path* does not exist.
        RuntimeError: If the file cannot be decoded by soundfile.

    Example::

        >>> data, rate = load_audio("my_song.mp3")
        >>> print(data.shape)  # e.g. (2, 44100 * duration_seconds)
    """
    fp = Path(file_path).resolve()
    if not fp.is_file():
        raise FileNotFoundError(f"Audio file not found: {fp}")

    print(f"\n📂 Loading audio: {fp}")

    # soundfile reads the file into a (samples, channels) array with dtype float64
    data, orig_sr = sf.read(str(fp), always_2d=True, dtype="float32")

    print(f"  Format : {fp.suffix.upper()}")
    print(f"  Sample rate : {orig_sr} Hz")
    print(f"  Channels : {data.shape[1]} (mono={channels==1})")
    print(f"  Duration : {len(data) / orig_sr:.2f}s")

    # ------------------------------------------------------------------
    # Resample if a specific sample rate was requested.
    # For simplicity we use scipy which is already pulled in by librosa / soundfile.
    # ------------------------------------------------------------------
    if sr is not None and orig_sr != sr:
        from scipy import signal as sp_signal

        ratio = sr / orig_sr
        n_samples = int(len(data) * ratio)
        data = sp_signal.resample(data, len(data), n_samples).astype("float32")
        print(f"⚡ Resampled {orig_sr} Hz → {sr} Hz ({len(data)} samples)")

    # ------------------------------------------------------------------
    # Channel handling
    # ------------------------------------------------------------------
    if channels == 2 and data.shape[1] == 1:
        # Mono → stereo (duplicate)
        data = np.stack([data.ravel(), data.ravel()], axis=1)
    elif channels == 1 and data.shape[1] > 1:
        # Stereo → mono (average of channels)
        data = data.mean(axis=1, keepdims=True)

    # ------------------------------------------------------------------
    # Normalize to prevent clipping / too-quiet signals.
    # Audio stored as float32 in range [-1.0, 1.0].
    # ------------------------------------------------------------------
    if normalize:
        peak = np.abs(data).max()
        if peak > 1.0:
            print(f"⚠️  Clipping detected (peak={peak:.3f}) – hard-clamping")
            data = np.clip(data, -1.0, 1.0)
        elif peak > 0.001:
            data /= peak
            print("🔊 Normalized to prevent clipping")

    # Transpose back to (samples,) or (channels, samples) for downstream use
    if channels == 1:
        data = data.ravel()
    else:
        data = data.T

    print(f"  Final shape : {data.shape} @ {sr or orig_sr} Hz")
    return data, sr or orig_sr


def save_audio(
    file_path: str | Path,
    data: np.ndarray,
    sr: int = 44100,
    fmt: str = "wav",
    bitrate: int = 320,
) -> None:
    """Save a NumPy audio array to disk.

    Supports WAV (lossless PCM), MP3 (via pydub → FFmpeg), and FLAC (lossless).

    Args:
        file_path: Output path for the stem file.
        data: Audio samples as float32 NumPy array in ``[-1, 1]`` range.
        sr: Sample rate in Hz (default 44100 = CD quality).
        fmt: Output format – ``'wav'``, ``'mp3'``, or ``'flac'``.
        bitrate: MP3 encoding bitrate in kbps (only used when *fmt* == 'mp3').
    """
    fp = Path(file_path)

    # Ensure parent directories exist
    if not fp.parent.exists():
        fp.parent.mkdir(parents=True, exist_ok=True)

    fmt_lower = fmt.lower()

    print(f"\n💾 Saving stem → {fp}")

    if fmt_lower == "wav":
        sf.write(str(fp), data.T if data.ndim > 1 else data, sr, subtype="PCM_16")
        print(f"  Format : WAV (16-bit PCM) @ {sr} Hz")

    elif fmt_lower == "flac":
        sf.write(str(fp), data.T if data.ndim > 1 else data, sr, subtype="FLOAT")
        print(f"  Format : FLAC (lossless float32) @ {sr} Hz")

    elif fmt_lower == "mp3":
        # MP3 requires pydub which wraps FFmpeg under the hood.
        from pydub import AudioSegment

        # Write a temporary WAV first because pydub can't write directly from numpy
        tmp_wav = fp.with_suffix(".tmp.wav")
        sf.write(str(tmp_wav), data.T if data.ndim > 1 else data, sr, subtype="PCM_16")

        audio_seg = AudioSegment.from_wav(str(tmp_wav))
        audio_seg.export(
            str(fp),
            format="mp3",
            bitrate=f"{bitrate}k",
        )
        tmp_wav.unlink(missing_ok=True)  # clean up temp file
        print(f"  Format : MP3 ({bitrate} kbps) @ {sr} Hz")

    else:
        raise ValueError(f"Unsupported format '{fmt}'. Choose 'wav', 'mp3', or 'flac'.")


def get_audio_metadata(file_path: str | Path) -> dict:
    """Read basic metadata from an audio file.

    Args:
        file_path: Path to the input audio file.

    Returns:
        Dictionary with keys ``'sample_rate'``, ``'num_frames'``,
        ``'channels'``, and ``'duration_s'``.
    """
    fp = Path(file_path).resolve()
    if not fp.is_file():
        raise FileNotFoundError(f"Audio file not found: {fp}")

    import torchaudio

    info, _ = torchaudio.info(str(fp))
    return {
        "sample_rate": info.sample_rate,
        "num_frames": info.num_frames,
        "channels": info.channels,
        "duration_s": round(info.num_frames / info.sample_rate, 3),
    }


if __name__ == "__main__":
    print("Audio I/O module loaded. Use load_audio() and save_audio() directly.")
