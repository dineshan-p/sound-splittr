import { Injectable, signal } from "@angular/core";
import type { AppSettings, OutputFormat } from "../models";
import { DEFAULT_SETTINGS } from "../models";

const STORAGE_KEY = "sound-splittr-settings";

@Injectable({ providedIn: "root" })
export class SettingsService {
	current = signal<AppSettings>(this.load());

	private load(): AppSettings {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed: Record<string, unknown> = JSON.parse(raw);

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

	patch(partial: Partial<AppSettings>): void {
		this.save({ ...this.current(), ...partial });
	}

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
