"""
Processing Pipeline
===================

This module contains the main audio processing pipeline.

Why this matters:
- Combines all core components into a single workflow function
- Provides clean interface for CLI and future API endpoints
- Handles complex audio separation with Demucs under the hood
"""

import os
import torch
import torchaudio
from pathlib import Path


def get_dems_model(model_name: str = "htdemucs", device: str = "auto"):
    """Load and return a Demucs model.

    Args:
        model_name: Which model to load (htdemucs, mdxdemucs, etc.)
        device: Hardware device - 'cuda', 'cpu', or 'auto'.

    Returns:
        Loaded Demucs model ready for inference.
    """
    import demucs

    if device == "auto":
        dev = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        dev = device

    model = demucs.load(model_name).to(dev)
    model.eval()
    return model, dev


def process_audio_file(
    input_file: str,
    output_dir: str = "./output",
    model_name: str = "htdemucs",
    device: str = "auto",
    format: str = "mp3",
    bitrate: int = 320,
    num_workers: int = 2,
) -> dict:
    """Process an audio file and separate it into individual stems.

    This is the core entry-point used by both the CLI and any future API / backend service.
    It loads a Demucs model, runs separation via ``demucs.dominant``, then saves each stem
    to disk using the requested output format.

    Args:
        input_file: Path to the input audio file (MP3, WAV, FLAC, OGG, …).
        output_dir: Directory where separated stems will be written.
        model_name: Name of the Demucs model to use.
        device: Hardware device for inference ('cuda', 'cpu', or 'auto').
        format: Output audio format - ``'mp3'``, ``'wav'`` or ``'flac'``.
        bitrate: MP3 encoding bitrate in kbps (default 320).
        num_workers: Number of parallel workers for Demucs processing.

    Returns:
        Dictionary with metadata about the processed stems, e.g.:

        .. code-block:: python

            {
                "file": "song.mp3",
                "duration": 185.32,
                "model": "htdemucs",
                "stems": [
                    {"name": "vocals", "path": "./output/vocals.mp3", "size": 4_192_000},
                    ...
                ],
            }

    Raises:
        FileNotFoundError: If *input_file* does not exist.
        RuntimeError: If Demucs separation fails.
    """
    # ------------------------------------------------------------------
    # Step 1 – Validate inputs
    # ------------------------------------------------------------------
    input_path = Path(input_file).resolve()
    if not input_path.is_file():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Step 2 – Load the Demucs model
    # ------------------------------------------------------------------
    model, dev = get_dems_model(model_name, device)
    print(f"  Model '{model_name}' loaded on {dev}")

    # ------------------------------------------------------------------
    # Step 3 – Run separation via demucs.dominant()
    # ------------------------------------------------------------------
    import demucs

    result = demucs.dominant(
        model,
        str(input_path),          # input audio file path
        str(output_path),         # directory for output stems
        n_jobs=num_workers,       # parallel workers
        overwrite=True,           # overwrite existing files
    )

    # ``demucs.dominant`` returns a dict mapping stem name -> tensor (or Path)
    # depending on the return type. We handle both cases below.

    # ------------------------------------------------------------------
    # Step 4 – Determine duration from the input file
    # ------------------------------------------------------------------
    metadata, _ = torchaudio.info(str(input_path))
    duration = metadata.num_frames / metadata.sample_rate if metadata else 0.0

    # ------------------------------------------------------------------
    # Step 5 – Collect stem paths & sizes
    # ------------------------------------------------------------------
    stems_output = []
    for name in result:
        stem_file = output_path / f"{name}.{format}"
        stems_output.append({
            "name": str(name),
            "path": str(stem_file),
            "size": stem_file.stat().st_size if stem_file.exists() else 0,
        })

    return {
        "file": input_path.name,
        "duration": round(duration, 2),
        "model": model_name,
        "device": dev,
        "format": format,
        "stems": stems_output,
    }


if __name__ == "__main__":
    # Quick smoke test when run directly
    print("Pipeline module loaded. Use the CLI or call process_audio_file() programmatically.")
