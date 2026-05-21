"""Main audio processing pipeline for stem separation."""

import os
import torch
import torchaudio
from pathlib import Path


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

    SAMPLERATE = 44100
    AUDIO_CHANNELS = 2
    track = load_track(str(input_path), AUDIO_CHANNELS, SAMPLERATE)
    track = track.unsqueeze(0)
    print(f"  Audio loaded: {track.shape} @ {SAMPLERATE}Hz")

    from demucs.apply import apply_model

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

    import soundfile as sf
    try:
        audio_info = sf.info(str(input_path))
        duration = audio_info.duration
    except Exception:
        duration = 0.0

    from demucs.audio import save_audio

    stems_output = []
    for i, stem_name in enumerate(sources):
        stem_tensor = stems[0, i]
        stem_filename = f"{stem_name}.{format}"
        stem_file = output_path / stem_filename

        save_audio(
            wav=stem_tensor,
            path=stem_file,
            samplerate=SAMPLERATE,
            bitrate=bitrate if format == 'mp3' else 0,
            clip='rescale',
            bits_per_sample=24 if format != 'mp3' else 16,
        )

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
