import {
	Component,
	input,
	output,
	signal,
	type AfterViewInit,
	type OnDestroy,
	inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NotificationService } from "../../core/services/notification.service";

export interface StemPlayerProps {
	name: string;
	displayName: string;
	src: string;
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
	private notifications = inject(NotificationService);

	stem = input.required<StemPlayerProps>();
	downloaded = output<string>();

	private audio: HTMLAudioElement | null = null;

	isPlaying = signal(false);
	isMuted = signal(false);
	volume = signal(100);
	duration = signal(0);
	currentTime = signal(0);
	isSoloed = signal(false);

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
		// Notify other stem-player instances so they can pause themselves.
		// We use CustomEvent on document instead of a shared service to keep
		// the component self-contained — each player broadcasts its own identity
		// and listens for the "pause-other" signal.
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

	setVolume(event: Event): void {
		const val = Number((event.target as HTMLInputElement).value);
		this.volume.set(val);
		if (this.audio) {
			this.audio.volume = val / 100;
		}
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

	toggleSolo(): void {
		const wasSoloed = this.isSoloed();
		this.isSoloed.set(!wasSoloed);

		if (!wasSoloed) {
			// When soloing, pause every other player and broadcast the event
			// so they know to stop.
			document.dispatchEvent(new CustomEvent("stem-pause-all"));
		} else {
			// When un-soloing, resume the previously-playing player.
			document.dispatchEvent(new CustomEvent("resume-previous"));
		}
	}

	handlePauseOther(): void {
		if (!this.isSoloed() && this.isPlaying()) {
			this.pause();
		}
	}

	handleMuteAll(): void {
		if (!this.isSoloed()) {
			this.isMuted.set(true);
		}
	}

	handleResumePrevious(): void {
		// Coordinated at parent level
	}

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

	onDownload(): void {
		this.downloaded.emit(this.stem().name);
		this.notifications.info(`Downloading ${this.stem().displayName}`);
	}
}
