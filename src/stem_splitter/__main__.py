"""
Stem Splitter Entry Point
========================

Run this script to start the stem splitter application.

Usage:
    python -m stem_splitter.cli

Or from CLI:
    streamlit run web/streamlit_app.py
    python src/cli/main.py
"""

import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cli.main import main


if __name__ == "__main__":
    main()