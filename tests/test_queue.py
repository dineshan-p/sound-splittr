"""Tests for the job queue system."""
import asyncio
import json
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.api.queue import (
    Job,
    JobQueue,
    _deserialize_job,
    _serialize_job,
    get_gpu_memory_info,
    get_queue,
    init_queue,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_job(tmp_path: Path, **overrides) -> Job:
    """Create a minimal Job for testing.

    Each call gets a unique sub-directory under *tmp_path* so concurrent
    tests don't collide on file paths.
    """
    job_dir = tmp_path / f"job_{uuid.uuid4().hex[:6]}"
    job_dir.mkdir()
    input_path = job_dir / "input.mp3"
    input_path.write_bytes(b"fake audio")
    output_path = job_dir / "output"
    output_path.mkdir()
    defaults = {
        "file_name": "test.mp3",
        "file_size": 1024,
        "duration_seconds": 3.0,
        "model_used": "htdemucs",
        "output_format": "wav",
        "bitrate": 320,
        "device": "cuda",
        "input_path": input_path,
        "output_dir": output_path,
    }
    defaults.update(overrides)
    return Job(**defaults)


# ---------------------------------------------------------------------------
# Job dataclass serialization
# ---------------------------------------------------------------------------

class TestJobSerialization:
    def test_serialize_job(self, tmp_path):
        job = _make_job(tmp_path)
        data = _serialize_job(job)
        assert data["id"] == job.id
        assert data["file_name"] == "test.mp3"
        assert data["status"] == "queued"
        assert isinstance(data["created_at"], str)
        assert isinstance(data["input_path"], str)
        assert isinstance(data["output_dir"], str)

    def test_deserialize_job(self, tmp_path):
        job = _make_job(tmp_path)
        data = _serialize_job(job)
        restored = _deserialize_job(data)
        assert restored.id == job.id
        assert restored.file_name == job.file_name
        assert restored.status == job.status
        assert restored.input_path == job.input_path
        assert restored.completed_at is None

    def test_serialize_completed_job(self, tmp_path):
        job = _make_job(tmp_path, status="completed")
        job.completed_at = datetime.now(timezone.utc)
        data = _serialize_job(job)
        assert data["completed_at"] is not None
        restored = _deserialize_job(data)
        assert restored.completed_at is not None


# ---------------------------------------------------------------------------
# JobQueue
# ---------------------------------------------------------------------------

class TestJobQueue:
    @pytest.fixture
    def queue(self, tmp_path):
        q = JobQueue(jobs_dir=str(tmp_path / "jobs"))
        return q

    @pytest.mark.asyncio
    async def test_add_job_starts_processing(self, queue, tmp_path):
        """Job should start processing immediately if resources available."""
        job = _make_job(tmp_path)
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 5.0}):
            with patch("src.api.queue.JobQueue._run_job", new_callable=AsyncMock):
                result = await queue.add_job(job)
                assert result["jobId"] == job.id
                assert result["queued"] is False
                assert job.status == "processing"

    @pytest.mark.asyncio
    async def test_add_job_queues_when_full(self, queue, tmp_path):
        """Job should be queued if max concurrent reached."""
        queue.active_count = 2  # MAX_CONCURRENT
        job = _make_job(tmp_path)
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 5.0}):
            result = await queue.add_job(job)
            assert result["queued"] is True
            assert job.status == "queued"
            assert job.position == 1
            assert job.id in queue.queue

    @pytest.mark.asyncio
    async def test_add_job_queues_when_queue_full(self, queue, tmp_path):
        """Job should be queued if queue is at max size."""
        queue.queue = ["a", "b", "c", "d", "e"]  # 5 = MAX_QUEUE_SIZE
        job = _make_job(tmp_path)
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 5.0}):
            result = await queue.add_job(job)
            assert result["queued"] is True

    @pytest.mark.asyncio
    async def test_get_job(self, queue, tmp_path):
        job = _make_job(tmp_path)
        queue.jobs[job.id] = job
        found = await queue.get_job(job.id)
        assert found is not None
        assert found.id == job.id

    @pytest.mark.asyncio
    async def test_get_job_not_found(self, queue):
        result = await queue.get_job("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_list_jobs(self, queue, tmp_path):
        j1 = _make_job(tmp_path)
        j2 = _make_job(tmp_path)
        queue.jobs[j1.id] = j1
        queue.jobs[j2.id] = j2
        jobs = await queue.list_jobs()
        assert len(jobs) == 2

    @pytest.mark.asyncio
    async def test_delete_job(self, queue, tmp_path):
        job = _make_job(tmp_path)
        queue.jobs[job.id] = job
        deleted = await queue.delete_job(job.id)
        assert deleted is True
        assert job.id not in queue.jobs

    @pytest.mark.asyncio
    async def test_delete_job_not_found(self, queue):
        deleted = await queue.delete_job("nonexistent")
        assert deleted is False

    @pytest.mark.asyncio
    async def test_get_stats(self, queue):
        stats = await queue.get_stats()
        assert "queue_size" in stats
        assert "active_count" in stats
        assert "total_jobs" in stats
        assert "gpu" in stats
        assert stats["queue_size"] == 0
        assert stats["active_count"] == 0

    def test_persistence(self, tmp_path):
        """Jobs should survive across queue instances."""
        q1 = JobQueue(jobs_dir=str(tmp_path / "jobs"))
        job = _make_job(tmp_path)
        q1.jobs[job.id] = job
        q1._save_job_to_disk(job)

        q2 = JobQueue(jobs_dir=str(tmp_path / "jobs"))
        assert job.id in q2.jobs

    def test_can_start_job_cuda(self, queue):
        """Should return cuda when GPU memory is sufficient."""
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 5.0}):
            can_start, reason, device = queue._can_start_job()
            assert can_start is True
            assert device == "cuda"

    def test_can_start_job_cpu_fallback(self, queue):
        """Should return cpu when GPU memory is insufficient."""
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 1.0}):
            can_start, reason, device = queue._can_start_job()
            assert can_start is True
            assert device == "cpu"

    def test_can_start_job_no_gpu(self, queue):
        """Should return cpu when no GPU available."""
        with patch("src.api.queue.get_gpu_memory_info", return_value=None):
            can_start, reason, device = queue._can_start_job()
            assert can_start is True
            assert device == "cpu"

    def test_can_start_job_max_concurrent(self, queue):
        """Should not start when max concurrent reached."""
        queue.active_count = 2
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 5.0}):
            can_start, reason, device = queue._can_start_job()
            assert can_start is False
            assert "Max concurrent" in reason
            assert device == "cpu"

    def test_can_start_job_queue_full(self, queue):
        """Should not start when queue is full."""
        queue.queue = ["a", "b", "c", "d", "e"]
        with patch("src.api.queue.get_gpu_memory_info", return_value={"free_gb": 5.0}):
            can_start, reason, device = queue._can_start_job()
            assert can_start is False
            assert "Queue full" in reason
            assert device == "cpu"


# ---------------------------------------------------------------------------
# GPU memory
# ---------------------------------------------------------------------------

class TestGpuMemory:
    def test_no_gpu(self):
        with patch("src.api.queue.torch.cuda.is_available", return_value=False):
            result = get_gpu_memory_info()
            assert result is None

    def test_with_gpu(self):
        with patch("src.api.queue.torch.cuda.is_available", return_value=True):
            with patch("src.api.queue.torch.cuda.mem_get_info", return_value=(4e9, 8e9)):
                result = get_gpu_memory_info()
                assert result is not None
                assert result["free_gb"] == 4.0
                assert result["total_gb"] == 8.0


# ---------------------------------------------------------------------------
# init_queue / get_queue
# ---------------------------------------------------------------------------

class TestQueueInit:
    def test_init_and_get(self, tmp_path):
        q = init_queue(jobs_dir=str(tmp_path / "jobs"))
        assert q is not None
        assert get_queue() is q

    def test_get_queue_before_init(self):
        import src.api.queue as qmod
        original = qmod.job_queue
        try:
            qmod.job_queue = None
            with pytest.raises(RuntimeError, match="not initialized"):
                get_queue()
        finally:
            qmod.job_queue = original
