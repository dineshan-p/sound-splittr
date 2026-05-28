"""Sound Splittr REST API — FastAPI server bridging the Angular frontend to the Demucs pipeline."""

from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

app = FastAPI(title="Sound Splittr API", version="1.0.0")

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
JOBS_DIR = Path("./jobs")
JOBS_DIR.mkdir(parents=True, exist_ok=True)

from src.api.queue import init_queue, get_queue

init_queue(jobs_dir=str(JOBS_DIR))


def _job_to_dict(job) -> dict[str, Any]:
    """Convert a Job dataclass to a JSON-serializable dict.

    Field names are camelCase to match the TypeScript interfaces expected
    by the Angular frontend (Job, StemInfo, etc.).
    """
    return {
        "id": job.id,
        "fileName": job.file_name,
        "fileSize": job.file_size,
        "durationSeconds": job.duration_seconds,
        "status": job.status,
        "progress": job.progress,
        "modelUsed": job.model_used,
        "stems": job.stems,
        "error": job.error,
        "createdAt": job.created_at.isoformat(),
        "completedAt": job.completed_at.isoformat() if job.completed_at else None,
    }


def _validate_format(fmt: str) -> str:
    """Validate and normalize output format.

    Rejects anything other than mp3, wav, or flac with a 400 error.
    Returns the lowercased, stripped format string for downstream use.
    """
    fmt = fmt.lower().strip()
    if fmt not in ("mp3", "wav", "flac"):
        raise HTTPException(400, f"Invalid format '{fmt}'. Must be mp3, wav, or flac.")
    return fmt


def _validate_model(model: str) -> str:
    """Validate model name against the list of known Demucs models.

    Raises 400 if the model is not one of htdemucs, mdxdemucs, or htdemucs_6s.
    Returns the lowercased, stripped model name.
    """
    model = model.lower().strip()
    valid = {"htdemucs", "mdxdemucs", "htdemucs_6s"}
    if model not in valid:
        raise HTTPException(400, f"Invalid model '{model}'. Choose from: {', '.join(sorted(valid))}")
    return model


@app.get("/api/health")
async def health_check():
    """Health check endpoint.

    Returns queue statistics and GPU memory status.
    Used by the frontend to display the queue panel on the home page.

    Response:
        status: "ok"
        queue_size: number of jobs waiting
        active_count: number of jobs currently processing
        total_jobs: total jobs in the system
        gpu: free/total/used GPU memory (null if no GPU)
    """
    queue = get_queue()
    stats = await queue.get_stats()
    return {"status": "ok", **stats}


@app.post("/api/upload")
async def upload_audio(
    file: UploadFile = File(...),
    model: str = Form("htdemucs"),
    format: str = Form("mp3"),
    bitrate: int = Form("320"),
):
    """Upload an audio file and enqueue it for stem separation.

    Accepts MP3, WAV, FLAC, OGG, M4A, AAC, WMA. The file is saved to
    ``uploads/`` and a Job is created in the queue. Processing starts
    immediately if GPU memory is available; otherwise the job waits in
    the queue.

    Request body:
        file: audio file (multipart/form-data)
        model: one of htdemucs, mdxdemucs, htdemucs_6s
        format: mp3, wav, or flac
        bitrate: MP3 encoding bitrate in kbps (only used when format=mp3)

    Response:
        jobId: unique job identifier
        queued: true if the job is waiting, false if processing started
        position: queue position (only when queued=true)
        gpu: current GPU memory status
    """
    output_format = _validate_format(format)
    model_name = _validate_model(model)

    if not file.filename:
        raise HTTPException(400, "No filename provided")

    allowed_ext = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".wma"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(
            400,
            f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(allowed_ext))}",
        )

    upload_path = UPLOAD_DIR / file.filename
    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    import soundfile as sf

    duration = None
    try:
        info = sf.info(str(upload_path))
        duration = round(info.duration, 2)
    except Exception:
        pass

    from src.api.queue import Job

    job = Job(
        file_name=file.filename,
        file_size=upload_path.stat().st_size,
        duration_seconds=duration,
        model_used=model_name,
        output_format=output_format,
        bitrate=bitrate,
        device="auto",
        input_path=upload_path,
        output_dir=JOBS_DIR / "placeholder",
    )
    job.output_dir = JOBS_DIR / job.id

    result = await get_queue().add_job(job)

    return {
        "jobId": result["jobId"],
        "message": "Processing started" if not result["queued"] else f"Queued (position {result['position']})",
        "queued": result["queued"],
        **({"position": result["position"]} if result["queued"] else {}),
        **({"gpu": result["gpu"]} if result.get("gpu") else {}),
    }


