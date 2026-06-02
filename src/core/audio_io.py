"""Audio I/O utility module for loading and saving audio files."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Tuple

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

    The normalization step scales the signal so its peak amplitude reaches
    -1.0, preventing clipping during AI processing. Silent tracks (peak <
    0.001) are skipped to avoid division by near-zero.

    Args:
        file_path: Path to the audio file.
        sr: Target sample rate in Hz. ``None`` keeps the native rate.
        channels: Number of output channels – 1 for mono, 2 for stereo.
        normalize: Whether to scale the signal so its peak is at -1.0.

    Returns:
        Tuple of ``(audio_array, sample_rate)``.

    Raises:
        FileNotFoundError: If *file_path* does not exist.
    """
    fp = Path(file_path).resolve()
    if not fp.is_file():
        raise FileNotFoundError(f"Audio file not found: {fp}")

    print(f"\n📂 Loading audio: {fp}")

    data, orig_sr = sf.read(str(fp), always_2d=True, dtype="float32")

    print(f"  Format : {fp.suffix.upper()}")
    print(f"  Sample rate : {orig_sr} Hz")
    print(f"  Channels : {data.shape[1]} (mono={channels==1})")
    print(f"  Duration : {len(data) / orig_sr:.2f}s")

    if sr is not None and orig_sr != sr:
        from scipy import signal as sp_signal

        ratio = sr / orig_sr
        n_samples = int(len(data) * ratio)
        data = sp_signal.resample(data, len(data), n_samples).astype("float32")
        print(f"⚡ Resampled {orig_sr} Hz → {sr} Hz ({len(data)} samples)")

    if channels == 2 and data.shape[1] == 1:
        data = np.stack([data.ravel(), data.ravel()], axis=1)
    elif channels == 1 and data.shape[1] > 1:
        data = data.mean(axis=1, keepdims=True)

    if normalize:
        peak = np.abs(data).max()
        if peak > 1.0:
            print(f"⚠️  Clipping detected (peak={peak:.3f}) – hard-clamping")
            data = np.clip(data, -1.0, 1.0)
        elif peak > 0.001:
            # Threshold of 0.001 avoids dividing by near-zero values on silent
            # tracks while still catching genuinely quiet audio that needs scaling.
            data /= peak
            print("🔊 Normalized to prevent clipping")

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
    """Save a NumPy audio array to disk in the specified format.

    Handles WAV (lossless PCM), FLAC (lossless float32), and MP3 (lossy,
    via pydub). For MP3 output, the function writes a temporary WAV file
    then encodes it — this two-step process is needed because soundfile
    does not support MP3 encoding natively.

    Args:
        file_path: Where to write the output file.
        data: Audio data as a NumPy array (float32, values in [-1, 1]).
        sr: Sample rate in Hz (default: 44100).
        fmt: Output format — "wav", "flac", or "mp3".
        bitrate: MP3 encoding bitrate in kbps (only used when fmt="mp3").

    Raises:
        ValueError: If *fmt* is not one of wav, flac, or mp3.
    """
    fp = Path(file_path)

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
        from pydub import AudioSegment

        tmp_wav = fp.with_suffix(".tmp.wav")
        sf.write(str(tmp_wav), data.T if data.ndim > 1 else data, sr, subtype="PCM_16")

        audio_seg = AudioSegment.from_wav(str(tmp_wav))
        audio_seg.export(
            str(fp),
            format="mp3",
            bitrate=f"{bitrate}k",
        )
        tmp_wav.unlink(missing_ok=True)
        print(f"  Format : MP3 ({bitrate} kbps) @ {sr} Hz")

    else:
        raise ValueError(f"Unsupported format '{fmt}'. Choose 'wav', 'mp3', or 'flac'.")


def get_audio_metadata(file_path: str | Path) -> dict:
    """Read basic metadata from an audio file using torchaudio.

    Extracts sample rate, frame count, channel count, and duration.
    This is used by the API to populate job metadata before processing.

    Args:
        file_path: Path to the audio file.

    Returns:
        Dict with keys: sample_rate, num_frames, channels, duration_s.

    Raises:
        FileNotFoundError: If *file_path* does not exist.
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
    print("Audio I/O module loaded.")
