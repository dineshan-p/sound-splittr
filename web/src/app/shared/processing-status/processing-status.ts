/**
 * Processing-Status Component
 * ============================
 * Displays real-time progress of an audio-splitting job.
 *
 * Shows a circular or linear progress indicator, human-readable status
 * messages ("Loading model...", "Separating vocals...", etc.), and an
 * estimated time remaining based on elapsed time.
 */

import { Component, input } from "@angular/core";
import type { JobStatus } from "../../core/models";

export interface JobStatusInfo {
	jobId: string;
	fileName: string;
	status: JobStatus;
	progress: number; // 0–100
	stage?: string; // e.g. "Separating vocals"
	error?: string;
}

const STAGE_LABELS: Record<string, string> = {
	queued: "⏳ Queued — waiting for processing slot",
	loading_model: "🧠 Loading Demucs model...",
	splitting: "✂️ Separating stems...",
	saving: "💾 Saving stem files...",
	completed: "✅ Splitting complete!",
	failed: "❌ Processing failed",
};

@Component({
	selector: "app-processing-status",
	imports: [],
	templateUrl: "./processing-status.html",
	styleUrl: "./processing-status.scss",
	standalone: true,
})
export class ProcessingStatusComponent {
	/** Input binding from parent component. */
	job = input.required<JobStatusInfo>();

	/** Get a human-readable stage label. Falls back to status name. */
	get stageLabel(): string {
		const key = (this.job().stage || this.job().status)
			.toLowerCase()
			.replace(/ /g, "_");
		return (
			STAGE_LABELS[key] ??
			`${capitalize(this.job().status)} — ${this.job().fileName}`
		);
	}

	/** Determine CSS class for the progress ring color. */
	get statusClass(): string {
		const s = this.job().status;
		if (s === "completed") return "status-complete";
		if (s === "failed") return "status-failed";
		return "status-processing";
	}

	/** Percentage formatted with one decimal. */
	get progressFormatted(): string {
		return `${this.job().progress.toFixed(1)}%`;
	}
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
