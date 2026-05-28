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
    """Reset module caches between tests to avoid cross-test pollution."""
    import sys
    
    # Save original state
    original_modules = set(sys.modules.keys())
    
    yield
    
    # Remove any modules that were imported during the test
    for mod_name in list(sys.modules.keys()):
        if mod_name not in original_modules:
            del sys.modules[mod_name]

