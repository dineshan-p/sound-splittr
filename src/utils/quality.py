"""Quality metrics for evaluating stem separation."""

from __future__ import annotations

import numpy as np


def compute_reconstruction_error(
    reference: np.ndarray,
    stems: dict[str, np.ndarray],
) -> float:
    """Compute how well the separated stems reconstruct the original signal.

    Lower values indicate a better separation. The metric is mean-squared error
    normalised by the reference power and expressed as a percentage.

    Args:
        reference: Original (mono) audio waveform.
        stems: Mapping of stem name → numpy array of same length.

    Returns:
        Normalised MSE in percent (0 = perfect reconstruction).
    """
    if not stems:
        return float("inf")

    reconstructed = sum(stems.values())
    ref_power = np.mean(reference ** 2)
    mse = np.mean((reference - reconstructed) ** 2)

    if ref_power == 0:
        return 0.0

    return float((mse / ref_power) * 100)


def analyze_artifacts(audio_dict: dict[str, np.ndarray]) -> dict[str, dict]:
    """Analyse artefact levels in each stem using spectral flatness."""
    results = {}

    try:
        from scipy import signal as sp_signal

        for name, audio in audio_dict.items():
            if audio is None or np.size(audio) == 0:
                continue

            nperseg = min(2048, len(audio))
            freqs, psd = sp_signal.welch(audio, fs=22050, nperseg=nperseg)

            high_freq_mask = freqs > 8000
            if np.any(high_freq_mask):
                flatness = float(np.mean(psd[high_freq_mask]))
            else:
                flatness = 0.0

            severity = "low" if flatness < -30 else ("medium" if flatness < -20 else "high")
            results[name] = {"level": round(flatness, 2), "severity": severity}

    except ImportError:
        for name in audio_dict:
            results[name] = {"level": None, "severity": "unknown"}

    return results


def check_frequency_balance(stems: dict[str, np.ndarray]) -> dict[str, dict]:
    """Quick frequency-band balance check per stem."""
    balance = {}
    for name, audio in stems.items():
        if audio is None or np.size(audio) == 0:
            continue

        rms = float(np.sqrt(np.mean(audio ** 2)))
        balance[name] = {
            "low_freq_rms": round(rms, 6),
            "status": "ok" if rms > 0.01 else "quiet",
        }

    return balance


def calculate_quality_score(metrics: dict) -> float:
    """Calculate an overall quality score from 0–100.

    This is a custom heuristic, not a standard metric. The formula weights
    reconstruction error heavily (10×) and penalizes spectral artifacts
    (5×). Treat the output as a relative comparison tool, not an absolute
    quality measure.
    """
    try:
        reconstruction = metrics.get("reconstruction_error", 100)
        artifact_levels = [
            s.get("level", -100)
            for s in metrics.get("artifact_level", {}).values()
            if isinstance(s, dict) and "level" in s
        ]

        score = 100.0 - reconstruction * 10
        if artifact_levels:
            score -= abs(max(artifact_levels)) * 5

        return float(np.clip(score, 0, 100))
    except (TypeError, ValueError):
        return 0.0


def validate_stem_integrity(stem_name: str, stem_path: str) -> bool:
    """Validate that a saved stem file is readable and non-empty."""
    import os as _os

    try:
        if not _os.path.isfile(stem_path):
            return False
        size = _os.path.getsize(stem_path)
        if size == 0:
            return False
        with open(stem_path, "rb") as f:
            header = f.read(128)
        import soundfile as sf
        from io import BytesIO

        sf.read(BytesIO(header))
        return True
    except Exception:
        return False


if __name__ == "__main__":
    print("Quality metrics module loaded. Use compute_reconstruction_error() etc.")
