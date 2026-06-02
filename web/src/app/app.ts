/**
 * Root component — the app shell.
 *
 * Renders the navigation bar and the outlet where child routes (Home, Jobs,
 * Settings) are displayed.  The NotificationToast is placed here so it appears
 * above all page content regardless of which route is active.
 */
import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { NotificationToastComponent } from "./shared/notification-toast/notification-toast";

@Component({
	selector: "app-root",
	imports: [
		RouterLink,
		RouterLinkActive,
		RouterOutlet,
		NotificationToastComponent,
	],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class AppComponent {}
