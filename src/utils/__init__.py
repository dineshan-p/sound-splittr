"""Utility functions shared across CLI, API, and tests."""

from __future__ import annotations

import os
from pathlib import Path


def get_file_size(filepath: str | Path) -> int:
    """Return file size in bytes, or 0 if the file does not exist."""
    try:
        return os.path.getsize(str(filepath))
    except OSError:
        return 0


def normalize_audio_path(path: str | Path) -> str:
    """Return an absolute, normalised path."""
    return os.path.abspath(str(path))


def format_duration(seconds: float) -> str:
    """Format a duration in seconds as ``MM:SS`` or ``HH:MM:SS``."""
    total = int(seconds)
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def validate_demucs_model_path(model_path: str | Path) -> bool:
    """Check whether a file exists at the given path."""
    return os.path.exists(str(model_path))


from src.core.demucs_helper import get_available_models  # noqa: F401


def get_stem_output_names() -> dict[str, str]:
    """Return the standard mapping of stem names to display labels."""
    return {
        "vocals": "Vocals",
        "drums": "Drums",
        "bass": "Bass",
        "other": "Other / Melody",
    }


if __name__ == "__main__":
    print("Utils module loaded.")
