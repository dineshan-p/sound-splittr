/**
 * Extended tests for ApiService — edge cases and error handling.
 *
 * Verifies HTTP interactions with the backend: upload, job status,
 * stems listing, model listing, health check, and error handling.
 */
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';

describe('ApiService (Extended)', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // Upload edge cases
  // ---------------------------------------------------------------------------

  it('should handle upload timeout', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.mp3');

    const timeoutPromise = firstValueFrom(service.upload(formData, 'htdemucs', 'wav', 320));
    httpMock.expectOne('/api/upload').flush(null, { status: 504, statusText: 'Gateway Timeout' });

    await expectAsync(timeoutPromise).toBeRejected();
  });

  it('should handle upload server error', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.mp3');

    const errorPromise = firstValueFrom(service.upload(formData, 'htdemucs', 'wav', 320));
    httpMock.expectOne('/api/upload').flush(
      { error: 'Internal server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    await expectAsync(errorPromise).toBeRejected();
  });

  it('should handle upload rate limit', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.mp3');

    const errorPromise = firstValueFrom(service.upload(formData, 'htdemucs', 'wav', 320));
    httpMock.expectOne('/api/upload').flush(
      { error: 'Rate limit exceeded' },
      { status: 429, statusText: 'Too Many Requests' }
    );

    await expectAsync(errorPromise).toBeRejected();
  });

  // ---------------------------------------------------------------------------
  // Job status edge cases
  // ---------------------------------------------------------------------------

  it('should handle job not found', async () => {
    const errorPromise = firstValueFrom(service.getJobStatus('nonexistent'));
    httpMock.expectOne('/api/jobs/nonexistent').flush(
      { error: 'Job not found' },
      { status: 404, statusText: 'Not Found' }
    );

    await expectAsync(errorPromise).toBeRejected();
  });

  it('should handle empty job list', async () => {
    const jobs$ = service.getJobs();
    httpMock.expectOne('/api/jobs').flush([]);

    const jobs = await firstValueFrom(jobs$);
    expect(jobs).toEqual([]);
  });

  it('should handle job list with errors', async () => {
    const jobs$ = service.getJobs();
    httpMock.expectOne('/api/jobs').flush([
      { id: '1', status: 'error', errorMessage: 'Processing failed' },
    ]);

    const jobs = await firstValueFrom(jobs$);
    expect(jobs.length).toBe(1);
    expect(jobs[0].status).toBe('error');
  });

  // ---------------------------------------------------------------------------
  // Stem download edge cases
  // ---------------------------------------------------------------------------

  it('should handle stem download not found', async () => {
    const errorPromise = firstValueFrom(service.downloadStem('job1', 'vocals'));
    httpMock.expectOne('/api/jobs/job1/stems/vocals').flush(
      { error: 'Stem not found' },
      { status: 404, statusText: 'Not Found' }
    );

    await expectAsync(errorPromise).toBeRejected();
  });

  it('should handle stem download partial content', async () => {
    const download$ = service.downloadStem('job1', 'vocals');
    httpMock.expectOne('/api/jobs/job1/stems/vocals').flush(
      new Blob(['partial data']),
      { status: 206, statusText: 'Partial Content' }
    );

    const blob = await firstValueFrom(download$);
    expect(blob).toBeInstanceOf(Blob);
  });

  // ---------------------------------------------------------------------------
  // Models endpoint edge cases
  // ---------------------------------------------------------------------------

  it('should handle models endpoint timeout', async () => {
    const timeoutPromise = firstValueFrom(service.getModels());
    httpMock.expectOne('/api/models').flush(null, { status: 504, statusText: 'Gateway Timeout' });

    await expectAsync(timeoutPromise).toBeRejected();
  });

  it('should handle models endpoint empty response', async () => {
    const models$ = service.getModels();
    httpMock.expectOne('/api/models').flush([]);

    const models = await firstValueFrom(models$);
    expect(models).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Health check edge cases
  // ---------------------------------------------------------------------------

  it('should handle health check failure', async () => {
    const errorPromise = firstValueFrom(service.checkHealth());
    httpMock.expectOne('/api/health').flush(
      { status: 'error', message: 'Service unavailable' },
      { status: 503, statusText: 'Service Unavailable' }
    );

    await expectAsync(errorPromise).toBeRejected();
  });

  it('should handle health check with queue stats', async () => {
    const health$ = service.checkHealth();
    httpMock.expectOne('/api/health').flush({
      status: 'ok',
      queue_size: 3,
      active_count: 1,
      total_jobs: 10,
      gpu: { free_gb: 2.5, total_gb: 8.0 },
    });

    const health = await firstValueFrom(health$);
    expect(health.status).toBe('ok');
    expect(health.queue_size).toBe(3);
    expect(health.active_count).toBe(1);
    expect(health.total_jobs).toBe(10);
    expect(health.gpu.free_gb).toBe(2.5);
  });

  // ---------------------------------------------------------------------------
  // Job deletion edge cases
  // ---------------------------------------------------------------------------

  it('should handle job deletion not found', async () => {
    const errorPromise = firstValueFrom(service.deleteJob('nonexistent'));
    httpMock.expectOne('/api/jobs/nonexistent').flush(
      { error: 'Job not found' },
      { status: 404, statusText: 'Not Found' }
    );

    await expectAsync(errorPromise).toBeRejected();
  });

  it('should handle job deletion success', async () => {
    const delete$ = service.deleteJob('job1');
    httpMock.expectOne('/api/jobs/job1').flush({ success: true });

    const result = await firstValueFrom(delete$);
    expect(result.success).toBe(true);
  });
});
