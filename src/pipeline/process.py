]133;A\]133;A\]133;A\"""Main audio processing pipeline for stem separation."""

import os
import torch
import torchaudio
from pathlib import Path

from src.core.audio_io import save_audio


def get_demucs_model(model_name: str = "htdemucs", device: str = "auto"):
    """Load and return a Demucs model."""
    if device == "auto":
        dev = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        dev = device

    from demucs.pretrained import get_model

    model = get_model(model_name).to(dev)
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
    """Process an audio file and separate it into individual stems."""
    input_path = Path(input_file).resolve()
    if not input_path.is_file():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    model, dev = get_demucs_model(model_name, device)
    print(f"  Model '{model_name}' loaded on {dev}")

    from demucs.separate import load_track

    SAMPLERATE = 44100  # Demucs default; matches most music content
    AUDIO_CHANNELS = 2  # stereo; Demucs expects 2-channel input
    track = load_track(str(input_path), AUDIO_CHANNELS, SAMPLERATE)
    track = track.unsqueeze(0)
    print(f"  Audio loaded: {track.shape} @ {SAMPLERATE}Hz")

    from demucs.apply import apply_model

    # Inference parameters — tune these to trade quality for speed:
    #   shifts=1:   1 = no time-reversal averaging; use 2-4 for better quality
    #   split=True: process in chunks to fit large tracks in GPU memory
    #   overlap=0.25: 25% overlap between chunks reduces edge artifacts
    #   transition_power=1.0: smooths the join at chunk boundaries (higher = smoother)
    stems = apply_model(
        model,
        track,
        shifts=1,
        split=True,
        overlap=0.25,
        transition_power=1.0,
        progress=False,
        device=dev,
        num_workers=num_workers,
    )

    if hasattr(model, 'models') and len(model.models) > 0:
        sources = getattr(model.models[0], 'sources', [f'stem_{i}' for i in range(len(stems))])
    else:
        sources = getattr(model, 'sources', [f'stem_{i}' for i in range(len(stems))])
    print(f"  Separated into {len(sources)} stems: {sources}")

    try:
        info = torchaudio.info(str(input_path))
        duration = round(info.num_frames / info.sample_rate, 2)
    except Exception:
        duration = 0.0

    stems_output = []
    for i, stem_name in enumerate(sources):
        stem_tensor = stems[0, i]
        stem_filename = f"{stem_name}.{format}"
        stem_file = output_path / stem_filename

        # Convert tensor → numpy array for audio_io.save_audio
        stem_array = stem_tensor.cpu().numpy()
        save_audio(stem_file, stem_array, sr=SAMPLERATE, fmt=format, bitrate=bitrate)

        stems_output.append({
            "name": stem_name,
            "displayName": stem_name.title(),
            "path": str(stem_file),
            "sizeBytes": stem_file.stat().st_size if stem_file.exists() else 0,
        })
        print(f"  Saved stem: {stem_name} -> {stem_file} ({stem_file.stat().st_size} bytes)")

    return {
        "file": input_path.name,
        "duration": round(duration, 2),
        "model": model_name,
        "device": dev,
        "format": format,
        "stems": stems_output,
    }


if __name__ == "__main__":
    print("Pipeline module loaded. Use the CLI or call process_audio_file() programmatically.")
