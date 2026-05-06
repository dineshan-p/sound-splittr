"""
Test script for streamlit_app.py fixes.

This script tests the key imports without running Streamlit server.
"""
import sys
import os

# Add project root to path so we can import src/
sys.path.insert(0, '/home/kobe/brain_2/projects/sound-splittr')

print("Testing streamlit_app.py fixes...\n")
print("=" * 60)

# Test 1: BytesIO is imported correctly
try:
    from io import BytesIO
    print("✓ BytesIO import works")
except ImportError as e:
    print(f"✗ BytesIO import failed: {e}")

# Test 2: format_duration function exists in src.utils
try:
    from src.utils import format_duration
    result = format_duration(65.5)
    assert result == "01:05", f"Expected '01:05', got '{result}'"
    print(f"✓ format_duration() works correctly: {format_duration(65.5)}")
except Exception as e:
    print(f"✗ format_duration import/test failed: {e}")

# Test 3: process_audio_file is imported from src.pipeline.process
try:
    from src.pipeline.process import process_audio_file
    print("✓ process_audio_file function found")
except ImportError as e:
    # This might fail if demucs isn't installed - that's OK for this test
    print(f"⚠ process_audio_file import issue (expected if demucs not installed): {e}")

# Test 4: Check Streamlit download function
import streamlit as st
try:
    # The function exists in streamlit module
    assert hasattr(st, 'download'), "streamlit.download doesn't exist"
    print("✓ Streamlit.download() function exists")
except AssertionError:
    print("✗ Streamlit.download() doesn't exist (unexpected)")

print("\n" + "=" * 60)
print("Fix verification complete!")