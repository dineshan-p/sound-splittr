/**
 * Settings Page
 * =============
 * A dedicated full-page view for application settings using the shared
 * <app-settings-panel> component.
 */

import { Component } from "@angular/core";
import { SettingsPanelComponent } from "../../shared/settings-panel/settings-panel";

@Component({
	selector: "app-settings-page",
	imports: [SettingsPanelComponent],
	templateUrl: "./settings-page.html",
	styleUrl: "./settings-page.scss",
	standalone: true,
})
export class SettingsPage {}
