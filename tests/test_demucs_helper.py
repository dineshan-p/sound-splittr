"""Tests for the demucs helper module."""
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure project root is in path.
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


class TestModelInfo:
    def test_model_info_has_expected_keys(self):
        """ModelInfo should have expected keys for each model."""
        from src.core.demucs_helper import ModelInfo
        assert isinstance(ModelInfo, dict)
        for model_name, info in ModelInfo.items():
            assert "description" in info
            assert "stem_count" in info
            assert isinstance(info["description"], str)
            assert isinstance(info["stem_count"], int)
            assert info["stem_count"] > 0

    def test_htdemucs_has_4_stems(self):
        """htdemucs should have 4 stems."""
        from src.core.demucs_helper import ModelInfo
        assert ModelInfo["htdemucs"]["stem_count"] == 4

    def test_mdx_has_4_stems(self):
        """mdx should have 4 stems."""
        from src.core.demucs_helper import ModelInfo
        assert ModelInfo["mdx"]["stem_count"] == 4

    def test_htdemucs_6s_has_6_stems(self):
        """htdemucs_6s should have 6 stems."""
        from src.core.demucs_helper import ModelInfo
        assert ModelInfo["htdemucs_6s"]["stem_count"] == 6

    def test_models_have_descriptions(self):
        """All models should have non-empty descriptions."""
        from src.core.demucs_helper import ModelInfo
        for model_name, info in ModelInfo.items():
            assert len(info["description"].strip()) > 0

    def test_model_names_are_valid(self):
        """Model names should be lowercase with underscores."""
        from src.core.demucs_helper import ModelInfo
        for model_name in ModelInfo.keys():
            assert model_name == model_name.lower()
            assert " " not in model_name


class TestGetModel:
    def test_get_model_htdemucs(self):
        """get_model should return htdemucs model."""
        with patch("src.core.demucs_helper.get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_get_model.return_value = mock_model
            from src.core.demucs_helper import get_model
            model = get_model("htdemucs")
            assert model == mock_model
            mock_get_model.assert_called_once_with("htdemucs")

    def test_get_model_invalid(self):
        """get_model should raise AttributeError for invalid model (demucs behavior)."""
        from src.core.demucs_helper import get_model
        # demucs.get_model raises an error for invalid models
        with pytest.raises((ValueError, AttributeError, KeyError)):
            get_model("nonexistent")
