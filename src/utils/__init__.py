"""Utility functions shared across CLI, API, and tests."""

from __future__ import annotations

import os
from pathlib import Path


def get_file_size(filepath: str | Path) -> int:
    """Return the size of a file in bytes, or 0 if the file doesn't exist."""
    try:
        return os.path.getsize(str(filepath))
    except OSError:
        return 0


def normalize_audio_path(path: str | Path) -> str:
    """Return the absolute path as a string, resolving relative paths."""
    return os.path.abspath(str(path))


def format_duration(seconds: float) -> str:
    """Format a duration in seconds as ``MM:SS`` or ``HH:MM:SS``.

    Used for displaying track lengths in the CLI output and UI.
    """
    total = int(seconds)
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def validate_demucs_model_path(model_path: str | Path) -> bool:
    """Check whether a path to a local Demucs model file or directory exists."""
    return os.path.exists(str(model_path))


from src.core.demucs_helper import get_available_models  # noqa: F401


def get_stem_output_names() -> dict[str, str]:
    """Return a mapping of internal stem names to display-friendly labels.

    These names match the stem outputs produced by Demucs models.
    The "other" stem is relabeled as "Other / Melody" for clarity.
    """
    return {
        "vocals": "Vocals",
        "drums": "Drums",
        "bass": "Bass",
        "other": "Other / Melody",
    }


if __name__ == "__main__":
    print("Utils module loaded.")
