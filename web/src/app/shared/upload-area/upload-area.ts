/**
 * Upload-Area Component
 * =====================
 * A drag-and-drop zone for dropping audio files to be split into stems.
 *
 * Displays file size validation (warns if > 500 MB since Demucs loads the
 * entire file into memory), shows a preview of the selected file, and fires
 * an `uploaded` event with the File object so a parent component can kick off
 * the actual upload to the backend.
 */

import { Component, output } from "@angular/core";

export interface UploadEvent {
	file: File;
}

@Component({
	selector: "app-upload-area",
	imports: [],
	templateUrl: "./upload-area.html",
	styleUrl: "./upload-area.scss",
	standalone: true,
})
export class UploadAreaComponent {
	/** Emits when a valid file has been dropped or selected. */
	uploaded = output<UploadEvent>();

	/** Currently hovered state for visual feedback. */
	isDragging = false;

	// ─── Drag-and-Drop Handlers ─────────────────────────────────────

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		this.isDragging = true;
	}

	onDragLeave(event: DragEvent): void {
		event.preventDefault();
		this.isDragging = false;
	}

	onDrop(event: DragEvent): void {
		event.preventDefault();
		this.isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			this.handleFile(files[0]);
		}
	}

	// ─── File Input Handler ──────────────────────────────────────────

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			this.handleFile(file);
		}
		// Reset so the same file can be re-selected
		input.value = "";
	}

	private handleFile(file: File): void {
		// Accept common audio formats
		const accepted = [
			"audio/mpeg",
			"audio/wav",
			"audio/x-wav",
			"audio/flac",
			"audio/ogg",
			"audio/mp4",
			"video/mp4",
			"audio/x-m4a",
		];

		// Also accept by extension if MIME type is generic
		const ext = file.name.split(".").pop()?.toLowerCase();
		const acceptedExts = ["mp3", "wav", "flac", "ogg", "m4a", "aac", "wma"];

		if (
			(!accepted.includes(file.type) && !ext) ||
			!ext ||
			!acceptedExts.includes(ext)
		) {
			alert("Please drop an audio file (MP3, WAV, FLAC, OGG, M4A).");
			return;
		}

		// Warn about very large files — Demucs loads the whole thing into memory
		const maxMB = 500;
		if (file.size > maxMB * 1024 * 1024) {
			const confirmed = confirm(
				`File is ${this.formatSize(file.size)}. Large files may take a while or run out of memory.\n\nContinue?`,
			);
			if (!confirmed) return;
		}

		this.uploaded.emit({ file });
	}

	/** Format byte count to human-readable string. */
	formatSize(bytes: number): string {
		const units = ["B", "KB", "MB", "GB"];
		let i = 0;
		while (bytes >= 1024 && i < units.length - 1) {
			bytes /= 1024;
			i++;
		}
		return `${bytes.toFixed(1)} ${units[i]}`;
	}
}
