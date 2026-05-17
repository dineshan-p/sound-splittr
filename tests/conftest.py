"""
Pytest Configuration
====================

Sets up the test environment by adding the project root to sys.path
so that ``from src.core.audio_io import ...`` works in all tests.
"""

import pytest
import sys
from pathlib import Path

# Add the project root (parent of tests/) so 'src' is importable
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


@pytest.fixture(scope="session")
def test_environment():
    """Provide common paths for tests.

    Returns a dict with canonical directory locations so tests don't need to
    construct paths manually.  This centralises path logic in one place.
    """
    return {
        "project_root": str(_PROJECT_ROOT),
        "src_dir": str(_PROJECT_ROOT / "src"),
        "test_dir": str(_PROJECT_ROOT / "tests"),
        "fixtures_dir": str(_PROJECT_ROOT / "tests" / "fixtures"),
        "models_dir": str(_PROJECT_ROOT / "models"),
        "outputs_dir": str(_PROJECT_ROOT / "outputs"),
    }
