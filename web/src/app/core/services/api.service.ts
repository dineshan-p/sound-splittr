/**
 * API Service — single source of truth for every HTTP call to the backend.
 *
 * The Angular frontend communicates with a REST API that will be built on
 * top of the existing `src/pipeline/process.py` pipeline.  Until the API
 * exists, this service can point at any compatible endpoint (or a mock).
 *
 * Expected backend endpoints:
 *   POST   /api/upload          Upload audio + start split → { jobId }
 *   GET    /api/jobs             List all jobs (paginated)
 *   GET    /api/jobs/:id         Get one job with full details
 *   DELETE /api/jobs/:id         Delete a job and its stem files
 *   GET    /api/stems/:jobId/:stem  Download a single stem file
 *   GET    /api/models           List available Demucs models (optional)
 */

import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import type { Observable } from "rxjs";
import type { Job, ModelOption, SplitRequest, UploadResponse } from "../models";
import { SettingsService } from "./settings.service";

@Injectable({ providedIn: "root" })
export class ApiService {
	private readonly http = inject(HttpClient);
	private readonly settings = inject(SettingsService);

	/** Build the base URL from persisted settings. */
	private get baseUrl(): string {
		const raw = this.settings.current();
		const url = typeof raw?.apiUrl === "string" ? raw.apiUrl : "";
		return url.replace(/\/$/, "");
	}

	/** Public getter for the configured API base URL (used by templates). */
	get apiUrl(): string {
		return this.baseUrl;
	}

	// ─── Jobs ────────────────────────────────────────────────────────

	/** Upload an audio file and start splitting it into stems. */
	uploadAudio(file: File, request: SplitRequest): Observable<UploadResponse> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("model", request.model);
		formData.append("format", request.format);

		if (request.format === "mp3" && request.bitrate) {
			formData.append("bitrate", String(request.bitrate));
		}

		return this.http.post<UploadResponse>(
			`${this.baseUrl}/api/upload`,
			formData,
			{
				reportProgress: true,
				// observe: 'events'  ← uncomment if you want upload progress events
			},
		);
	}

	/** Fetch a single job's current state. */
	getJob(jobId: string): Observable<Job> {
		return this.http.get<Job>(`${this.baseUrl}/api/jobs/${jobId}`);
	}

	/** List all jobs (most recent first). */
	listJobs(): Observable<Job[]> {
		return this.http.get<Job[]>(`${this.baseUrl}/api/jobs`);
	}

	/** Delete a job and all its generated stem files. */
	deleteJob(jobId: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/api/jobs/${jobId}`);
	}

	// ─── Stems ───────────────────────────────────────────────────────

	/** Return the URL for downloading a specific stem file. */
	getStemUrl(jobId: string, stemName: string): string {
		return `${this.baseUrl}/api/stems/${jobId}/${stemName}`;
	}

	// ─── Models (optional metadata endpoint) ────────────────────────

	/** Fetch available models from the backend (falls back to local list). */
	fetchModels(): Observable<ModelOption[]> {
		return this.http.get<ModelOption[]>(`${this.baseUrl}/api/models`).pipe(
			catchError(() => {
				// API not yet available — use the built-in default list
				console.warn("[ApiService] /api/models not available, using defaults");
				throw throwError(() => new Error("Models endpoint unavailable"));
			}),
		);
	}

	// ─── Health Check ────────────────────────────────────────────────

	/** Verify the backend is reachable. */
	ping(): Observable<{ status: string }> {
		return this.http.get<{ status: string }>(`${this.baseUrl}/api/health`);
	}
}
