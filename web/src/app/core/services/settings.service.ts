/**
 * Settings service — persist and serve user preferences via localStorage.
 *
 * Handles backward-compatible migration of old setting keys (bitrate →
 * defaultBitrate, format → defaultFormat, model → defaultModel) so that
 * users who saved settings before those fields were renamed don't lose
 * their preferences.
 */
import { Injectable, signal } from "@angular/core";
import type { AppSettings, OutputFormat } from "../models";
import { DEFAULT_SETTINGS } from "../models";

const STORAGE_KEY = "sound-splittr-settings";

@Injectable({ providedIn: "root" })
export class SettingsService {
	current = signal<AppSettings>(this.load());

	/**
	 * Load settings from localStorage with migration support.
	 * Falls back to defaults on any parse error.
	 */
	private load(): AppSettings {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed: Record<string, unknown> = JSON.parse(raw);

				// Migrate old key names to new names (backward compat)
				if (
					parsed["bitrate"] !== undefined &&
					parsed["defaultBitrate"] === undefined
				) {
					parsed["defaultBitrate"] = parsed["bitrate"];
					delete parsed["bitrate"];
				}
				if (
					parsed["format"] !== undefined &&
					parsed["defaultFormat"] === undefined
				) {
					parsed["defaultFormat"] = parsed["format"];
					delete parsed["format"];
				}
				if (
					parsed["model"] !== undefined &&
					parsed["defaultModel"] === undefined
				) {
					parsed["defaultModel"] = parsed["model"];
					delete parsed["model"];
				}

				// Apply defaults for any missing or empty values
				if (
					parsed["apiUrl"] == null ||
					(typeof parsed["apiUrl"] === "string" &&
						parsed["apiUrl"].trim() === "")
				) {
					parsed["apiUrl"] = DEFAULT_SETTINGS.apiUrl;
				}
				if (
					parsed["defaultBitrate"] == null ||
					(typeof parsed["defaultBitrate"] === "number" &&
						parsed["defaultBitrate"] === 0)
				) {
					parsed["defaultBitrate"] = DEFAULT_SETTINGS.defaultBitrate;
				}
				if (
					parsed["defaultFormat"] == null ||
					(typeof parsed["defaultFormat"] === "string" &&
						parsed["defaultFormat"].trim() === "")
				) {
					parsed["defaultFormat"] = DEFAULT_SETTINGS.defaultFormat;
				}
				if (
					parsed["defaultModel"] == null ||
					(typeof parsed["defaultModel"] === "string" &&
						parsed["defaultModel"].trim() === "")
				) {
					parsed["defaultModel"] = DEFAULT_SETTINGS.defaultModel;
				}

				return { ...DEFAULT_SETTINGS, ...parsed } as AppSettings;
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

	/** Merge partial settings into the current set and persist. */
	patch(partial: Partial<AppSettings>): void {
		this.save({ ...this.current(), ...partial });
	}

	/** Reset all settings to factory defaults and clear localStorage. */
	reset(): void {
		localStorage.removeItem(STORAGE_KEY);
		this.current.set(DEFAULT_SETTINGS);
	}

	get apiUrl(): string {
		return this.current().apiUrl;
	}
	set apiUrl(value: string) {
		this.patch({ apiUrl: value });
	}

	get model(): string {
		return this.current().defaultModel;
	}
	set model(value: string) {
		this.patch({ defaultModel: value });
	}

	get format(): OutputFormat {
		return this.current().defaultFormat;
	}
	set format(value: OutputFormat) {
		this.patch({ defaultFormat: value });
	}

	get bitrate(): number {
		return this.current().defaultBitrate;
	}
	set bitrate(value: number) {
		this.patch({ defaultBitrate: value });
	}
}
