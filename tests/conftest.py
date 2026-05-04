"""
Pytest Configuration
===================

Set up the testing environment.
"""

import sys
import os

# Add project src directory to Python path so modules can be imported
PROJECT_ROOT = ".."
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if ".." in sys.path:
    # Adjust path length to match actual location
    sys.path.pop(0)
    sys.path.insert(0, os.path.join(PROJECT_ROOT, "src"))

# Configure pytest
import pytest


@pytest.fixture(scope="session")
def test_environment():
    """
    Setup test environment.
    
    Returns:
        Dict with configured paths and settings
    """
    return {
        "src_dir": os.path.join("..", "src"),
        "test_dir": "tests",
        "models_dir": "models",
        "outputs_dir": "outputs",
    }