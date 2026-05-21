"""Demucs integration module — model metadata and loading."""

from __future__ import annotations

import torch
from typing import Dict


__all__ = [
    "ModelInfo",
    "get_available_models",
    "get_model",
]


ModelInfo: Dict[str, Dict] = {
    "htdemucs": {
        "description": "High-quality model with 4 stems (vocals, drums, bass, other)",
        "stem_count": 4,
        "recommended_for": ["rock", "pop", "electronic"],
    },
    "mdxdemucs": {
        "description": "Meta model with superior quality but slower processing",
        "stem_count": 4,
        "recommended_for": ["high_quality", "studio"],
    },
    "htdemucs_6s": {
        "description": "High-quality 6-stem version (vocals, drums, bass, other, etc.)",
        "stem_count": 6,
        "recommended_for": ["detailed", "professional"],
    },
}


def get_available_models() -> Dict[str, Dict]:
    """Return the model metadata dictionary."""
    return ModelInfo


def get_model(model_name: str = "htdemucs", device: str = "auto") -> torch.nn.Module:
    """Load and return a Demucs model ready for inference."""
    import demucs

    if device == "auto":
        device_str = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device_str = device

    model = demucs.pretrained.get_model(model_name)
    model = model.to(device_str)
    model.eval()

    return model
