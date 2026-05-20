/**
 * Stem-List Component
 * ====================
 * Displays a list of stems from a completed job with individual download
 * buttons and an "Download All as ZIP" button.
 *
 * Each stem card is rendered using the <app-stem-player> component, so
 * users can audition each stem before downloading.
 */

import { Component, input, output } from "@angular/core";
import type { StemInfo } from "../../core/models";
import {
	StemPlayerComponent,
	type StemPlayerProps,
} from "../stem-player/stem-player";

@Component({
	selector: "app-stem-list",
	imports: [StemPlayerComponent],
	templateUrl: "./stem-list.html",
	styleUrl: "./stem-list.scss",
	standalone: true,
})
export class StemListComponent {
	/** All stems produced by a completed job. */
	stems = input.required<StemInfo[]>();

	/** Base URL for downloading stem files. */
	downloadBaseUrl = input.required<string>();

	/** Emits when the user clicks "Download All". */
	downloadAll = output<void>();

	/** Emits when a single stem is downloaded. */
	stemDownloaded = output<string>();

	// Map StemInfo → StemPlayerProps for the player component
	get playerStems(): StemPlayerProps[] {
		return this.stems().map((s) => ({
			name: s.name,
			displayName: s.displayName ?? capitalize(s.name),
			src: `${this.downloadBaseUrl()}/${encodeURIComponent(s.path.split("/").pop() ?? s.name)}`,
		}));
	}

	/** Total size of all stems combined. */
	get totalSize(): string {
		const bytes = this.stems().reduce((sum, s) => sum + (s.sizeBytes ?? 0), 0);
		if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
		if (bytes > 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
		return `${bytes} B`;
	}

	/** Handle individual stem download. */
	onStemDownload(name: string): void {
		this.stemDownloaded.emit(name);
	}
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
