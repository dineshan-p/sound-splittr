/**
 * Stem-Player Component
 * ======================
 * An audio player for one individual stem (vocals, drums, bass, other).
 *
 * Features:
 * - Play / pause with a single button
 * - Seek bar scrubbing
 * - Volume slider
 * - Mute toggle
 * - Solo / mute-all buttons for live mixing
 * - Download link for the stem file
 */

import {
	Component,
	input,
	output,
	signal,
	type AfterViewInit,
	type OnDestroy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";

export interface StemPlayerProps {
	/** Unique identifier for this stem (e.g. "vocals"). */
	name: string;
	/** Human-readable label displayed in the UI. */
	displayName: string;
	/** URL to download / stream the stem audio file. */
	src: string;
	/** Current playback time in seconds (for sync with other stems). */
	currentTime?: number;
}

@Component({
	selector: "app-stem-player",
	imports: [FormsModule],
	templateUrl: "./stem-player.html",
	styleUrl: "./stem-player.scss",
	standalone: true,
})
export class StemPlayerComponent implements AfterViewInit, OnDestroy {
	/** Input props from parent. */
	stem = input.required<StemPlayerProps>();

	/** Emits when the user clicks download. */
	downloaded = output<string>();

	/** Internal audio element reference. */
	private audio: HTMLAudioElement | null = null;

	// Reactive state exposed to template
	isPlaying = signal(false);
	isMuted = signal(false);
	volume = signal(100);
	duration = signal(0);
	currentTime = signal(0);
	isSoloed = signal(false);

	// ─── Lifecycle ──────────────────────────────────────────────────────

	ngAfterViewInit(): void {
		this.audio = document.createElement("audio");
		this.audio.src = this.stem().src;
		this.audio.preload = "auto";

		this.audio.addEventListener("ended", () => this.isPlaying.set(false));
		this.audio.addEventListener("timeupdate", () => {
			this.currentTime.set(this.audio?.currentTime ?? 0);
		});
		this.audio.addEventListener("loadedmetadata", () => {
			this.duration.set(this.audio?.duration ?? 0);
		});
	}

	ngOnDestroy(): void {
		this.stop();
		this.audio = null;
	}

	// ─── Playback Controls ──────────────────────────────────────────────

	togglePlay(): void {
		if (!this.audio) return;

		if (this.isPlaying()) {
			this.pause();
		} else {
			this.play();
		}
	}

	private play(): void {
		if (!this.audio) return;
		// If another stem is soloed, pause it first
		document.dispatchEvent(
			new CustomEvent("stem-pause-other", { detail: this.stem().name }),
		);
		this.audio.play();
		this.isPlaying.set(true);
	}

	private pause(): void {
		if (!this.audio) return;
		this.audio.pause();
		this.isPlaying.set(false);
	}

	stop(): void {
		if (this.audio) {
			this.audio.pause();
			this.audio.currentTime = 0;
		}
		this.isPlaying.set(false);
		this.currentTime.set(0);
	}

	seek(event: Event): void {
		const targetTime = Number((event.target as HTMLInputElement).value);
		if (this.audio) {
			this.audio.currentTime = targetTime;
			this.currentTime.set(targetTime);
		}
	}

	// ─── Volume & Mute ──────────────────────────────────────────────────

	setVolume(event: Event): void {
		const val = Number((event.target as HTMLInputElement).value);
		this.volume.set(val);
		if (this.audio) {
			this.audio.volume = val / 100;
		}
		// If volume goes above 0, unmute
		if (val > 0 && this.isMuted()) {
			this.isMuted.set(false);
			if (this.audio) this.audio.muted = false;
		}
	}

	toggleMute(): void {
		const newMuted = !this.isMuted();
		this.isMuted.set(newMuted);
		if (this.audio) {
			this.audio.muted = newMuted;
		}
	}

	// ─── Solo / Mute-All ────────────────────────────────────────────────

	toggleSolo(): void {
		const wasSoloed = this.isSoloed();
		this.isSoloed.set(!wasSoloed);

		if (!wasSoloed) {
			// Pause all other stems when soloing
			document.dispatchEvent(new CustomEvent("stem-pause-all"));
		} else {
			// If no stem is soloed, resume whatever was playing
			document.dispatchEvent(new CustomEvent("resume-previous"));
		}
	}

	/** Handle global pause-other event from another stem's play. */
	handlePauseOther(): void {
		if (!this.isSoloed() && this.isPlaying()) {
			this.pause();
		}
	}

	/** Handle global mute-all event (when a non-soloed stem starts playing). */
	handleMuteAll(): void {
		// Don't mute ourselves if we're soloed
		if (!this.isSoloed()) {
			this.isMuted.set(true);
		}
	}

	/** Handle resume when the last solo is cleared. */
	handleResumePrevious(): void {
		// Only resume if no other stem is currently soloed
		// This coordination happens at the parent level
	}

	// ─── Utility ────────────────────────────────────────────────────────

	/** Format seconds as MM:SS or HH:MM:SS. */
	formatTime(seconds: number): string {
		const total = Math.floor(seconds);
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		const s = total % 60;

		if (h > 0) {
			return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
		}
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	/** Handle download button click. */
	onDownload(): void {
		this.downloaded.emit(this.stem().name);
	}
}
