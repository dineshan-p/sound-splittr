]133;A\]133;A\]133;A\import { Component, type OnInit, type OnDestroy, inject } from "@angular/core";
import { lastValueFrom, Subject } from "rxjs";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import type { SplitRequest, JobStatus } from "../../core/models";
import { AVAILABLE_MODELS } from "../../core/models";
import { SettingsService } from "../../core/services/settings.service";
import { ApiService } from "../../core/services/api.service";
import { NotificationService } from "../../core/services/notification.service";
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
export class HomePage implements OnInit, OnDestroy {
	readonly models = AVAILABLE_MODELS;

	readonly api = inject(ApiService);
	readonly settings = inject(SettingsService);
	private notifications = inject(NotificationService);
	private destroy$ = new Subject<void>();
	private queueInterval: ReturnType<typeof setInterval> | null = null;

	modelName = this.settings.model;
	outputFormat: "mp3" | "wav" | "flac" = this.settings.format;
	bitrate = this.settings.bitrate || 320;

	activeJob: {
		jobId: string;
		fileName: string;
		status: JobStatus;
		progress: number;
		stage?: string;
		error?: string;
	} | null = null;

	completedStems: Array<{
		name: string;
		displayName: string;
		path: string;
		sizeBytes: number;
	}> = [];

	apiAvailable = false;
	apiUrlConfigured = false;
	apiChecked = false;

	queueStatus: {
		queue_size: number;
		active_count: number;
		total_jobs: number;
		gpu: { free_gb: number; total_gb: number; used_gb: number } | null;
	} | null = null;

	ngOnInit(): void {
		this.apiUrlConfigured = !!this.settings.current().apiUrl;
		this.checkApi();
		this.loadQueueStatus();
		// Poll queue status every 5 seconds; fast enough for responsive UI
		// without hammering the backend.
		this.queueInterval = setInterval(() => this.loadQueueStatus(), 5000);
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.queueInterval !== null) {
			clearInterval(this.queueInterval);
			this.queueInterval = null;
		}
	}

	async checkApi(): Promise<void> {
		try {
			await lastValueFrom(this.api.ping());
			this.apiAvailable = true;
		} catch {
			this.apiAvailable = false;
		} finally {
			this.apiChecked = true;
		}
	}

	private loadQueueStatus(): void {
		this.api.ping().subscribe({
			next: (status) => {
				this.queueStatus = status;
			},
			error: () => {},
		});
	}

	onUpload(event: { file: File }): void {
		const request: SplitRequest = {
			model: this.modelName,
			format: this.outputFormat,
			bitrate: this.bitrate,
		};

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
				if (resp.jobId) {
					this.activeJob!.jobId = resp.jobId;
					this.pollJobStatus(resp.jobId);
				} else {
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
				this.notifications.error(
					"Upload failed. Check the API URL in Settings.",
				);
			},
		});
	}

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
						this.handleCompletion({
							jobId: job.id,
							fileName: job.fileName,
							status: job.status,
							progress: job.progress,
							stage: "Splitting complete!",
						});
					} else if (job.status !== "completed" && job.status !== "failed") {
							// Normal polling: check every 3 seconds
							setTimeout(poll, 3_000);
						} else {
							if (job.status === "failed") {
								this.activeJob!.error = job.error ?? "Unknown error";
								this.notifications.error(job.error ?? "Processing failed");
							}
						}
				},
					error: () => {
						// Back off to 5 seconds on error to avoid flooding the API
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

		this.notifications.success("Splitting complete! Stems are ready.");

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

	onStemDownload(stemName: string): void {
		if (!this.activeJob) return;
		const url = this.api.getStemUrl(this.activeJob.jobId, stemName);
		window.open(url, "_blank");
	}

	onDownloadAll(): void {
		for (const stem of this.completedStems) {
			const url = this.api.getStemUrl(this.activeJob?.jobId ?? "", stem.name);
			window.open(url, "_blank");
		}
		this.notifications.info(`Downloading ${this.completedStems.length} stems`);
	}

	getModelLabel(): string {
		return (
			AVAILABLE_MODELS.find((m) => m.id === this.modelName)?.label ??
			this.modelName
		);
	}

	parseIntVal(val: unknown): number {
		if (typeof val === "string") return Number.parseInt(val, 10);
		return 0;
	}

	formatSize(bytes: number): string {
		if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
		if (bytes > 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
		return `${bytes} B`;
	}

	setModelName(val: string): void {
		this.modelName = val;
	}

	setOutputFormat(val: string): void {
		if (val === "mp3" || val === "wav" || val === "flac") {
			this.outputFormat = val as "mp3" | "wav" | "flac";
		}
	}

	isProcessing(): boolean {
		const s = this.activeJob?.status;
		return s === "processing" || s === "queued";
	}
}
