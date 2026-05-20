import {
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideHttpClient(withFetch()), // HTTP client for API calls
		provideRouter(routes), // Router for page navigation
	],
};
