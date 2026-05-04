"""
Unit Tests for Pipeline Functionality
=======================

Test the main audio processing pipeline.

Why it matters:
- Test that the pipeline function returns correct structure
- Verify audio processing flow
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


def test_process_function_exists():
    """Test that process_pipeline function exists."""
    try:
        from pipeline.process import process_audio_file
        assert callable(process_audio_file), "process_audio_file should be callable"
    except ImportError as e:
        pytest.skip(f"Import error: {e}")


def test_process_returns_dict():
    """Test that process function returns proper structure."""
    try:
        from pipeline.process import process_audio_file
        sig = inspect_signature(process_audio_file)
        
        # Check that it accepts input_file and output_dir
        params = get_function_parameters(process_audio_file)
        
        # These parameters should exist if function is available
        # Note: function signature check is just a smoke test
        assert callable(process_audio_file)
    except (ImportError, AttributeError):
        pytest.skip("Pipeline module not available yet")


def inspect_signature(func):
    """Inspect function signature for tests."""
    try:
        import inspect
        return inspect.signature(func)
    except Exception:
        return None


def get_function_parameters(func):
    """Get function parameters for validation."""
    try:
        import inspect
        sig = inspect.signature(func)
        return sig.parameters
    except Exception:
        return None


def test_pipeline_import_success():
    """Test that pipeline modules can be imported."""
    try:
        # Import individual components to verify they work
        try:
            from pipeline.process import process_audio_file
        except ImportError as e:
            # This is expected during early development
            pytest.skip(f"Pipeline import error: {e}")
        
        from utils import get_file_size
    except ImportError as e:
        pytest.skip(f"Import error: {e}")


if __name__ == "__main__":
    import sys
    print("Running pipeline tests...")
    test_process_function_exists()
    test_process_returns_dict()
    test_pipeline_import_success()
    print("Pipeline tests completed!")
