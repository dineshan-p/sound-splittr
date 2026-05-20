/**
 * App Shell — Main Layout
 * ========================
 * The root component that wraps all pages with a navigation bar.
 */

import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

@Component({
	selector: "app-root",
	imports: [RouterLink, RouterLinkActive, RouterOutlet],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class AppComponent {}