@app.get("/api/jobs")
async def list_jobs():
    """List all jobs, most recent first.

    Used by the Jobs page to populate the job history table.
    Returns a JSON array of job objects sorted by creation time descending.
    """
    jobs = await get_queue().list_jobs()
    return [_job_to_dict(j) for j in jobs]


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a single job's details.

    Used for polling the active job on the home page and for displaying
    job details on the Jobs page.

    Args:
        job_id: the job's unique identifier.

    Returns:
        Job details including progress, stems, and error message (if any).
    """
    job = await get_queue().get_job(job_id)
    if job is None:
        raise HTTPException(404, f"Job '{job_id}' not found")
    return _job_to_dict(job)


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and all its generated stem files.

    Removes the job record, its JSON state file, and all output stem
    files from disk. Safe to call for jobs in any state.
    """
    deleted = await get_queue().delete_job(job_id)
    if not deleted:
        raise HTTPException(404, f"Job '{job_id}' not found")
    return {"message": "Job deleted"}


@app.get("/api/stems/{job_id}/{stem_name}")
async def download_stem(job_id: str, stem_name: str):
    """Stream a completed stem file back to the client.

    The frontend uses this URL for per-stem downloads and for the
    ``<audio>`` source in the StemPlayer component.

    Args:
        job_id: the job that produced this stem.
        stem_name: one of vocals, drums, bass, other (or the 6-stem names).
    """
    job = await get_queue().get_job(job_id)
    if job is None:
        raise HTTPException(404, f"Job '{job_id}' not found")

    stem_path = None
    for stem in job.stems:
        if stem.get("name") == stem_name:
            stem_path = stem.get("path")
            break

    if stem_path is None:
        raise HTTPException(404, f"Stem '{stem_name}' not found for job '{job_id}'")

    if not Path(stem_path).exists():
        raise HTTPException(404, f"Stem file not found on disk: {stem_path}")

    return FileResponse(
        stem_path,
        media_type="application/octet-stream",
        filename=f"{stem_name}.mp3",
    )


@app.get("/api/models")
async def list_models():
    """List available Demucs models with metadata.

    Returns a JSON array of model options (id, label, description, stemCount).
    Used by the frontend to populate the model selector dropdown.
    """
    from src.core.demucs_helper import ModelInfo

    models = []
    for name, info in ModelInfo.items():
        models.append({
            "id": name,
            "label": name.replace("_", " ").title(),
            "description": info["description"],
            "stemCount": info["stem_count"],
        })
    return models


@app.on_event("startup")
async def startup():
    """Log startup info when the FastAPI server starts.

    Prints GPU availability and queue configuration to the console.
    This runs once when the server process boots.
    """
    from src.api.queue import get_gpu_memory_info

    gpu = get_gpu_memory_info()
    print(f"\n🎚️  Sound Splittr API starting on :8000")
    if gpu:
        print(f"  GPU: {gpu['free_gb']:.1f}GB free / {gpu['total_gb']:.1f}GB total")
    else:
        print("  No GPU detected — running in CPU mode")
    print(f"  Queue: max 5 jobs, max 2 concurrent")
    print()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
