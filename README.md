=== Stem Splitter for DJing ===

A powerful audio stem splitter that separates songs into individual stems (vocals, drums, bass, melody)
using the Demucs AI model. Perfect for DJs who want to create custom remixes live!

## ✨ Features

- 🎚️ Automatic stem separation: vocals, drums, bass, and more
- 🎧 Multiple Demucs models with optimal quality
- 🎨 Web interface for easy file upload and processing
- 💻 Command-line interface for batch processing
- 📦 Docker support for easy deployment
- ⚡ GPU acceleration support

## 🚀 Quick Start

Basic usage:

# Install dependencies

pip install -r requirements.txt

# Download the Demucs model (first time only)

cd models && python downloader.py && cd ..

# Split a song using the web interface

streamlit run web/streamlit_app.py

# Or use the command line:

python src/cli/main.py --input song.mp3 --out_dir output/

## 📁 Project Structure

stem_splitter/
├── src/ # Core application code
│ ├── core/ # Main audio splitting logic
│ ├── models/ # Demucs model management
│ ├── web/ # Web interface
│ └── cli/ # Command-line interface
├── tests/ # Test files
├── web/ # Web UI files
├── config/ # Configuration files
├── models/ # Downloaded Demucs models
├── docs/ # Documentation
└── examples/ # Example files

## 🔧 Configuration

Edit config/config.yaml to customize:

- Model selection
- Output settings
- Audio quality settings

📖 See README.md for full documentation
