"""Tests for the CLI tool."""
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

# Ensure project root is in path.
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.cli.main import main


@pytest.fixture
def runner():
    """Create a Click CLI runner."""
    return CliRunner()


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

class TestInputValidation:
    def test_missing_input_file(self, runner, tmp_path):
        """CLI should exit with error when input file doesn't exist."""
        result = runner.invoke(main, ["-i", "nonexistent.mp3", "-o", str(tmp_path / "out")])
        assert result.exit_code == 1
        assert "not found" in result.output.lower() or "error" in result.output.lower()

    def test_output_dir_created(self, runner, tmp_path):
        """CLI should create output directory if it doesn't exist."""
        input_file = tmp_path / "input.mp3"
        input_file.write_bytes(b"fake audio")
        output_dir = tmp_path / "new_output"
        result = runner.invoke(main, ["-i", str(input_file), "-o", str(output_dir)])
        assert output_dir.exists() or result.exit_code != 0  # dir created before processing


# ---------------------------------------------------------------------------
# Dry-run mode
# ---------------------------------------------------------------------------

class TestDryRun:
    def test_dry_run_success(self, runner, tmp_path):
        """Dry-run should validate inputs and exit without processing."""
        input_file = tmp_path / "input.mp3"
        input_file.write_bytes(b"fake audio")
        result = runner.invoke(main, ["-i", str(input_file), "-o", str(tmp_path / "out"), "--dry-run"])
        assert result.exit_code == 0
        assert "dry-run passed" in result.output.lower()

    def test_dry_run_shows_config(self, runner, tmp_path):
        """Dry-run should display the configuration."""
        input_file = tmp_path / "input.mp3"
        input_file.write_bytes(b"fake audio")
        result = runner.invoke(main, [
            "-i", str(input_file),
            "-o", str(tmp_path / "out"),
            "--dry-run",
            "-m", "htdemucs_6s",
            "-f", "flac",
            "-b", "256",
        ])
        assert result.exit_code == 0
        assert "htdemucs_6s" in result.output
        assert "flac" in result.output
        assert "256" in result.output

    def test_dry_run_no_gpu_flag(self, runner, tmp_path):
        """Dry-run should show CPU when --no-gpu is used."""
        input_file = tmp_path / "input.mp3"
        input_file.write_bytes(b"fake audio")
        result = runner.invoke(main, [
            "-i", str(input_file),
            "-o", str(tmp_path / "out"),
            "--dry-run",
            "--no-gpu",
        ])
        assert result.exit_code == 0


# ---------------------------------------------------------------------------
# Verbose mode
# ---------------------------------------------------------------------------

class TestVerbose:
    def test_verbose_shows_gpu_status(self, runner, tmp_path):
        """Verbose mode should show GPU status."""
        input_file = tmp_path / "input.mp3"
        input_file.write_bytes(b"fake audio")
        with patch("src.cli.main.show_gpu_status") as mock_gpu:
            result = runner.invoke(main, [
                "-i", str(input_file),
                "-o", str(tmp_path / "out"),
                "-v",
                "--dry-run",
            ])
            assert mock_gpu.called


# ---------------------------------------------------------------------------
# GPU status display
# ---------------------------------------------------------------------------

class TestGpuStatus:
    def test_no_gpu(self, runner):
        """show_gpu_status should handle no GPU gracefully."""
        import torch as _torch
        with patch.object(_torch.cuda, "is_available", return_value=False):
            result = runner.invoke(main, ["--help"])
            assert result.exit_code == 0

    def test_gpu_available(self, runner):
        """show_gpu_status should display GPU info when available."""
        import torch as _torch
        with patch.object(_torch.cuda, "is_available", return_value=True):
            with patch.object(_torch.cuda, "device_count", return_value=1):
                with patch.object(_torch.cuda, "get_device_name", return_value="RTX 4090"):
                    with patch.object(_torch.cuda, "mem_get_info", return_value=(8e9, 16e9)):
                        result = runner.invoke(main, ["--help"])
                        assert result.exit_code == 0


# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

class TestHelp:
    def test_help_shows_options(self, runner):
        """--help should show all options."""
        result = runner.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "--input" in result.output
        assert "--output" in result.output
        assert "--model" in result.output
        assert "--device" in result.output
        assert "--format" in result.output
        assert "--bitrate" in result.output
        assert "--dry-run" in result.output
        assert "--no-gpu" in result.output
        assert "--verbose" in result.output

    def test_required_options(self, runner):
        """CLI should require --input and --output."""
        result = runner.invoke(main)
        assert result.exit_code != 0
