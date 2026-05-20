/**
 * Settings Service — manages and persists application-wide configuration.
 *
 * Uses localStorage so the user's choices (API URL, preferred model, output
 * format) survive page reloads.  Falls back to sensible defaults on first
 * visit.
 */

import { Injectable, signal } from "@angular/core";
import type { AppSettings, OutputFormat } from "../models";
import { DEFAULT_SETTINGS } from "../models";

const STORAGE_KEY = "sound-splittr-settings";

@Injectable({ providedIn: "root" })
export class SettingsService {
	/** Reactive settings — components can subscribe with `settings.current()` */
	current = signal<AppSettings>(this.load());

	// ─── Persistence ────────────────────────────────────────────────

	private load(): AppSettings {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed: Partial<AppSettings> = JSON.parse(raw);
				return { ...DEFAULT_SETTINGS, ...parsed };
			}
		} catch {
			// corrupt data — just use defaults
		}
		return { ...DEFAULT_SETTINGS };
	}

	private save(settings: AppSettings): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
			this.current.set(settings);
		} catch (err) {
			console.error("[SettingsService] Failed to persist settings:", err);
		}
	}

	// ─── Public API ─────────────────────────────────────────────────

	/** Update one or more settings fields. */
	patch(partial: Partial<AppSettings>): void {
		this.save({ ...this.current(), ...partial });
	}

	/** Reset every setting back to factory defaults. */
	reset(): void {
		localStorage.removeItem(STORAGE_KEY);
		this.current.set(DEFAULT_SETTINGS);
	}

	/** Return the currently configured API base URL. */
	get apiUrl(): string {
		return this.current().apiUrl;
	}

	set apiUrl(value: string) {
		this.patch({ apiUrl: value });
	}

	/** Return the default Demucs model ID. */
	get model(): string {
		return this.current().defaultModel;
	}

	set model(value: string) {
		this.patch({ defaultModel: value });
	}

	/** Return the preferred output format (mp3 | wav | flac). */
	get format(): OutputFormat {
		return this.current().defaultFormat;
	}

	set format(value: OutputFormat) {
		this.patch({ defaultFormat: value });
	}

	/** Return the MP3 bitrate in kbps. */
	get bitrate(): number {
		return this.current().defaultBitrate;
	}

	set bitrate(value: number) {
		this.patch({ defaultBitrate: value });
	}
}
