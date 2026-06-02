/**
 * Stem list component — renders a list of separated stems with individual
 * player controls and a "download all" button.
 *
 * Each stem is rendered as a StemPlayerComponent.  The total size of all
 * stems is computed from the sizeBytes field on each StemInfo.
 */
import { Component, input, output, inject } from "@angular/core";
import type { StemInfo } from "../../core/models";
import {
	StemPlayerComponent,
	type StemPlayerProps,
} from "../stem-player/stem-player";
import { NotificationService } from "../../core/services/notification.service";

@Component({
	selector: "app-stem-list",
	imports: [StemPlayerComponent],
	templateUrl: "./stem-list.html",
	styleUrl: "./stem-list.scss",
	standalone: true,
})
export class StemListComponent {
	private notifications = inject(NotificationService);

	stems = input.required<StemInfo[]>();
	downloadBaseUrl = input.required<string>();
	downloadAll = output<void>();
	stemDownloaded = output<string>();

	/** Convert StemInfo[] into the format expected by StemPlayerComponent. */
	get playerStems(): StemPlayerProps[] {
		return this.stems().map((s) => ({
			name: s.name,
			displayName: s.displayName ?? capitalize(s.name),
			src: `${this.downloadBaseUrl()}/${encodeURIComponent(s.name)}`,
		}));
	}

	/** Sum the sizeBytes of all stems and format as human-readable size. */
	get totalSize(): string {
		const bytes = this.stems().reduce((sum, s) => sum + (s.sizeBytes ?? 0), 0);
		if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
		if (bytes > 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
		return `${bytes} B`;
	}

	onStemDownload(name: string): void {
		this.stemDownloaded.emit(name);
	}

	onDownloadAll(): void {
		this.downloadAll.emit();
		this.notifications.info(`Downloading ${this.stems().length} stems`);
	}
}

/** Capitalize the first letter of a string. */
function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
