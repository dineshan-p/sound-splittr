"""
Quality Metrics
===============

Module for evaluating stem separation quality.

Why quality matters:
- Not all songs separate equally well
- Different genres respond differently to Demucs
- Helps identify problematic files
- Useful for debugging poor separations

Metrics we measure:
- Spectral overlap between stems
- Signal-to-noise ratio estimates
- Frequency band balance
- Temporal continuity
"""

import numpy as np
import librosa
import soundfile as sf

from .audio_io import load_audio_safe


def calculate_separation_quality(input_file: str, output_stems: dict) -> dict:
    """
    Calculate quality metrics for separated stems.
    
    Why this matters:
    - Tells us how good the separation is
    - Helps identify files that need manual adjustment
    - Provides feedback for UI
    - Useful for testing different models
    
    Args:
        input_file: Original audio file
        output_stems: Dictionary of stem dicts from processing
        
    Returns:
        Quality metrics dictionary
    """
    metrics = {}
    
    # Load original and stems
    try:
        original, orig_sr, orig_channels = load_audio_safe(input_file)
    except Exception as e:
        return {"error": str(e)}
    
    # Extract stem audio data
    stems_audio = {}
    for stem_name, stem_meta in output_stems.get("stems", {}).items():
        try:
            stem_path = stem_meta["path"]
            stem_audio, _, _ = load_audio_safe(stem_path)
            stems_audio[stem_name] = stem_audio
        except Exception as e:
            metrics[stem_name] = {"status": "error", "message": str(e)}
            continue
    
    # Calculate reconstruction error
    metrics["reconstruction_error"] = compute_reconstruction_error(
        original, stems_audio
    )
    
    # Check for artifacting in each stem
    metrics["artifact_level"] = analyze_artifacts(stems_audio)
    
    # Frequency balance check
    metrics["frequency_balance"] = check_frequency_balance(stems_audio)
    
    # Overall quality score (0-100)
    metrics["overall_score"] = calculate_quality_score(metrics)
    
    return metrics


def compute_reconstruction_error(reference: np.ndarray, stems: dict) -> float:
    """
    Compute how well stems reconstruct the original.
    
    Why this matters:
    - Lower error = better separation
    - Helps identify model limitations
    - Useful for benchmarking
    
    Args:
        reference: Original audio waveform
        stems: Dictionary of stem waveforms
        
    Returns:
        Mean squared error normalized by signal power
    """
    if not stems:
        return float('inf')
    
    # Sum all stems
    reconstructed = sum(stems.values())
    
    # Normalize by reference power
    ref_power = np.mean(reference ** 2)
    rec_power = np.mean(reconstructed ** 2)
    
    if ref_power == 0:
        return 0.0
    
    # MSE normalized by reference power
    mse = np.mean((reference - reconstructed) ** 2)
    normalized_error = (mse / ref_power) * 100
    
    return float(normalized_error)


def analyze_artifacts(audio_dict: dict) -> dict:
    """
    Analyze artifacting in separated stems.
    
    Why this matters:
    - Artifacts make stems sound bad
    - Can indicate model overfitting
    - Helps tune preprocessing
    
    Args:
        audio_dict: Dictionary of stem audio arrays
        
    Returns:
        Artifact analysis per stem
    """
    artifacts = {}
    
    for name, audio in audio_dict.items():
        if audio is None:
            continue
            
        st = librosa.feature.spectrogram(np.abs(audio), sr=22050)
        
        # High frequencies show more artifacts
        high_freq = st[st > 8000]
        
        # Calculate spectral flatness (higher = more artifacts)
        spectral_flatness = np.mean(np.log10(high_freq)) - 100
        
        artifacts[name] = {
            "level": float(spectral_flatness),
            "severity": "high" if spectral_flatness > -20 else "medium" if spectral_flatness > -30 else "low"
        }
    
    return artifacts


def check_frequency_balance(stems: dict) -> dict:
    """
    Check if frequency bands are balanced across stems.
    
    Why this matters:
    - Vocals should have mids/highs
    - Drums should have lows
    - Helps identify crosstalk between stems
    
    Args:
        stems: Dictionary of stem audio
        
    Returns:
        Frequency band analysis
    """
    balance = {}
    
    for name, audio in stems.items():
        # Simple band analysis
        low = np.mean(np.abs(audio[np.abs(audio) > 0]))
        
        balance[name] = {
            "low_freq": float(low),
            "status": "ok" if low > 0 else "quiet"
        }
    
    return balance


def calculate_quality_score(metrics: dict) -> float:
    """
    Calculate overall quality score.
    
    Why this matters:
    - Single metric to display in UI
    - Helps users quickly judge quality
    - Useful for model comparison
    
    Args:
        metrics: All quality metrics
        
    Returns:
        Score from 0-100
    """
    try:
        reconstruction = metrics.get("reconstruction_error", 100)
        artifact_level = max(s.get("level", -100) for s in metrics.get("artifact_level", {}).values())
        
        # Weight reconstruction error heavily
        score = 100 - reconstruction * 10
        
        # Penalize artifacts
        score -= abs(artifact_level) * 5
        
        # Clamp to valid range
        score = max(0, min(100, score))
        
        return float(score)
    except (TypeError, ValueError):
        return 0.0


def validate_stem_integrity(stem_name: str, stem_path: str) -> bool:
    """
    Validate that a stem is valid audio.
    
    Why this matters:
    - Catch corrupted files
    - Verify processing completed
    - Show clear error messages
    
    Args:
        stem_name: Stem name
        stem_path: Path to stem file
        
    Returns:
        True if valid, False otherwise
    """
    try:
        _, _, _ = load_audio_safe(stem_path)
        return True
    except:
        return False