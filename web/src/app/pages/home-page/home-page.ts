/**
 * Home Page — Landing / Upload Screen
 * ====================================
 * The primary entry point. Users drop an audio file here and configure
 * their split settings before uploading to the backend API.
 */

import { Component, type OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import type { SplitRequest, JobStatus } from "../../core/models";
import { AVAILABLE_MODELS } from "../../core/models";
import { SettingsService } from "../../core/services/settings.service";
import { ApiService } from "../../core/services/api.service";
import { UploadAreaComponent } from "../../shared/upload-area/upload-area";
import { ProcessingStatusComponent } from "../../shared/processing-status/processing-status";
import { StemListComponent } from "../../shared/stem-list/stem-list";

@Component({
	selector: "app-home-page",
	imports: [
		FormsModule,
		RouterLink,
		UploadAreaComponent,
		ProcessingStatusComponent,
		StemListComponent,
	],
	templateUrl: "./home-page.html",
	styleUrl: "./home-page.scss",
	standalone: true,
})
export class HomePage implements OnInit {
	// Expose model list to the template
	readonly models = AVAILABLE_MODELS;

	readonly api = inject(ApiService);
	readonly settings = inject(SettingsService);

	// ─── Reactive state ────────────────────────────────────────────────

	/** Settings form values (bound via two-way ngModel). */
	modelName = this.settings.model;
	outputFormat: "mp3" | "wav" | "flac" = this.settings.format;
	bitrate = this.settings.bitrate;

	/** Currently processing or recently completed job. */
	activeJob: {
		jobId: string;
		fileName: string;
		status: JobStatus;
		progress: number;
		stage?: string;
		error?: string;
	} | null = null;

	/** Completed stems ready for download. */
	completedStems: Array<{
		name: string;
		displayName: string;
		path: string;
		sizeBytes: number;
	}> = [];

	/** Whether the backend API is reachable. */
	apiAvailable = false;

	// ─── Lifecycle ──────────────────────────────────────────────────────

	ngOnInit(): void {
		this.checkApi();
	}

	async checkApi(): Promise<void> {
		try {
			await this.api.ping().toPromise();
			this.apiAvailable = true;
		} catch {
			this.apiAvailable = false;
		}
	}

	// ─── Upload Handler ────────────────────────────────────────────────

	onUpload(event: { file: File }): void {
		const request: SplitRequest = {
			model: this.modelName,
			format: this.outputFormat,
			bitrate: this.bitrate,
		};

		// Show processing status immediately
		this.activeJob = {
			jobId: "",
			fileName: event.file.name,
			status: "queued",
			progress: 0,
			stage: "Uploading...",
		};
		this.completedStems = [];

		this.api.uploadAudio(event.file, request).subscribe({
			next: (resp) => {
				// Got a job ID from the backend
				if (resp.jobId) {
					this.activeJob!.jobId = resp.jobId;
					this.pollJobStatus(resp.jobId);
				} else {
					// Backend returned immediately — parse response as completed
					this.handleCompletion({
						jobId: "inline-" + Date.now(),
						fileName: event.file.name,
						status: "completed",
						progress: 100,
						stage: "completed",
					});
				}
			},
			error: (err) => {
				this.activeJob = {
					...this.activeJob!,
					status: "failed",
					error: err.message || "Upload failed. Check the API URL in Settings.",
				};
			},
		});
	}

	// ─── Job Status Polling ────────────────────────────────────────────

	/** Periodically fetch job progress until completion or failure. */
	private pollJobStatus(jobId: string): void {
		const poll = () => {
			this.api.getJob(jobId).subscribe({
				next: (job) => {
					this.activeJob = {
						jobId,
						fileName: job.fileName,
						status: job.status,
						progress: job.progress,
						stage:
							job.status === "processing" ? "Separating stems..." : undefined,
						error: job.error || undefined,
					};

					if (job.stems && job.stems.length > 0) {
						// Map Job interface to handleCompletion's expected shape
						this.handleCompletion({
							jobId: job.id,
							fileName: job.fileName,
							status: job.status,
							progress: job.progress,
							stage: "Splitting complete!",
						});
					} else if (job.status !== "completed" && job.status !== "failed") {
						setTimeout(poll, 3_000); // poll every 3 seconds
					} else {
						// Terminal state — stop polling
						if (job.status === "failed") {
							this.activeJob!.error = job.error ?? "Unknown error";
						}
					}
				},
				error: () => {
					// Polling failed — keep trying with backoff
					setTimeout(poll, 5_000);
				},
			});
		};

		poll();
	}

	private handleCompletion(job: {
		jobId: string;
		fileName: string;
		status: JobStatus;
		progress: number;
		stage?: string;
	}): void {
		this.activeJob = {
			...this.activeJob!,
			status: "completed",
			progress: 100,
			stage: "Splitting complete!",
		};

		// Fetch the job one more time to get stems list
		this.api.getJob(job.jobId).subscribe({
			next: (fullJob) => {
				if (fullJob.stems && fullJob.stems.length > 0) {
					this.completedStems = fullJob.stems.map((s) => ({
						name: s.name,
						displayName: s.displayName ?? s.name,
						path: s.path,
						sizeBytes: s.sizeBytes,
					}));
				}
			},
		});
	}

	// ─── Download Handlers ─────────────────────────────────────────────

	onStemDownload(stemName: string): void {
		if (!this.activeJob) return;
		const url = this.api.getStemUrl(this.activeJob.jobId, stemName);
		window.open(url, "_blank");
	}

	onDownloadAll(): void {
		// For now, open each stem in a new tab
		for (const stem of this.completedStems) {
			const url = this.api.getStemUrl(this.activeJob?.jobId ?? "", stem.name);
			window.open(url, "_blank");
		}
	}

	// ─── Utility ────────────────────────────────────────────────────────

	/** Get display label for the selected model. */
	getModelLabel(): string {
		return (
			AVAILABLE_MODELS.find((m) => m.id === this.modelName)?.label ??
			this.modelName
		);
	}

	/** Parse a string value to integer (for template bitrate binding). */
	parseIntVal(val: unknown): number {
		if (typeof val === "string") return Number.parseInt(val, 10);
		return 0;
	}

	/** Set model name from template event target. */
	setModelName(val: string): void {
		this.modelName = val;
	}

	/** Set output format from template event target. */
	setOutputFormat(val: string): void {
		if (val === "mp3" || val === "wav" || val === "flac") {
			this.outputFormat = val as "mp3" | "wav" | "flac";
		}
	}

	/** Set bitrate from template event target. */
	setBitrate(val: string): void {
		this.bitrate = Number.parseInt(val, 10);
	}

	isProcessing(): boolean {
		const s = this.activeJob?.status;
		return s === "processing" || s === "queued";
	}
}
