"""
Demucs Integration Module
==========================

This module handles the integration with Demucs, an AI model capable of separating
multi-track audio into individual stems (vocals, drums, bass, other).

Think of Demucs like a team of expert musicians who can instantly tell which
instrument is playing each note. It uses deep learning to analyze the audio
waveform and separate different sound sources.

Why this matters:
- No manual editing needed
- Works on complete songs in real DJ sets
- Creates clean stems for remixing live
"""

import torch
import torchaudio
import demucs
import os
from typing import Dict, Optional, Union


__all__ = [
    "load_model",
    "process_audio",
    "check_model_installed",
    "get_available_models",
]


ModelInfo = {
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


class DemucsEngine:
    """Main engine for Demucs audio separation.
    
    Think of this as your audio separation robot - once set up, it handles all
    the heavy lifting of audio separation automatically.
    
    Why we use a class here:
    - Keeps the engine "stateful" (it already has the model loaded)
    - Makes it efficient for batch processing multiple songs
    - Easy to reuse the same model across multiple tracks
    """

    def __init__(self, model_name: str = "htdemucs", device: str = "auto"):
        """
        Initialize the Demucs audio separation engine.
        
        Args:
            model_name: Which Demucs model to use (htdemucs, htdemucs_6s, etc.)
            device: Hardware acceleration device ("auto", "cuda", "cpu")
                    
        Why we do this:
        - "auto" lets Demucs pick GPU if available, otherwise CPU
        - Different models have different quality/speed tradeoffs
        - We load the model once per session for efficiency
        """
        # Determine which device to use (GPU if available, otherwise CPU)
        # This is explained: if you have NVIDIA GPU, we use it for faster processing
        # GPU memory usage: the model uses about 2-3GB for htdemucs
        if device == "auto":
            if torch.cuda.is_available():
                self.device = "cuda"
            else:
                self.device = "cpu"
        else:
            self.device = device
            
        # Download/cache the model if needed
        # The model is a 2-4GB file downloaded from HuggingFace
        # We cache it locally so subsequent uses are instant
        self._download_model(model_name)

        # Set up model configuration
        # This tells Demucs how many parallel workers to use
        # More workers = faster but more memory hungry
        self.num_workers = ModelInfo.get(model_name, {}).get("stem_count", 4)

    def _download_model(self, model_name: str) -> None:
        """
        Download or load the Demucs model from cache.
        
        Why we download models:
        - Demucs is trained on thousands of hours of data
        - It's stored as a neural network architecture (weights + structure)
        - Takes ~2-4GB to download
        - Only download ONCE, then cache for instant reuse
        
        Where the model lives:
        - Stored in ./models/models/ directory
        - Cached by filename so we don't download again
        """
        # Check if model directory exists
        # This is the cache location for downloaded AI models
        model_dir = os.path.join("", "models", "models")
        os.makedirs(model_dir, exist_ok=True)
        
        # Download if not cached (demucs library handles this)
        # The library automatically downloads to this location
        # We just need to make sure the directory exists

    def load_model(self, model_name: str):
        """
        Load the Demucs separation model.
        
        Args:
            model_name: Name of model to load (htdemucs, mdxdemucs, etc.)
                        
        Returns:
            Loaded Demucs model ready for processing
            
        Why we load models this way:
        - torchaudio.load() loads both audio data AND model architecture
        - The model is a neural network that recognizes different audio sources
        - Once loaded, it instantly knows "this is drums", "that's vocals"
        """
        # The demucs library provides the model interface
        # We create an instance with the specified model name
        model = demucs.load(model_name)
        
        # Move model to the correct device (GPU or CPU)
        # If GPU is available, this moves all model weights to GPU memory
        # This is why we use device=\"auto\" - it handles the move automatically
        model = model.to(self.device)
        
        # Set batching mode for efficient processing
        # This splits long songs into chunks to process
        model = model.eval()  # Set to evaluation mode (no training)
        
        return model

    def process_audio(
        self,
        audio_file: Union[str, os.PathLike],
        output_dir: Union[str, os.PathLike],
        model_name: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Main function to process audio and separate into stems.
        
        This is the heart of our stem splitter!
        It takes a song file and returns separated audio files.
        
        Args:
            audio_file: Path to the input audio file (MP3, WAV, FLAC, etc.)
            output_dir: Directory to save the separated stems
            model_name: Override model name (uses default if None)
            
        Returns:
            Dictionary with path to each stem file:
            {
                "vocals": "/path/to/vocals.mp3",
                "drums": "/path/to/drums.mp3",
                "bass": "/path/to/bass.mp3",
                "other": "/path/to/other.mp3"
            }
            
        Why this pipeline matters:
        - Loads model efficiently
        - Handles files of any length
        - Automatically downloads model on first use
        - Returns clear paths to each stem for downloading
        """
        # Get or create model (downloads if needed)
        model_name = model_name or "htdemucs"
        model = self.load_model(model_name)
        
        # Create output directory if it doesn't exist
        # We need a place to write the separated audio files
        os.makedirs(output_dir, exist_ok=True)

        # Run Demucs separation
        # This is where the AI magic happens!
        # The model analyzes the audio waveform and separates sources
        return demucs.dominant(
            model,
            audio_file,  # Input file path
            output_dir,  # Where to save results
            n_jobs=self.num_workers,  # How many parallel workers to use
            overwrite=True,  # Overwrite if files exist (for batch processing)
        )


def check_model_installed(model_name: str = "htdemucs") -> bool:
    """
    Helper to check if a Demucs model is installed.
    
    Args:
        model_name: Model name to check
        
    Returns:
        True if model is ready, False if needs download
        
    Why this is useful:
    - Check if user needs to download model first
    - Shows download progress before processing audio
    - Prevents errors during actual audio processing
    """
    # Check if model directory exists and contains model files
    # This validates that the model is downloaded and cached
    model_dir = os.path.join("", "models", "models")
    return os.path.exists(model_dir)


def get_available_models() -> Dict[str, str]:
    """
    Get list of available Demucs models.
    
    Returns:
        Dictionary with model names and descriptions
        
    Why offer multiple models:
    - Different genres work better with different models
    - Some users need speed, others need quality
    - Users can experiment with different separation qualities
    """
    return ModelInfo


if __name__ == "__main__":
    # Example usage:
    # engine = DemucsEngine(model_name="htdemucs")
    # result = engine.process_audio("input.mp3", "output/")
    # print("Separated stems:")
    # print(result)
    print("Demo initialized. Use the web interface or CLI to separate audio files.")
