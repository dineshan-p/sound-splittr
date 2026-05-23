import { Component, type OnInit, inject } from "@angular/core";
import { lastValueFrom } from "rxjs";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { NotificationService } from "../../core/services/notification.service";
import type { Job } from "../../core/models";

export type JobStatusFilter = "all" | Job["status"];

@Component({
	selector: "app-jobs-page",
	imports: [RouterLink],
	templateUrl: "./jobs-page.html",
	styleUrl: "./jobs-page.scss",
	standalone: true,
})
export class JobsPage implements OnInit {
	private api = inject(ApiService);
	private notifications = inject(NotificationService);

	jobs: Job[] = [];
	loading = true;

	// Search & filter
	searchQuery = "";
	statusFilter: JobStatusFilter = "all";

	// Bulk selection
	selectedJobIds = new Set<string>();

	// Derived
	get filteredJobs(): Job[] {
		return this.jobs.filter((job) => {
			const matchesSearch =
				!this.searchQuery ||
				job.fileName.toLowerCase().includes(this.searchQuery.toLowerCase());
			const matchesStatus =
				this.statusFilter === "all" || job.status === this.statusFilter;
			return matchesSearch && matchesStatus;
		});
	}

	get isAllSelected(): boolean {
		return (
			this.filteredJobs.length > 0 &&
			this.filteredJobs.every((j) => this.selectedJobIds.has(j.id))
		);
	}

	get isSomeSelected(): boolean {
		const selectedInFiltered = this.filteredJobs.filter((j) =>
			this.selectedJobIds.has(j.id),
		);
		return selectedInFiltered.length > 0 && !this.isAllSelected;
	}

	get selectedCount(): number {
		// Count all selected, not just in current filter
		return this.selectedJobIds.size;
	}

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

	// --- Search & filter ---

	onSearchInput(event: Event): void {
		this.searchQuery = (event.target as HTMLInputElement).value;
		this.clearSelection();
	}

	onStatusFilter(status: JobStatusFilter): void {
		this.statusFilter = status;
		this.clearSelection();
	}

	// --- Bulk selection ---

	toggleSelectAll(): void {
		if (this.isAllSelected) {
			this.filteredJobs.forEach((j) => this.selectedJobIds.delete(j.id));
		} else {
			this.filteredJobs.forEach((j) => this.selectedJobIds.add(j.id));
		}
	}

	toggleSelect(jobId: string): void {
		if (this.selectedJobIds.has(jobId)) {
			this.selectedJobIds.delete(jobId);
		} else {
			this.selectedJobIds.add(jobId);
		}
	}

	clearSelection(): void {
		this.selectedJobIds.clear();
	}

	// --- Actions ---

	async onDelete(jobId: string): Promise<void> {
		const confirmed = await this.notifications.confirm(
			"Delete this job and all its stem files?",
		);
		if (!confirmed) return;
		try {
			await lastValueFrom(this.api.deleteJob(jobId));
			this.jobs = this.jobs.filter((j) => j.id !== jobId);
			this.selectedJobIds.delete(jobId);
			this.notifications.success("Job deleted");
		} catch (err) {
			this.notifications.error(`Failed to delete: ${err}`);
		}
	}

	async onBulkDelete(): Promise<void> {
		const count = this.selectedJobIds.size;
		const confirmed = await this.notifications.confirm(
			`Delete ${count} job${count > 1 ? "s" : ""} and all their stem files?`,
		);
		if (!confirmed) return;

		let deleted = 0;
		for (const jobId of this.selectedJobIds) {
			try {
				await lastValueFrom(this.api.deleteJob(jobId));
				this.jobs = this.jobs.filter((j) => j.id !== jobId);
				deleted++;
			} catch {
				// Skip failed deletions, continue with others
			}
		}

		this.selectedJobIds.clear();
		if (deleted > 0) {
			this.notifications.success(`Deleted ${deleted} job${deleted > 1 ? "s" : ""}`);
		}
	}

	// --- Helpers ---

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

	getStemCount(job: Job): number {
		return job.stems?.length ?? 0;
	}

	capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	// Format duration in a cleaner way
	formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.round(seconds % 60);
		if (mins > 0) {
			return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
		}
		return `${secs}s`;
	}

	// Get status icon SVG
	getStatusIcon(status: string): string {
		switch (status) {
			case "queued":
				return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
			case "processing":
				return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
			case "completed":
				return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
			case "failed":
				return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
			default:
				return "";
		}
	}

	// Status filter options
	get statusFilters(): { label: string; value: JobStatusFilter; count: number }[] {
		const counts: Record<string, number> = {};
		for (const job of this.jobs) {
			counts[job.status] = (counts[job.status] ?? 0) + 1;
		}
		return [
			{ label: "All", value: "all", count: this.jobs.length },
			{ label: "Queued", value: "queued", count: counts["queued"] ?? 0 },
			{ label: "Processing", value: "processing", count: counts["processing"] ?? 0 },
			{ label: "Completed", value: "completed", count: counts["completed"] ?? 0 },
			{ label: "Failed", value: "failed", count: counts["failed"] ?? 0 },
		];
	}

	// Escape HTML for safe rendering
	escapeHtml(text: string): string {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}
}
