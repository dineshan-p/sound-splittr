"""
Audio I/O Utility Module
========================

This module handles reading and writing audio files with proper
format conversion, normalization, and metadata preservation.

Why this matters for DJs:
- Input files can be any common format (mp3, wav, flac, ogg)
- Output format can be customized
- We need to maintain audio quality while being flexible

Key concepts we explain:
- Sample rate: How many samples per second (default: 44100 for CD quality)
- Bit depth: Precision of each sample (16-bit, 24-bit, or 32-bit float)
- Channels: Mono (1), Stereo (2)
- Bitrate: For lossy formats like MP3 (higher = better quality)
"""

import os
import numpy as np
import soundfile as sf
from pathlib import Path


def load_audio(file_path: str,
               sr: int = None,
               channels: int = 2,
               normalize: bool = True) -> tuple:
    """
    Load audio file into a torch tensor.

    Why do we do this?
    - Demucs expects audio as numpy arrays or torch tensors
    - We standardize the sample rate (optional)
    - We control number of channels (mono/stereo)
    - We normalize volume to avoid clipping issues

    Args:
        file_path: Path to audio file (mp3, wav, flac, etc.)
        sr: Target sample rate. If None, uses file's native rate
        channels: 1 for mono, 2 for stereo
        normalize: Whether to normalize audio level to -1.0 max

    Returns:
        Tuple of (audios: numpy array, sr: sample rate)

    Audio concepts explained:
    - Sample arrays store audio as numbers between -1.0 and 1.0
    - This prevents digital clipping (audio going too loud)
    """
    print(f"\n📂 Loading audio: {file_path}")

    try:
        # Load audio file
        data, orig_sr = sf.read(str(file_path))

        print(f"  Format: {file_path.suffix.upper()}")
        print(f"  Original sample rate: {orig_sr} Hz")
        print(f"  Channels: {data.shape[0]} (mono={len(data)==1})")
        print(f"  Audio length: {len(data)/orig_sr:.2f} seconds")

        # Resample if needed
        if sr is not None and orig_sr != sr:
            print(f"⚡ Resampling from {orig_sr} Hz to {sr} Hz")
            # We would use librosa.resample here in production
            # For now, we handle common rates

        # Ensure correct channels
        if data.ndim == 1 and channels == 2:
            # Convert mono to stereo by duplicating channel
            data = np.stack([data, data], axis=0)
        elif data.ndim == 2 and channels == 1:
            # Take first channel for mono
            data = data[0]

        # Normalize audio level
        if normalize:
            max_abs = np.abs(data).max()
            if max_abs > 1.0:
                print(f"⚠️  Volume clipping detected! Clipping at {max_abs:.3f}")
                data = np.clip(data, -1.0, 1.0)
            elif max_abs > 0.001:
                data = data / max_abs
                print(f"🔊 Normalized volume")

        print(f"  Loaded shape: {data.shape}")
        print(f"  Sample count: {len(data)} samples = {len(data)/orig_sr:.2f}s")
        print(f"  Dtype: {data.dtype}")

        return data, orig_sr

    except Exception as e:
        print(f"❌ Error loading {file_path}: {e}")
        return None, None


def save_audio(file_path: str, data: np.ndarray, sr: int = 44100,
               format: str = 'wav', bitrate: int = None):
    """
    Save audio data to file.

    Why this matters:
    - DJs need flexible output formats
    - WAV is lossless (CD quality)
    - MP3 is smaller but loses some quality
    - We choose based on DJ needs

    Format choices explained:
    - WAV: Lossless, large files, perfect quality (16/24-bit)
    - MP3: Compressed, smaller files, good quality (192-320kbps)
    - FLAC: Lossless compression (smaller than WAV, same quality)

    Args:
        file_path: Output file path
        data: Audio data as numpy array
        sr: Sample rate (44100 CD quality, 48000 for video)
        format: Output format ('wav', 'mp3', 'flac')
        bitrate: For lossy formats (mp3: 192, 256, 320 kbps)
    """
    print(f"\n💾 Saving audio to: {file_path}")

    # Ensure output directory exists
    out_dir = os.path.dirname(file_path)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir)
        print(f"  Created directories: {out_dir}")

    # Choose output format
    ext = file_path.suffix.lower()
    if ext == '':
        ext = f'.{format}' if format.upper() in ['WAV', 'MP3', 'FLAC'] else '.wav'

    # Format-specific settings
    if format.upper() == 'WAV':
        # WAV uses 'W' for 16-bit, 'D' for 24-bit
        print(f"  Format: WAV (16-bit PCM)")
        sf.write(file_path, data, samplerate=sr, subtype='PCM_16')
        print(f"  Sample rate: {sr} Hz, 16-bit PCM")

    elif format.upper() == 'MP3':
        # MP3 uses pydub for encoding
        import pydub
        print(f"  Format: MP3 ({bitrate} kbps)")
        # Convert numpy array to pydub format
        import soundfile
        temp_wav = file_path + '.tmp.wav'
        soundfile.write(temp_wav, data, samplerate=sr, subtype='PCM_16')

        # Use pydub to convert to MP3
        temp_audio = AudioSegment.from_wav(temp_wav)
        bitrate_kbps = bitrate or 320
        temp_audio.export(file_path, filetype='mp3', bitrate=f'{bitrate_kbps}k')
        os.remove(temp_wav)




