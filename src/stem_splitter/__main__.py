"""
Stem Splittr Entry Point
========================

Run this module directly to invoke the CLI::

    python -m src.cli.main --help

Or from the project root::

    python src/cli/main.py --help
"""

from __future__ import annotations

import sys
import os

# Ensure the project root is on sys.path when run as a module
_PROJECT_ROOT = os.path.abspath(os.path.join(__file__, "..", "..", ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)


def main():
    """Entry point — delegates to the CLI main function."""
    from src.cli.main import main as cli_main

    cli_main()


if __name__ == "__main__":
    main()
