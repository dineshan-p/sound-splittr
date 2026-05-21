"""Job queue with GPU protection and JSON persistence."""

from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import torch


def _serialize_job(job: Job) -> dict:
    """Convert a Job to a JSON-serializable dict."""
    d = asdict(job)
    d["input_path"] = str(job.input_path)
    d["output_dir"] = str(job.output_dir)
    d["created_at"] = job.created_at.isoformat()
    if job.completed_at:
        d["completed_at"] = job.completed_at.isoformat()
    return d


def _deserialize_job(data: dict) -> Job:
    """Reconstruct a Job from a JSON dict."""
    return Job(
        file_name=data["file_name"],
        file_size=data["file_size"],
        duration_seconds=data["duration_seconds"],
        model_used=data["model_used"],
        output_format=data["output_format"],
        bitrate=data["bitrate"],
        device=data["device"],
        input_path=Path(data["input_path"]),
        output_dir=Path(data["output_dir"]),
        id=data["id"],
        status=data["status"],
        progress=data["progress"],
        position=data["position"],
        stems=data["stems"],
        error=data["error"],
        created_at=datetime.fromisoformat(data["created_at"]),
        completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
    )


@dataclass
class Job:
    """Represents one upload + split job."""
    file_name: str
    file_size: int
    duration_seconds: float | None
    model_used: str
    output_format: str
    bitrate: int
    device: str
    input_path: Path
    output_dir: Path

    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    status: str = "queued"
    progress: int = 0
    position: int = 0
    stems: list[dict] = field(default_factory=list)
    error: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None


def get_gpu_memory_info() -> dict[str, float] | None:
    """Get GPU memory status. Returns None if no GPU available."""
    if not torch.cuda.is_available():
        return None
    free_gb, total_gb = torch.cuda.mem_get_info()
    return {
        "free_gb": round(free_gb / 1e9, 2),
        "total_gb": round(total_gb / 1e9, 2),
        "used_gb": round((total_gb - free_gb) / 1e9, 2),
    }


