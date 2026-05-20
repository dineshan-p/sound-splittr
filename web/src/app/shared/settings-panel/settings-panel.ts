/**
 * Settings-Panel Component
 * =========================
 * A compact form panel for adjusting application settings: API URL,
 * default model, output format, and MP3 bitrate.
 */

import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AVAILABLE_MODELS, type OutputFormat } from "../../core/models";
import { SettingsService } from "../../core/services/settings.service";

@Component({
	selector: "app-settings-panel",
	imports: [FormsModule],
	templateUrl: "./settings-panel.html",
	styleUrl: "./settings-panel.scss",
	standalone: true,
})
export class SettingsPanelComponent {
	// Reactive settings — always read latest from service
	get apiUrl(): string {
		return this.settings.apiUrl;
	}
	set apiUrl(v: string) {
		this.settings.apiUrl = v;
	}

	get model(): string {
		return this.settings.model;
	}
	set model(v: string) {
		this.settings.model = v;
	}

	get format(): OutputFormat {
		return this.settings.format;
	}
	set format(v: OutputFormat) {
		this.settings.format = v;
	}

	get bitrate(): number {
		return this.settings.bitrate;
	}
	set bitrate(v: number) {
		this.settings.bitrate = v;
	}

	// Available models for the dropdown
	readonly models = AVAILABLE_MODELS;

	constructor(private settings: SettingsService) {
		// Auto-save on every change thanks to the setter
	}

	/** Convert a string value to integer for the bitrate setting. */
	parseIntValue(val: string): number {
		return Number.parseInt(val, 10);
	}

	/** Reset everything back to factory defaults. */
	resetToDefaults(): void {
		if (confirm("Reset all settings to their default values?")) {
			this.settings.reset();
		}
	}

	/** Test whether the configured API URL is reachable. */
	async testConnection(): Promise<void> {
		try {
			// Use fetch since we don't have a dedicated health service yet
			const resp = await fetch(`${this.apiUrl}/api/health`, { method: "GET" });
			if (resp.ok) {
				alert("✅ Backend is reachable!");
			} else {
				alert(`⚠️  Server responded with status ${resp.status}`);
			}
		} catch (err) {
			alert(
				`❌ Cannot reach backend at ${this.apiUrl}\n\nMake sure the API server is running.`,
			);
		}
	}

	/** Format label for the selected model. */
	getModelLabel(id: string): string {
		return AVAILABLE_MODELS.find((m) => m.id === id)?.label ?? id;
	}
}
