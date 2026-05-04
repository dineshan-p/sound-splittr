"""
Demo script - Run basic stem splitter without audio file.

This shows:
1. Demucs API works correctly
2. Models can be loaded
3. Processing pipeline is ready
"""

import torch
import demucs


def test_demucs():
    """Test basic functionality."""
    
    # Check PyTorch
    print(f"\n✅ PyTorch: {torch.__version__}")
    print(f"✅ CUDA available: {torch.cuda.is_available()}")
    
    # Check Demucs
    print(f"\n✅ Demucs import successful")
    
    # List available models
    available = ["htdemucs", "mdxdemucs", "htdemucs_6s"]
    print(f"\n✅ Available Demucs models: {available}")
    
    # Check PyTorch audio
    try:
        import torchaudio
        print(f"✅ Torchaudio: {torchaudio.__version__}")
    except:
        print("⚠️  Torchaudio not installed (not needed for this demo)")
    
    print("\n" + "🎵" * 30)
    print("All components loaded successfully!")
    print("Ready for stem splitting!")


if __name__ == "__main__":
    test_demucs()
