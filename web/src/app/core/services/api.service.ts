import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of, timeout } from "rxjs";
import type { Observable } from "rxjs";
import type { Job, ModelOption, SplitRequest, UploadResponse } from "../models";
import { AVAILABLE_MODELS } from "../models";
import { SettingsService } from "./settings.service";

@Injectable({ providedIn: "root" })
export class ApiService {
	private readonly http = inject(HttpClient);
	private readonly settings = inject(SettingsService);

	private get baseUrl(): string {
		const raw = this.settings.current();
		const url = typeof raw?.apiUrl === "string" ? raw.apiUrl : "";
		return url.replace(/\/$/, "");
	}

	get apiUrl(): string {
		return this.baseUrl;
	}

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
			},
		);
	}

	getJob(jobId: string): Observable<Job> {
		return this.http.get<Job>(`${this.baseUrl}/api/jobs/${jobId}`);
	}

	listJobs(): Observable<Job[]> {
		return this.http
			.get<Job[]>(`${this.baseUrl}/api/jobs`)
			.pipe(timeout(10_000));
	}

	deleteJob(jobId: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/api/jobs/${jobId}`);
	}

	getStemUrl(jobId: string, stemName: string): string {
		return `${this.baseUrl}/api/stems/${jobId}/${stemName}`;
	}

	fetchModels(): Observable<ModelOption[]> {
		return this.http.get<ModelOption[]>(`${this.baseUrl}/api/models`).pipe(
			catchError(() => {
				console.warn("[ApiService] /api/models not available, using defaults");
				return of(AVAILABLE_MODELS);
			}),
		);
	}

	ping(): Observable<{
		status: string;
		queue_size: number;
		active_count: number;
		total_jobs: number;
		gpu: { free_gb: number; total_gb: number; used_gb: number } | null;
	}> {
		return this.http.get<{
			status: string;
			queue_size: number;
			active_count: number;
			total_jobs: number;
			gpu: { free_gb: number; total_gb: number; used_gb: number } | null;
		}>(`${this.baseUrl}/api/health`);
	}
}
