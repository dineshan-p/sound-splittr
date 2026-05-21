import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SettingsPanelComponent } from "../../shared/settings-panel/settings-panel";

@Component({
	selector: "app-settings-page",
	imports: [RouterLink, SettingsPanelComponent],
	templateUrl: "./settings-page.html",
	styleUrl: "./settings-page.scss",
	standalone: true,
})
export class SettingsPage {}
