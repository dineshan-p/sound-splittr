import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AVAILABLE_MODELS, type OutputFormat } from "../../core/models";
import { SettingsService } from "../../core/services/settings.service";
import { NotificationService } from "../../core/services/notification.service";

@Component({
	selector: "app-settings-panel",
	imports: [FormsModule],
	templateUrl: "./settings-panel.html",
	styleUrl: "./settings-panel.scss",
	standalone: true,
})
export class SettingsPanelComponent {
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

	readonly models = AVAILABLE_MODELS;

	constructor(
		private settings: SettingsService,
		private notifications: NotificationService,
	) {}

	parseIntValue(val: string): number {
		return Number.parseInt(val, 10);
	}

	setFormatValue(val: string): void {
		if (val === "mp3" || val === "wav" || val === "flac") {
			this.format = val as OutputFormat;
		}
	}

	resetToDefaults(): void {
		this.settings.reset();
		this.notifications.success("Settings reset to defaults");
	}

	async testConnection(): Promise<void> {
		try {
			const resp = await fetch(`${this.apiUrl}/api/health`, { method: "GET" });
			if (resp.ok) {
				this.notifications.success("Backend is reachable");
			} else {
				this.notifications.warning(
					`Server responded with status ${resp.status}`,
				);
			}
		} catch (err) {
			this.notifications.error(
				`Cannot reach backend at ${this.apiUrl}\nMake sure the API server is running.`,
			);
		}
	}

	getModelLabel(id: string): string {
		return AVAILABLE_MODELS.find((m) => m.id === id)?.label ?? id;
	}
}
