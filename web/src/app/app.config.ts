/**
 * App configuration — providers and router setup.
 *
 * Loaded once by main.ts to bootstrap the Angular application.
 * HTTP client is provided globally so every service can make API calls.
 */
import {
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideHttpClient(),
		provideRouter(routes),
	],
};
