"""
Utility Functions
===========

Common helper functions used throughout the project.

Why separate utilities:
- Reusable functions
- Keep main code clean
- Easy to maintain
"""

import os
from typing import Tuple


# =============================================================================
# Audio Utilities
# =============================================================================

def get_file_size(filepath: str) -> int:
    """
    Get file size in bytes.
    
    Why we need this:
    - To show file sizes in progress displays
    - To validate file integrity
    - For disk space estimation
    
    Args:
        filepath: Path to file
        
    Returns:
        File size in bytes, or 0 if file doesn't exist
    """
    try:
        return os.path.getsize(filepath)
    except OSError:
        return 0


def format_duration(seconds: float) -> str:
    """
    Format duration as readable string (HH:MM:SS or MM:SS).
    
    Why we need this:
    - Users prefer human-readable times
    - Shows song duration in UI
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        Formatted string like "3:45" or "15:30:45"
    """
    hours, remainder = divmod(int(seconds), 3600)
    minutes, seconds = divmod(remainder, 60)
    
    if hours:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes:02d}:{seconds:02d}"  # Fixed: removed duplicate colon


def normalize_audio_path(path: str) -> str:
    """
    Normalize file path and ensure it exists.
    
    Why we need this:
    - Handle relative/absolute paths consistently
    - Prevent path traversal issues
    - Create directories if they don't exist
    
    Args:
        path: File or directory path
        
    Returns:
        Normalized absolute path
    """
    return os.path.abspath(path)


# =============================================================================
# Demucs Utilities
# =============================================================================

def validate_demucs_model_path(model_path: str) -> bool:
    """
    Validate that a Demucs model exists at the given path.
    
    Why we need this:
    - Check if model downloaded successfully
    - Prevent runtime errors from missing models
    - Show helpful error messages
    
    Args:
        model_path: Path to model file
        
    Returns:
        True if model exists, False otherwise
    """
    return os.path.exists(model_path)


def get_available_models() -> list:
    """
    List available Demucs models in the models directory.
    
    Why we need this:
    - Show user what models are available
    - Help user choose appropriate model
    - Display in web interface
    
    Returns:
        List of model filenames
    """
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    models = []
    
    try:
        models = [f for f in os.listdir(models_dir) if os.path.isfile(os.path.join(models_dir, f))]
    except ( FileNotFoundError, PermissionError ):
        pass
    
    return sorted(models)


# =============================================================================
# Output Utilities
# =============================================================================

def get_stem_output_names(stem_names: list) -> dict:
    """
    Map stem names to their output directories.
    
    Why we need this:
    - Organize stems in different folders
    - Easy cleanup of processed files
    - Support custom naming schemes
    
    Args:
        stem_names: List of stem names like ['vocals', 'drums', 'bass', 'other']
        
    Returns:
        Dictionary mapping stem names to folders
    """
    # Standard naming scheme
    return {
        'vocals': 'stems/vocals',
        'drums': 'stems/drums', 
        'bass': 'stems/bass',
        'other': 'stems/other',
        'melody': 'stems/melody'
    }
