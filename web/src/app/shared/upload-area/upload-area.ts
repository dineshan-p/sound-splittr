import { Component, output, inject } from "@angular/core";
import { NotificationService } from "../../core/services/notification.service";

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
	private notifications = inject(NotificationService);

	uploaded = output<UploadEvent>();
	isDragging = false;

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

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			this.handleFile(file);
		}
		input.value = "";
	}

	private handleFile(file: File): void {
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

		const ext = file.name.split(".").pop()?.toLowerCase();
		const acceptedExts = ["mp3", "wav", "flac", "ogg", "m4a", "aac", "wma"];

		if (
			(!accepted.includes(file.type) && !ext) ||
			!ext ||
			!acceptedExts.includes(ext)
		) {
			this.notifications.error(
				"Please drop an audio file (MP3, WAV, FLAC, OGG, M4A).",
			);
			return;
		}

		const maxMB = 500;
		if (file.size > maxMB * 1024 * 1024) {
			this.notifications.warning(
				`File is ${this.formatSize(file.size)}. Large files may take a while or run out of memory.`,
			);
		}

		this.uploaded.emit({ file });
	}

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
