"""Shared pytest fixtures for all Python tests."""
import sys
from pathlib import Path

# Ensure the project root is in the Python path.
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))



import pytest

@pytest.fixture(autouse=True)
def reset_module_caches():
    """Reset module caches between tests to avoid cross-test pollution.

    Preserves C-extension modules (numpy, torch, scipy, soundfile, etc.)
    because deleting them from sys.modules while their shared libraries
    remain loaded in the process causes ImportError on re-import
    (Python 3.14+ refuses to load the same .so twice per process).
    """
    import sys
    import importlib

    # Save original state
    original_modules = set(sys.modules.keys())

    # C-extension packages whose shared libraries must not be detached
    # from sys.modules. These are the project's runtime dependencies that
    # contain native code and cannot be safely re-imported after deletion.
    _C_EXTENSION_PREFIXES = (
        "numpy",
        "numpy.",
        "torch",
        "torch.",
        "torchaudio",
        "torchaudio.",
        "scipy",
        "scipy.",
        "soundfile",
        "soundfile.",
        "pydub",
        "pydub.",
        "fastapi",
        "fastapi.",
        "starlette",
        "starlette.",
        "uvicorn",
        "uvicorn.",
        "click",
        "click.",
        "pydantic",
        "pydantic.",
        "httpx",
        "httpx.",
        "anyio",
        "anyio.",
    )

    yield

    # Remove any modules that were imported during the test,
    # but preserve C-extension packages.
    for mod_name in list(sys.modules.keys()):
        if mod_name not in original_modules:
            # Skip C-extension packages — their .so files stay mapped in
            # the process and re-importing them after deletion causes
            # "cannot load module more than once per process".
            if any(mod_name == p or mod_name.startswith(p) for p in _C_EXTENSION_PREFIXES):
                continue
            del sys.modules[mod_name]

