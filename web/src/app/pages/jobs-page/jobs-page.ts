import { Component, type OnInit, inject } from "@angular/core";
import { lastValueFrom } from "rxjs";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { NotificationService } from "../../core/services/notification.service";
import type { Job } from "../../core/models";

@Component({
	selector: "app-jobs-page",
	imports: [RouterLink],
	templateUrl: "./jobs-page.html",
	styleUrl: "./jobs-page.scss",
	standalone: true,
})
export class JobsPage implements OnInit {
	readonly Math = Math;

	private api = inject(ApiService);
	private notifications = inject(NotificationService);

	jobs: Job[] = [];
	loading = true;

	ngOnInit(): void {
		this.loadJobs();
	}

	async loadJobs(): Promise<void> {
		this.loading = true;
		try {
			const jobs = await lastValueFrom(this.api.listJobs(), {
				defaultValue: [],
			});
			this.jobs = jobs;
		} catch (err) {
			this.notifications.error(
				"Failed to load job history. The backend may not be running.",
			);
			this.jobs = [];
		} finally {
			this.loading = false;
		}
	}

	async onDelete(jobId: string): Promise<void> {
		const confirmed = await this.notifications.confirm(
			"Delete this job and all its stem files?",
		);
		if (!confirmed) return;
		try {
			await lastValueFrom(this.api.deleteJob(jobId));
			this.jobs = this.jobs.filter((j) => j.id !== jobId);
			this.notifications.success("Job deleted");
		} catch (err) {
			this.notifications.error(`Failed to delete: ${err}`);
		}
	}

	getStatusClass(status: string): string {
		const map: Record<string, string> = {
			queued: "badge-queued",
			processing: "badge-processing",
			completed: "badge-completed",
			failed: "badge-failed",
		};
		return `status-badge ${map[status] ?? ""}`;
	}

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

	formatSize(bytes: number): string {
		if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
		if (bytes > 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
		return `${bytes} B`;
	}

	getStemCount(job: Job): number {
		return job.stems?.length ?? 0;
	}

	capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
}
