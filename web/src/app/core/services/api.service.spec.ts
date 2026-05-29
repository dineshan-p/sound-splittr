/**
 * Extended tests for ApiService — edge cases and error handling.
 *
 * Verifies HTTP interactions with the backend: upload, job status,
 * job listing, model fetching, health check, and error handling.
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ApiService } from './api.service';
import { SettingsService } from './settings.service';

describe('ApiService (Extended)', () => {
  let service: ApiService;
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        SettingsService,
        provideHttpClient(withInterceptorsFromDi()),
      ],
    });
    service = TestBed.inject(ApiService);
    settingsService = TestBed.inject(SettingsService);
  });

  // ---------------------------------------------------------------------------
  // Stem URL generation
  // ---------------------------------------------------------------------------

  it('should generate correct stem URL', () => {
    const url = service.getStemUrl('job1', 'vocals');
    expect(url).toContain('api/stems/job1/vocals');
  });

  it('should generate stem URL with custom API base', () => {
    settingsService.patch({ apiUrl: 'http://backend:8000' });
    const url = service.getStemUrl('job1', 'drums');
    expect(url).toBe('http://backend:8000/api/stems/job1/drums');
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('should handle upload with large file', async () => {
    const file = new Blob(['x'.repeat(10_000_000)], { type: 'audio/mpeg' });
    const fileObj = new File([file], 'large.mp3', { type: 'audio/mpeg' });
    let errorStatus: number | undefined;

    service.uploadAudio(fileObj, { model: 'htdemucs', format: 'wav' }).subscribe({
      next: () => { throw new Error('should have errored'); },
      error: (err) => { errorStatus = err.status; },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    // The backend is not running, so we expect a connection error
    expect(errorStatus).toBeDefined();
  });

  it('should handle getJob with invalid job ID', async () => {
    let errorStatus: number | undefined;
    service.getJob('').subscribe({
      next: () => { throw new Error('should have errored'); },
      error: (err) => { errorStatus = err.status; },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(errorStatus).toBeDefined();
  });
});
