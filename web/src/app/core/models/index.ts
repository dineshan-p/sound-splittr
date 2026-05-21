// TypeScript interfaces for all API requests/responses.

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

export type JobStatus =
	| "queued"
	| "processing"
	| "completed"
	| "failed"
	| "unknown";

export interface StemInfo {
	name: string;
	displayName: string;
	path: string;
	sizeBytes: number;
}

export interface UploadResponse {
	jobId: string;
	message: string;
	queued?: boolean;
	position?: number;
	gpu?: { free_gb: number; total_gb: number; used_gb: number } | null;
	device?: string;
}

export interface SplitRequest {
	model: string;
	format: OutputFormat;
	bitrate?: number;
}

export interface AppSettings {
	apiUrl: string;
	defaultModel: string;
	defaultFormat: OutputFormat;
	defaultBitrate: number;
}

export type OutputFormat = "mp3" | "wav" | "flac";

export interface ModelOption {
	id: string;
	label: string;
	description: string;
	stemCount: number;
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

export const DEFAULT_SETTINGS: AppSettings = {
	apiUrl: window.location.origin,
	defaultModel: "htdemucs",
	defaultFormat: "mp3",
	defaultBitrate: 320,
};
