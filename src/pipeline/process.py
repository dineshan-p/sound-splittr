"""
Processing Pipeline
===================

This module contains the main audio processing pipeline.

Why this matters:
- Combines all core components into simple, direct function calls
- Provides clean interface for audio processing
- Handles complex audio separation with Demucs
"""

import os
import torch
import demucs
from pathlib import Path


def process_audio_file(
    audio_tensor,
    sample_rate: int = 44100,
    output_dir: str = "./output",
    model_name: str = "htdemucs",
    normalize: bool = True,
    denoise: bool = False,
    num_workers: int = 0
) -> dict:
    """
    Main function to process audio and separate stems.
    
    This is the core function that does the heavy lifting:
    1. Takes pre-loaded audio tensor
    2. Separates into stems using Demucs model
    3. Post-processes for quality
    4. Returns paths to separated stems
    
    Args:
        audio_tensor: Pre-loaded audio tensor (torch tensor)
        sample_rate: Sample rate of audio (default: 44100)
        output_dir: Directory to save separated stems
        model_name: Which Demucs model to use
        normalize: Whether to normalize audio levels
        denoise: Whether to apply noise reduction
        num_workers: Number of parallel workers
    
    Returns:
        Dictionary with file paths to each stem
    
    Example:
        >>> audio, sr = torchaudio.load("song.mp3")
        >>> result = process_audio_file(audio, sr)
        >>> for stem in result["stems"]:
        ...     print(f"Stem: {stem}")
    """
    
    # Step 1: Ensure output directory exists
    output_path = Path(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    # Step 2: Get or load the Demucs model
    model = get_dems_model(model_name)
    
    # Step 3: Separate into stems
    # Demucs returns a dict with stem audio tensors
    stems_dict = demucs.dominant(
        model,
        audio_tensor,    # Input audio tensor
        device=model.device,
        samples_at_a_time=samples_at_a_time,
        output_dir=output_dir
    )
    
    # Step 4: Extract stem names
    stem_names = list(stems_dict.keys())
    
    # Step 5: Process each stem
    stems_output = []
    for name, stem_audio in stems_dict.items():
        # Save each stem with normalized output
        stem_filename = os.path.join(output_dir, f"{name}.mp3")
        save_audio(
            stem_audio,
            stem_filename,
            sample_rate=sample_rate
        )
        
        stems_output.append({
            "name": name,
            "path": stem_filename,
            "size": os.path.getsize(stem_filename)
        })
    
    # Step 6: Return results
    return {
        "file": "input_file.wav",  # Would come from metadata
        "stems": stems_output,
        "model": model_name,
        "duration": audio_tensor.shape[0] / sample_rate
    }

    """
    Get or load the Demucs model.
    
    Args:
        model_name: Which model to load (htdemucs, mdxdemucs, etc.)
    
    Returns:
        Loaded Demucs model
    """
    # Load model from demucs library
    model = demucs.load(model_name)
    model = model.eval()
    return model
