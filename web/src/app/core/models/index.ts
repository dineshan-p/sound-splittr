// TypeScript interfaces for all API requests/responses.
// All types mirror the Python dataclasses in src/api/queue.py and
// the response shapes in src/api/server.py.

/**
 * Represents one upload + split job.
 * Mirrors the Job dataclass in src/api/queue.py.
 */
export interface Job {
	id: string;
	fileName: string;
	fileSize: number;
	durationSeconds: number | null;
	status: JobStatus;
	progress: number;
	modelUsed: string | null;
	stems?: StemInfo[];
	error?: string | null;
	createdAt: string;
	completedAt?: string | null;
}

/** Possible states for a job in the processing pipeline. */
export type JobStatus =
	| "queued"
	| "processing"
	| "completed"
	| "failed"
	| "unknown";

/** Metadata about one separated stem file. */
export interface StemInfo {
	/** Internal name (vocals, drums, bass, other, etc.) */
	name: string;
	/** Display-friendly label shown in the UI */
	displayName: string;
	/** Absolute path on the server filesystem */
	path: string;
	/** File size in bytes */
	sizeBytes: number;
}

/** Response from the /api/upload endpoint. */
export interface UploadResponse {
	/** Unique job identifier */
	jobId: string;
	/** Human-readable message about the result */
	message: string;
	/** Whether the job is waiting in the queue */
	queued?: boolean;
	/** Queue position (only when queued is true) */
	position?: number;
	/** GPU memory status at upload time */
	gpu?: { free_gb: number; total_gb: number; used_gb: number } | null;
	/** Device used for processing (cuda or cpu) */
	device?: string;
}

/** Request body for the /api/upload endpoint. */
export interface SplitRequest {
	/** Demucs model to use */
	model: string;
	/** Output format */
	format: OutputFormat;
	/** MP3 bitrate in kbps (only used when format is mp3) */
	bitrate?: number;
}

/** User preferences persisted in localStorage. */
export interface AppSettings {
	/** Base URL of the FastAPI backend */
	apiUrl: string;
	/** Default Demucs model */
	defaultModel: string;
	/** Default output format */
	defaultFormat: OutputFormat;
	/** Default MP3 bitrate */
	defaultBitrate: number;
}

/** Supported audio output formats. */
export type OutputFormat = "mp3" | "wav" | "flac";

/** One option in the model selector dropdown. */
export interface ModelOption {
	/** Model identifier (matches Demucs pretrained model name) */
	id: string;
	/** Display label */
	label: string;
	/** Short description for the UI */
	description: string;
	/** Number of stems this model produces */
	stemCount: number;
}

/** Available Demucs models, used to populate the model selector. */
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

/** Default settings used when no user preferences are saved. */
export const DEFAULT_SETTINGS: AppSettings = {
	apiUrl: window.location.origin,
	defaultModel: "htdemucs",
	defaultFormat: "mp3",
	defaultBitrate: 320,
};
