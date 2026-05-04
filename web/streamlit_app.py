"""
Streamlit Web Application
===========================

A simple, beginner-friendly web interface for the stem splitter.

Why Streamlit?
- Python-based UI (no HTML/CSS to learn)
- Easy to customize
- Fast development
- Beautiful default styling

This app lets you:
- Upload audio files easily
- See processing status
- Download separated stems
- View file sizes and durations
"""

import streamlit as st
import os
from pathlib import Path

from src.pipeline.process import process_audio_file
from src.utils.format_duration import format_duration  # Import duration formatter
from src.utils.quality import validate_stem_quality  # Import quality checker


# Page configuration
st.set_page_config(
    page_title="DJ Stem Splitter",
    page_icon="🎵",
    layout="wide",
    initial_sidebar_state="expanded"
)


# Helper function to display audio player
def create_audio_player(audio_path: str, label: str):
    """
    Create a Streamlit audio player component.
    
    Why this matters:
    - Let users preview stems before downloading
    - Better UX shows the separated audio in action
    
    Args:
        audio_path: Path to audio file
        label: Display label for the player
    """
    with st.expander(label, expanded=True):
        st.audio(audio_path, format="audio/mp3", start_time=0)


# Sidebar for configuration
with st.sidebar:
    st.header("⚙️ Settings")
    st.markdown("Configure processing options.")
    
    # Model selection
    model = st.selectbox(
        "Select Demucs Model:",
        ["htdemucs", "hdemucs", "tdemucs"],
        index=0,
        help="All models use the same interface - choose based on quality vs speed."
    )
    
    # GPU settings
    device = st.radio(
        "Device:",
        ["auto", "cuda", "mps", "cpu"],
        index=0,
        help="auto = picks best available GPU or uses CPU"
    )
    
    # Audio format
    output_format = st.selectbox(
        "Output Format:",
        ["mp3", "wav", "flac"],
        index=0,
        help="MP3 = smaller files (good for sharing), WAV = lossless (best quality)"
    )
    
    # Quality settings
    quality_level = st.slider(
        "Quality Level:",
        min_value=0,
        max_value=3,
        value=1,
        help="0 = fastest, 3 = highest quality"
    )
    
    # Pre-processing
    st.header("🎛️ Pre-processing")
    normalize = st.checkbox("Normalize audio", value=True)
    denoise = st.checkbox("Apply noise reduction", value=False)
    
    st.info(
        "💡 **Tip**: For best results, use clean source files (320kbps MP3, WAV, or FLAC)"
    )


# Main content area
st.title("🎵 DJ Stem Splitter")
st.markdown("""
Separate songs into stems (vocals, drums, bass, other) for DJ remixing.

**How to use**:
1. Upload an audio file below
2. Pick your settings from the sidebar
3. Click **Process**
4. Download your stems!

""")


# File uploader
uploaded_file = st.file_uploader(
    "📁 Upload Audio File",
    type=["mp3", "wav", "flac", "m4a", "ogg"],
    help="Supported formats: MP3, WAV, FLAC, M4A, OGG"
)

# Display the uploaded file info
if uploaded_file is not None:
    st.success(f"✨ Uploaded: {uploaded_file.name}")
    
    # Show file preview
    with st.expander("📊 File Info"):
        # Decode the file path
        file_path = f"memory://{uploaded_file.getvalue()}"
        
        # Get audio metadata without full processing
        audio, sr, _ = load_audio_safe(file_path)
        
        st.metric(
            "🕐 Duration",
            format_duration(audio.shape[0] / sr)
        )
        st.metric(
            "📦 Format",
            uploaded_file.name.split(".")[-1]
        )
        
        # Create audio player
        create_audio_player(file_path, f"Preview: {uploaded_file.name}")


# Process button
if uploaded_file is not None:
    process_btn = st.button(
        "🎚️ Process Audio",
        type="primary",
        disabled=(uploaded_file is None),
        help="Start separating the audio into stems"
    )


# Process result
if process_btn and uploaded_file is not None:
    # Decode uploaded file
    file_bytes = uploaded_file.getvalue()
    
    # Create a BytesIO object
    from io import BytesIO
    memory_file = BytesIO(file_bytes)
    
    # Process the audio
    with st.spinner("🔄 Separating stems..."):
        try:
            result = process_audio_file(
                str(memory_file),
                "./outputs",
                model=model,
                device=device,
                format=output_format,
                normalize=normalize,
                denoise=denoise
            )
            
            # Display results
            st.success("✅ Processing complete!")
            st.divider()
            
            # File info
            st.header("📊 Results")
            st.metric(
                "📄 Original File",
                f"{result['file']}"  # Show original filename
            )
            st.metric(
                "⏱️ Duration",
                format_duration(result['duration'])  # Show formatted duration
            )
            st.metric(
                "🤖 Model Used",
                result['model']
            )
            
            st.divider()
            
            # Display each stem
            st.subheader("\n🎵 Available Stems")
            
            for stem_info in result['stems']:
                stem_name = stem_info['name']
                stem_path = stem_info['path']
                stem_size = stem_info['size']
                
                col1, col2, col3 = st.columns([1, 2, 1])
                
                col1.markdown(f"**{stem_name.capitalize()}**", unsafe_allow_html=True)
                col2.progress(stem_size / 1000000)  # Show progress bar
                col3.metric(
                    "Size",
                    f"{stem_size / 1024 / 1024:.2f} MB"
                )
                
                # Create audio player for each stem
                create_audio_player(stem_path, stem_name.capitalize())
                
                st.downloadButton(
                    f"⬇️ Download {stem_name}.mp3",
                    data=open(stem_path, "rb"),
                    file_name=f"{stem_name}.mp3"
                )
                
                st.divider()
                
        except Exception as e:
            st.error(f"❌ Error processing: {str(e)}")
            st.write("The error has been logged. Please check the logs for details.")


# Footer
st.divider()
st.caption(
    f"Built with ❤️ for DJs | Model: {model} | Device: {device}"
)


# Import needed function at top-level
from torchaudio._backend.sofoxies import load_audio as load_audio_safe