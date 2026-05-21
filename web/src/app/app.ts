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
