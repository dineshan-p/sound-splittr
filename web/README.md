# Sound Splittr — Angular Frontend

Angular 21 web UI for the Sound Splittr audio stem splitter. Drag-and-drop songs, watch real-time splitting progress, and download separated stems.

---

## Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will auto-reload when you edit source files.

### Build for Production

```bash
ng build
```

Output lands in `dist/sound-splittr-web/`. Serve these files with any static file server (nginx, Apache, etc.).

---

## Architecture

### Pages (Route-Level Components)

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing page with drag-drop upload, settings accordion, and stem display |
| Jobs | `/jobs` | Job history list with status badges, progress bars, and delete actions |
| Settings | `/settings` | Full-page settings view (API URL, model, format, bitrate) |

### Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| UploadArea | `shared/upload-area/` | Drag-and-drop zone with file validation |
| ProcessingStatus | `shared/processing-status/` | Circular progress ring with stage labels |
| StemPlayer | `shared/stem-player/` | Per-stem audio player (play/pause, seek, volume, mute/solo) |
| StemList | `shared/stem-list/` | Grid of StemPlayer components with download buttons |
| SettingsPanel | `shared/settings-panel/` | Form for API URL, model, format, bitrate |

### Core Services

| Service | Location | Purpose |
|---------|----------|---------|
| ApiService | `core/services/api.service.ts` | HTTP client for all backend REST calls |
| SettingsService | `core/services/settings.service.ts` | localStorage persistence for user settings (signals-based) |

### Data Models

All TypeScript interfaces live in `core/models/index.ts`:

- `Job` — Represents a split job (id, fileName, status, progress, stems, etc.)
- `JobStatus` — Union type: `"queued" | "processing" | "completed" | "failed"`
- `StemInfo` — Metadata for a single stem file
- `SplitRequest` — Payload sent to the backend when uploading
- `UploadResponse` — Response from the upload endpoint
- `ModelOption` — Available Demucs models with labels and descriptions
- `AppSettings` — Persisted user preferences (apiUrl, defaultModel, format, bitrate)

---

## Theming

The app uses a dark theme defined by CSS custom properties in `src/styles.scss`:

```scss
:root {
  --color-bg: #0f172a;
  --color-text: #e2e8f0;
  --color-accent: #6c63ff;
  --color-border: #4a5568;
  /* ... more tokens */
}
```

Override these variables to create a light mode or custom theme.

---

## Backend API Integration

The frontend expects a REST API at the URL configured in Settings. See the project root `README.md` for the full API spec.

**Expected endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload audio + start split → `{ jobId }` |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/:id` | Get job details |
| DELETE | `/api/jobs/:id` | Delete a job |
| GET | `/api/stems/:jobId/:stem` | Download a stem file |
| GET | `/api/health` | Health check |

Until the backend is running, the UI shows a warning banner and works in demo mode.

---

## Testing

```bash
ng test          # Run unit tests (Vitest)
ng lint          # Lint TypeScript and SCSS
```

---

## Key Files

- `src/app/app.ts` — Shell component with navigation bar
- `src/app/app.routes.ts` — Route definitions
- `src/app/app.config.ts` — Application providers (HTTP client, router)
- `src/styles.scss` — Global CSS variables and base reset
- `src/main.ts` — Bootstrap entry point
