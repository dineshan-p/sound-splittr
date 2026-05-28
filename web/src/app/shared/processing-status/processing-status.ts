/**
 * Processing status component — shows the current job's progress bar,
 * stage label, and status icon.
 *
 * The stage labels are mapped from backend stage names (snake_case) to
 * human-readable strings via the STAGE_LABELS constant.
 */
import { Component, input } from "@angular/core";
import type { JobStatus } from "../../core/models";

export interface JobStatusInfo {
	jobId: string;
	fileName: string;
	status: JobStatus;
	progress: number;
	stage?: string;
	error?: string;
}

/** Maps backend stage names to human-readable labels. */
const STAGE_LABELS: Record<string, string> = {
	queued: "Queued — waiting for processing slot",
	loading_model: "Loading Demucs model...",
	splitting: "Separating stems...",
	saving: "Saving stem files...",
	completed: "Splitting complete!",
	failed: "Processing failed",
};

@Component({
	selector: "app-processing-status",
	imports: [],
	templateUrl: "./processing-status.html",
	styleUrl: "./processing-status.scss",
	standalone: true,
})
export class ProcessingStatusComponent {
	job = input.required<JobStatusInfo>();

	get stageLabel(): string {
		const key = (this.job().stage || this.job().status)
			.toLowerCase()
			.replace(/ /g, "_");
		return (
			STAGE_LABELS[key] ??
			`${capitalize(this.job().status)} — ${this.job().fileName}`
		);
	}

	get statusClass(): string {
		const s = this.job().status;
		if (s === "completed") return "status-complete";
		if (s === "failed") return "status-failed";
		return "status-processing";
	}

	get progressFormatted(): string {
		const p = this.job().progress;
		return p % 1 === 0 ? `${p}%` : `${p.toFixed(1)}%`;
	}
}

/** Capitalize the first letter of a string (e.g. "failed" → "Failed"). */
function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
