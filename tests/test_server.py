"""Tests for the FastAPI server endpoints."""
import json
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# We need to set up the path so imports work.
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.api.server import app, _job_to_dict, _validate_format, _validate_model
from src.api.queue import Job, init_queue


@pytest.fixture
def client(tmp_path):
    """Create a TestClient with a temporary jobs directory."""
    jobs_dir = tmp_path / "jobs"
    jobs_dir.mkdir()
    init_queue(jobs_dir=str(jobs_dir))
    return TestClient(app)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

class TestValidation:
    def test_validate_format_wav(self):
        assert _validate_format("WAV") == "wav"

    def test_validate_format_mp3(self):
        assert _validate_format("  MP3  ") == "mp3"

    def test_validate_format_flac(self):
        assert _validate_format("flac") == "flac"

    def test_validate_format_invalid(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException, match="Invalid format"):
            _validate_format("ogg")

    def test_validate_model_htdemucs(self):
        assert _validate_model("htdemucs") == "htdemucs"

    def test_validate_model_mdxdemucs(self):
        assert _validate_model("mdxdemucs") == "mdxdemucs"

    def test_validate_model_htdemucs_6s(self):
        assert _validate_model("htdemucs_6s") == "htdemucs_6s"

    def test_validate_model_invalid(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException, match="Invalid model"):
            _validate_model("nonexistent")


# ---------------------------------------------------------------------------
# Job to dict conversion
# ---------------------------------------------------------------------------

class TestJobToDict:
    def test_basic_conversion(self, tmp_path):
        job = Job(
            file_name="test.mp3",
            file_size=1024,
            duration_seconds=3.5,
            model_used="htdemucs",
            output_format="wav",
            bitrate=320,
            device="cuda",
            input_path=tmp_path / "input.mp3",
            output_dir=tmp_path / "output",
        )
        result = _job_to_dict(job)
        assert result["id"] == job.id
        assert result["fileName"] == "test.mp3"
        assert result["fileSize"] == 1024
        assert result["durationSeconds"] == 3.5
        assert result["status"] == "queued"
        assert result["progress"] == 0
        assert result["modelUsed"] == "htdemucs"
        assert result["stems"] == []
        assert result["error"] is None
        assert "createdAt" in result
        assert result["completedAt"] is None

    def test_completed_job(self, tmp_path):
        from datetime import datetime, timezone
        job = Job(
            file_name="test.mp3",
            file_size=1024,
            duration_seconds=3.5,
            model_used="htdemucs",
            output_format="wav",
            bitrate=320,
            device="cuda",
            input_path=tmp_path / "input.mp3",
            output_dir=tmp_path / "output",
            status="completed",
            progress=100,
            stems=[{"name": "vocals", "path": "/tmp/vocals.wav"}],
            completed_at=datetime.now(timezone.utc),
        )
        result = _job_to_dict(job)
        assert result["status"] == "completed"
        assert result["progress"] == 100
        assert len(result["stems"]) == 1
        assert result["completedAt"] is not None


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_health_ok(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "queue_size" in data
        assert "active_count" in data
        assert "total_jobs" in data


# ---------------------------------------------------------------------------
# Upload endpoint
# ---------------------------------------------------------------------------

class TestUploadEndpoint:
    def test_upload_success(self, client, tmp_path):
        """Successful upload should return a job ID."""
        audio_data = b"fake audio data"
        response = client.post(
            "/api/upload",
            files={"file": ("test.mp3", audio_data, "audio/mpeg")},
            data={"model": "htdemucs", "format": "wav", "bitrate": "320"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "jobId" in data
        assert "queued" in data

    def test_upload_no_filename(self, client):
        """Upload without optional params should use defaults and return 200."""
        response = client.post(
            "/api/upload",
            files={
                "file": (
                    "test.mp3",
                    b"fake audio data",
                    "audio/mpeg",
                )
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "jobId" in data
        assert "queued" in data

    def test_upload_unsupported_format(self, client):
        """Upload of unsupported format should return 400."""
        response = client.post(
            "/api/upload",
            files={"file": ("test.exe", b"fake", "application/exe")},
        )
        assert response.status_code == 400

    def test_upload_invalid_model(self, client):
        """Upload with invalid model should return 400."""
        response = client.post(
            "/api/upload",
            files={"file": ("test.mp3", b"fake", "audio/mpeg")},
            data={"model": "nonexistent"},
        )
        assert response.status_code == 400

    def test_upload_invalid_format(self, client):
        """Upload with invalid format should return 400."""
        response = client.post(
            "/api/upload",
            files={"file": ("test.mp3", b"fake", "audio/mpeg")},
            data={"model": "htdemucs", "format": "ogg"},
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# Jobs endpoints
# ---------------------------------------------------------------------------

class TestJobsEndpoints:
    def test_list_jobs_empty(self, client):
        response = client.get("/api/jobs")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_job_not_found(self, client):
        response = client.get("/api/jobs/nonexistent")
        assert response.status_code == 404

    def test_delete_job_not_found(self, client):
        response = client.delete("/api/jobs/nonexistent")
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Models endpoint
# ---------------------------------------------------------------------------

class TestModelsEndpoint:
    def test_list_models(self, client):
        response = client.get("/api/models")
        assert response.status_code == 200
        models = response.json()
        assert isinstance(models, list)
        assert len(models) > 0
        # Each model should have expected fields.
        for m in models:
            assert "id" in m
            assert "label" in m


# ---------------------------------------------------------------------------
# Integration: upload then list
# ---------------------------------------------------------------------------

class TestIntegration:
    def test_upload_then_list(self, client, tmp_path):
        """Upload a file and verify it appears in the job list."""
        response = client.post(
            "/api/upload",
            files={"file": ("test.mp3", b"fake audio", "audio/mpeg")},
            data={"model": "htdemucs", "format": "wav", "bitrate": "320"},
        )
        assert response.status_code == 200
        job_id = response.json()["jobId"]

        list_response = client.get("/api/jobs")
        assert list_response.status_code == 200
        jobs = list_response.json()
        assert len(jobs) >= 1
        job_ids = [j["id"] for j in jobs]
        assert job_id in job_ids
