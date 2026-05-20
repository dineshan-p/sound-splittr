/**
 * TypeScript interfaces for all API requests/responses.
 *
 * Keeps the frontend type-safe and makes it easy to update when the
 * backend schema changes — every consumer imports from this single file.
 */

// ─── Processing Jobs ──────────────────────────────────────────────

/** Represents one upload + split job in the system. */
export interface Job {
	id: string; // unique job identifier (UUID)
	fileName: string; // original audio filename
	fileSize: number; // size in bytes
	durationSeconds: number | null; // detected from file metadata
	status: JobStatus; // current processing stage
	progress: number; // 0–100 percentage
	modelUsed: string | null; // which Demucs model was used
	stems?: StemInfo[]; // populated once job completes
	error?: string | null; // populated on failure
	createdAt: string; // ISO timestamp
	completedAt?: string | null; // ISO timestamp when finished
}

/** All possible states a job can be in. */
export type JobStatus =
	| "queued" // waiting for processing slot
	| "processing" // Demucs is running
	| "completed" // all stems saved to disk
	| "failed" // an error occurred
	| "unknown"; // fallback

/** Metadata about one separated stem file. */
export interface StemInfo {
	name: string; // e.g. "vocals", "drums"
	displayName: string; // human-readable label ("Vocals")
	path: string; // relative server path for download
	sizeBytes: number; // file size on disk
}

// ─── Upload / Processing Requests ─────────────────────────────────

export interface UploadResponse {
	jobId: string; // ID returned immediately after upload
	message: string; // human-readable status
}

/** Payload sent to the backend when starting a new split. */
export interface SplitRequest {
	model: string; // "htdemucs", "mdxdemucs", "htdemucs_6s"
	format: OutputFormat; // "mp3", "wav", "flac"
	bitrate?: number; // MP3 bitrate in kbps (only for mp3)
}

// ─── Settings / Configuration ─────────────────────────────────────

/** All the user-facing settings persisted to localStorage. */
export interface AppSettings {
	apiUrl: string; // backend base URL, e.g. "http://localhost:8000"
	defaultModel: string; // preferred Demucs model
	defaultFormat: OutputFormat;
	defaultBitrate: number; // kbps for MP3 output
}

/** Allowed output audio formats. */
export type OutputFormat = "mp3" | "wav" | "flac";

/** Available Demucs models with metadata for the UI to display. */
export interface ModelOption {
	id: string; // matches backend model name
	label: string; // human-readable, e.g. "HTDemucs (Balanced)"
	description: string; // one-line explanation
	stemCount: number; // how many stems it produces
}

export const AVAILABLE_MODELS: ModelOption[] = [
	{
		id: "htdemucs",
		label: "HTDemucs",
		description: "Balanced quality & speed. Great for most genres.",
		stemCount: 4,
	},
	{
		id: "mdxdemucs",
		label: "MDXDemucs (Highest Quality)",
		description: "Superior separation but slower processing.",
		stemCount: 4,
	},
	{
		id: "htdemucs_6s",
		label: "HTDemucs 6-Stem",
		description: "Six separate stems for detailed control.",
		stemCount: 6,
	},
];

/** Default settings used before the user customizes anything. */
export const DEFAULT_SETTINGS: AppSettings = {
	apiUrl: window.location.origin.replace(/\d+$/, "8000"), // guess :8000 API port
	defaultModel: "htdemucs",
	defaultFormat: "mp3",
	defaultBitrate: 320,
};
