"""
Utility Functions
=================

Common helper functions used throughout the project.

Separated from core logic so they can be reused across:
- CLI (src/cli/)
- Web API (future src/api/)
- Tests (tests/)
- Any other consumer
"""

from __future__ import annotations

import os
from pathlib import Path


# =============================================================================
# File / Path Utilities
# =============================================================================

def get_file_size(filepath: str | Path) -> int:
    """Return file size in bytes, or 0 if the file does not exist.

    Used by the CLI to report stem sizes and by tests to verify output.
    """
    try:
        return os.path.getsize(str(filepath))
    except OSError:
        return 0


def normalize_audio_path(path: str | Path) -> str:
    """Return an absolute, normalised path.

    Prevents subtle bugs caused by relative paths resolving differently
    depending on the current working directory.
    """
    return os.path.abspath(str(path))


# =============================================================================
# Duration Formatting
# =============================================================================

def format_duration(seconds: float) -> str:
    """Format a duration in seconds as ``MM:SS`` or ``HH:MM:SS``.

    Examples::

        >>> format_duration(225.0)
        '03:45'
        >>> format_duration(7261.5)
        '02:01:01'

    Args:
        seconds: Duration in fractional seconds.

    Returns:
        Human-readable time string without leading zeros on hours when zero.
    """
    total = int(seconds)
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


# =============================================================================
# Demucs Model Utilities
# =============================================================================

def validate_demucs_model_path(model_path: str | Path) -> bool:
    """Check whether a file exists at the given path.

    In production this could also verify the model is loadable by Demucs,
    but for now we just check existence to avoid cryptic errors later.
    """
    return os.path.exists(str(model_path))


def get_available_models() -> list[str]:
    """Return a sorted list of known Demucs model identifiers.

    This is the canonical set – if you add support for a new model,
    update this function and the CLI ``--model`` choice.
    """
    return [
        "htdemucs",
        "mdxdemucs",
        "htdemucs_6s",
    ]


def get_stem_output_names() -> dict[str, str]:
    """Return the standard mapping of stem names to display labels.

    Returns::

        {
            'vocals':  'Vocals',
            'drums':   'Drums',
            'bass':    'Bass',
            'other':   'Other / Melody',
        }
    """
    return {
        "vocals": "Vocals",
        "drums": "Drums",
        "bass": "Bass",
        "other": "Other / Melody",
    }


if __name__ == "__main__":
    print("Utils module loaded.")
