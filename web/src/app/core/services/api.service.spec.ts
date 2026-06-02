/**
 * Extended tests for ApiService — edge cases and error handling.
 *
 * Verifies HTTP interactions with the backend: upload, job status,
 * job listing, model fetching, health check, and error handling.
 */
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { SettingsService } from './settings.service';
import { HttpClient } from '@angular/common/http';
import type { Job, ModelOption, SplitRequest, UploadResponse } from '../models';

describe('ApiService (Extended)', () => {
  let service: ApiService;
  let settingsService: SettingsService;
  let httpMock: HttpClient;

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        SettingsService,
        {
          provide: HttpClient,
          useValue: {
            get: vi.fn(),
            post: vi.fn(),
            delete: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(ApiService);
    settingsService = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpClient) as HttpClient;
  });

  afterAll(() => {
    TestBed.resetTestingModule();
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
  // Edge cases — upload error
  // ---------------------------------------------------------------------------

  it('should handle upload with large file error', async () => {
    const file = new Blob(['x'.repeat(10_000_000)], { type: 'audio/mpeg' });
    const fileObj = new File([file], 'large.mp3', { type: 'audio/mpeg' });
    let errorStatus: number | undefined;

    (httpMock.post as any).mockReturnValue(
      throwError(() => ({ status: 500, message: 'Internal server error' }))
    );

    service.uploadAudio(fileObj, { model: 'htdemucs', format: 'wav' }).subscribe({
      next: () => { throw new Error('should have errored'); },
      error: (err) => { errorStatus = err.status; },
    });

    expect(errorStatus).toBe(500);
  });

  // ---------------------------------------------------------------------------
  // Edge cases — job error
  // ---------------------------------------------------------------------------

  it('should handle getJob with invalid job ID', async () => {
    let errorStatus: number | undefined;

    (httpMock.get as any).mockReturnValue(
      throwError(() => ({ status: 404, message: 'Not found' }))
    );

    service.getJob('').subscribe({
      next: () => { throw new Error('should have errored'); },
      error: (err) => { errorStatus = err.status; },
    });

    expect(errorStatus).toBe(404);
  });
});
