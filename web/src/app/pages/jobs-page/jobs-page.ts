/**
 * Jobs Page — Job History
 * ========================
 * Lists all split jobs with their current status, creation date, and
 * quick actions (view stems, delete).
 */

import { Component, type OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import type { Job } from "../../core/models";

@Component({
	selector: "app-jobs-page",
	imports: [RouterLink],
	templateUrl: "./jobs-page.html",
	styleUrl: "./jobs-page.scss",
	standalone: true,
})
export class JobsPage implements OnInit {
	// Expose Math for template usage
	readonly Math = Math;

	private api = inject(ApiService);

	/** All jobs loaded from the backend. */
	jobs: Job[] = [];

	/** Whether we're currently fetching. */
	loading = true;

	ngOnInit(): void {
		this.loadJobs();
	}

	async loadJobs(): Promise<void> {
		this.loading = true;
		try {
			const jobs = await this.api.listJobs().toPromise();
			this.jobs = jobs ?? [];
		} catch (err) {
			console.error("Failed to load jobs:", err);
			// On error, show an empty list — the backend may not be running yet
			this.jobs = [];
		} finally {
			this.loading = false;
		}
	}

	/** Delete a job and refresh the list. */
	async onDelete(jobId: string): Promise<void> {
		if (!confirm("Delete this job and all its stem files?")) return;
		try {
			await this.api.deleteJob(jobId).toPromise();
			this.jobs = this.jobs.filter((j) => j.id !== jobId);
		} catch (err) {
			alert(`Failed to delete: ${err}`);
		}
	}

	/** Get a CSS class for the job status badge. */
	getStatusClass(status: string): string {
		const map: Record<string, string> = {
			queued: "badge-queued",
			processing: "badge-processing",
			completed: "badge-completed",
			failed: "badge-failed",
		};
		return `status-badge ${map[status] ?? ""}`;
	}

	/** Format an ISO timestamp to a relative time string. */
	formatRelative(isoString: string): string {
		const diff = Date.now() - new Date(isoString).getTime();
		const mins = Math.floor(diff / 60_000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	}

	/** Format file size. */
	formatSize(bytes: number): string {
		if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
		if (bytes > 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
		return `${bytes} B`;
	}

	/** Get stem count for a job. */
	getStemCount(job: Job): number {
		return job.stems?.length ?? 0;
	}

	/** Capitalize the first letter of a string (for template display). */
	capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
}
