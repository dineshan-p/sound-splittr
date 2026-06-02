/**
 * Application routes.
 *
 * Three top-level pages: Home (upload + active job), Jobs (history),
 * Settings (backend URL, model, format, bitrate).  The wildcard route
 * redirects to Home so the user never sees a blank page.
 */
import type { Routes } from "@angular/router";
import { HomePage } from "./pages/home-page/home-page";
import { JobsPage } from "./pages/jobs-page/jobs-page";
import { SettingsPage } from "./pages/settings-page/settings-page";

export const routes: Routes = [
	{ path: "", component: HomePage },
	{ path: "jobs", component: JobsPage },
	{ path: "settings", component: SettingsPage },
	{ path: "**", redirectTo: "" },
];