class JobQueue:
    """In-memory cache with JSON file persistence."""

    MAX_QUEUE_SIZE = 5
    MAX_CONCURRENT = 2
    MIN_GPU_MEMORY_GB = 3.0

    def __init__(self, jobs_dir: str = "./jobs"):
        self.jobs: dict[str, Job] = {}
        self.queue: list[str] = []
        self.active_count: int = 0
        self._lock = asyncio.Lock()
        self._jobs_dir = Path(jobs_dir)
        self._jobs_dir.mkdir(parents=True, exist_ok=True)
        self._load_from_disk()

    def _load_from_disk(self) -> None:
        """Load all jobs from JSON files on disk."""
        for json_file in self._jobs_dir.glob("*.json"):
            try:
                data = json.loads(json_file.read_text())
                job = _deserialize_job(data)
                self.jobs[job.id] = job
                if job.status == "queued":
                    self.queue.append(job.id)
                elif job.status == "processing":
                    self.active_count += 1
            except Exception:
                pass

    def _save_job_to_disk(self, job: Job) -> None:
        """Save a job to its JSON file."""
        job_file = self._jobs_dir / f"{job.id}.json"
        job_file.write_text(json.dumps(_serialize_job(job), indent=2))

    def _remove_job_from_disk(self, job_id: str) -> None:
        """Remove a job's JSON file."""
        job_file = self._jobs_dir / f"{job_id}.json"
        if job_file.exists():
            job_file.unlink()

    def _can_start_job(self) -> tuple[bool, str, str]:
        """Check if we can start a new job right now.

        Returns (can_start, reason_if_not, device).
        """
        if len(self.queue) >= self.MAX_QUEUE_SIZE:
            return False, f"Queue full ({len(self.queue)}/{self.MAX_QUEUE_SIZE})", "cpu"

        if self.active_count >= self.MAX_CONCURRENT:
            return False, f"Max concurrent ({self.MAX_CONCURRENT}) reached", "cpu"

        gpu = get_gpu_memory_info()
        if gpu is not None and gpu["free_gb"] >= self.MIN_GPU_MEMORY_GB:
            return True, "OK", "cuda"
        else:
            return True, "GPU memory insufficient, falling back to CPU", "cpu"

    async def add_job(self, job: Job) -> dict[str, Any]:
        """Add a job to the queue. Starts processing if resources available."""
        async with self._lock:
            self.jobs[job.id] = job
            self._save_job_to_disk(job)

            gpu = get_gpu_memory_info()
            can_start, reason, device = self._can_start_job()
            if can_start:
                job.status = "processing"
                job.position = 0
                job.device = device
                self.active_count += 1
                self._save_job_to_disk(job)
                asyncio.create_task(self._run_job(job.id))
                return {
                    "jobId": job.id,
                    "queued": False,
                    "position": 0,
                    "gpu": gpu,
                    "device": device,
                }
            else:
                job.position = len(self.queue) + 1
                self.queue.append(job.id)
                self._save_job_to_disk(job)
                return {
                    "jobId": job.id,
                    "queued": True,
                    "position": job.position,
                    "reason": reason,
                    "gpu": gpu,
                }

    async def _run_job(self, job_id: str) -> None:
        """Run the Demucs pipeline for a job, then drain the queue."""
        job = self.jobs.get(job_id)
        if job is None:
            print(f"[Job {job_id}] Job not found — skipping")
            return
        try:
            print(f"[Job {job_id}] Starting: {job.file_name}")

            job.progress = 10
            self._save_job_to_disk(job)

            from src.pipeline.process import process_audio_file

            job.progress = 20
            self._save_job_to_disk(job)

            result = process_audio_file(
                input_file=str(job.input_path),
                output_dir=str(job.output_dir),
                model_name=job.model_used,
                device=job.device,
                format=job.output_format,
                bitrate=job.bitrate,
                num_workers=2,
            )

            job.progress = 90
            self._save_job_to_disk(job)

            job.status = "completed"
            job.progress = 100
            job.stems = result["stems"]
            job.completed_at = datetime.now(timezone.utc)
            self._save_job_to_disk(job)
            print(f"[Job {job_id}] Completed: {len(result['stems'])} stems")

        except Exception as exc:
            job.status = "failed"
            job.error = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            self._save_job_to_disk(job)
            print(f"[Job {job_id}] Failed: {exc}")

        finally:
            async with self._lock:
                self.active_count -= 1
                if job.id in self.queue:
                    self.queue.remove(job.id)
            await self._drain_queue()

    async def _drain_queue(self) -> None:
        """Try to start the next job(s) in the queue."""
        async with self._lock:
            while self.queue:
                can_start, reason, device = self._can_start_job()
                if not can_start:
                    break

                next_id = self.queue.pop(0)
                next_job = self.jobs[next_id]
                next_job.status = "processing"
                next_job.position = 0
                next_job.device = device
                self.active_count += 1
                self._save_job_to_disk(next_job)
                asyncio.create_task(self._run_job(next_id))

    async def get_job(self, job_id: str) -> Job | None:
        """Get a job by ID."""
        return self.jobs.get(job_id)

    async def list_jobs(self) -> list[Job]:
        """Return all jobs, newest first."""
        return sorted(
            self.jobs.values(),
            key=lambda j: j.created_at,
            reverse=True,
        )

    async def delete_job(self, job_id: str) -> bool:
        """Delete a job and its stem files."""
        async with self._lock:
            job = self.jobs.pop(job_id, None)
            if job is None:
                return False
            if job.id in self.queue:
                self.queue.remove(job.id)
            for stem in job.stems:
                stem_path = stem.get("path", "")
                if stem_path:
                    p = Path(stem_path)
                    if p.exists():
                        p.unlink()
            self._remove_job_from_disk(job_id)
            return True

    async def get_stats(self) -> dict:
        """Return queue and GPU status."""
        gpu = get_gpu_memory_info()
        return {
            "queue_size": len(self.queue),
            "active_count": self.active_count,
            "total_jobs": len(self.jobs),
            "gpu": gpu,
        }


job_queue: JobQueue | None = None


def init_queue(jobs_dir: str = "./jobs") -> JobQueue:
    """Initialize the global job queue."""
    global job_queue
    job_queue = JobQueue(jobs_dir=jobs_dir)
    return job_queue


def get_queue() -> JobQueue:
    """Get the global job queue (raises if not initialized)."""
    if job_queue is None:
        raise RuntimeError("Job queue not initialized — call init_queue() first")
    return job_queue
