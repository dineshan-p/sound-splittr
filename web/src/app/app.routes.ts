/**
 * Application Routes
 * ====================
 *
 * /		→ Home page (upload + stem results)
 * /jobs	→ Job history list
 * /settings → Settings panel
 */
import type { Routes } from "@angular/router";
import { HomePage } from "./pages/home-page/home-page";
import { JobsPage } from "./pages/jobs-page/jobs-page";
import { SettingsPage } from "./pages/settings-page/settings-page";

export const routes: Routes = [
	{ path: "", component: HomePage },
	{ path: "jobs", component: JobsPage },
	{ path: "settings", component: SettingsPage },
	// Catch-all: redirect to home
	{ path: "**", redirectTo: "" },
];
