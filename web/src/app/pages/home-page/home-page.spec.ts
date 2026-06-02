/**
 * Tests for HomePage component.
 *
 * Verifies API health check, upload flow, job polling, stem display,
 * and utility methods.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, ReplaySubject } from 'rxjs';
import { vi } from 'vitest';

import { HomePage } from './home-page';
import { ApiService } from '../../core/services/api.service';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';
import type { Job, UploadResponse } from '../../core/models';

describe('HomePage', () => {
  let component: HomePage;
  let mockApi: Partial<ApiService>;
  let mockSettings: SettingsService;
  let mockNotifications: NotificationService;

  // Keep direct references to the ReplaySubjects so tests can emit values
  // without relying on mock internals.
  let getJob$: ReplaySubject<Job>;
  let ping$: ReplaySubject<any>;

  beforeEach(() => {
    getJob$ = new ReplaySubject<Job>(1);
    ping$ = new ReplaySubject<any>(1);

    mockApi = {
      uploadAudio: vi.fn(),
      getJob: vi.fn().mockReturnValue(getJob$),
      listJobs: vi.fn(),
      deleteJob: vi.fn(),
      getStemUrl: vi.fn(),
      fetchModels: vi.fn(),
      ping: vi.fn().mockReturnValue(ping$),
      // apiUrl is a getter on the real ApiService that reads from SettingsService.
      // We override it here so the template's `.replace()` call never sees undefined.
      get apiUrl() { return 'http://localhost:8000'; },
    };

    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApi },
        { provide: SettingsService, useValue: {
          current: vi.fn(() => ({ apiUrl: 'http://localhost:8000', defaultModel: 'htdemucs', defaultFormat: 'mp3', defaultBitrate: 320 })),
          model: 'htdemucs',
          format: 'mp3',
          bitrate: 320,
          patch: vi.fn(),
          reset: vi.fn(),
        }},
        { provide: NotificationService, useValue: {
          current: vi.fn(() => null),
          show: vi.fn(),
          success: vi.fn(),
          error: vi.fn(),
          warning: vi.fn(),
          info: vi.fn(),
          confirm: vi.fn(),
          clear: vi.fn(),
        }},
      ],
    });

    component = TestBed.createComponent(HomePage).componentInstance;
    mockSettings = TestBed.inject(SettingsService) as SettingsService;
    mockNotifications = TestBed.inject(NotificationService) as NotificationService;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set apiAvailable based on ping result', async () => {
      component.ngOnInit();
      ping$.next({ status: 'ok', queue_size: 0, active_count: 0, total_jobs: 0, gpu: null });
      ping$.complete();
      await new Promise(r => setTimeout(r, 50));
      expect(component.apiAvailable).toBe(true);
      expect(component.apiChecked).toBe(true);
    });

    it('should set apiAvailable to false when ping fails', async () => {
      component.ngOnInit();
      ping$.error(new Error('Not found'));
      ping$.complete();
      await new Promise(r => setTimeout(r, 50));
      expect(component.apiAvailable).toBe(false);
    });
  });

  describe('upload flow', () => {
    it('should emit upload event with correct request', () => {
      const testFile = new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' });
      mockApi.uploadAudio = vi.fn().mockReturnValue(of({ jobId: 'job-123', message: 'Queued' } as UploadResponse));

      component.onUpload({ file: testFile });
      expect(mockApi.uploadAudio).toHaveBeenCalledWith(testFile, expect.objectContaining({
        model: 'htdemucs',
        format: 'mp3',
        bitrate: 320,
      }));
    });

    it('should set activeJob when upload starts', () => {
      const testFile = new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' });
      mockApi.uploadAudio = vi.fn().mockReturnValue(of({ jobId: 'job-123', message: 'Queued' } as UploadResponse));

      component.onUpload({ file: testFile });
      expect(component.activeJob).not.toBeNull();
      expect(component.activeJob!.fileName).toBe('test.mp3');
      expect(component.activeJob!.status).toBe('queued');
    });

    it('should clear completedStems on new upload', () => {
      component.completedStems = [{ name: 'vocals', displayName: 'Vocals', path: '/vocals.mp3', sizeBytes: 1000 }];
      const testFile = new File(['dummy'], 'test2.mp3', { type: 'audio/mpeg' });
      mockApi.uploadAudio = vi.fn().mockReturnValue(of({ jobId: 'job-456', message: 'Queued' } as UploadResponse));

      component.onUpload({ file: testFile });
      expect(component.completedStems).toEqual([]);
    });
  });

  describe('job polling', () => {
    it('should poll job status after upload', async () => {
      mockApi.uploadAudio = vi.fn().mockReturnValue(of({ jobId: 'job-123', message: 'Queued' } as UploadResponse));

      getJob$.next({
        id: 'job-123', fileName: 'test.mp3', fileSize: 1000, durationSeconds: null,
        status: 'processing', progress: 50, modelUsed: 'htdemucs', stems: [],
        createdAt: new Date().toISOString(),
      } as Job);

      component.onUpload({ file: new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' }) });
      await new Promise(r => setTimeout(r, 50));
      expect(mockApi.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should handle failed job', async () => {
      mockApi.uploadAudio = vi.fn().mockReturnValue(of({ jobId: 'job-123', message: 'Queued' } as UploadResponse));

      getJob$.next({
        id: 'job-123', fileName: 'test.mp3', fileSize: 1000, durationSeconds: null,
        status: 'failed', progress: 0, modelUsed: 'htdemucs', stems: [],
        error: 'GPU out of memory', createdAt: new Date().toISOString(),
      } as Job);

      component.onUpload({ file: new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' }) });
      await new Promise(r => setTimeout(r, 50));
      expect(component.activeJob!.status).toBe('failed');
    });
  });

  describe('completion handling', () => {
    it('should populate completedStems on completion', async () => {
      mockApi.uploadAudio = vi.fn().mockReturnValue(of({ jobId: 'job-123', message: 'Queued' } as UploadResponse));

      getJob$.next({
        id: 'job-123', fileName: 'test.mp3', fileSize: 1000, durationSeconds: null,
        status: 'completed', progress: 100, modelUsed: 'htdemucs',
        stems: [
          { name: 'vocals', displayName: 'Vocals', path: '/vocals.mp3', sizeBytes: 5000 },
          { name: 'drums', displayName: 'Drums', path: '/drums.mp3', sizeBytes: 4000 },
        ],
        createdAt: new Date().toISOString(),
      } as Job);

      component.onUpload({ file: new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' }) });
      await new Promise(r => setTimeout(r, 50));
      expect(component.completedStems.length).toBe(2);
      expect(component.completedStems[0].name).toBe('vocals');
    });
  });

  describe('utility methods', () => {
    it('should format sizes correctly', () => {
      expect(component.formatSize(500)).toBe('500 B');
      expect(component.formatSize(1500)).toBe('1 KB');
      expect(component.formatSize(1_572_864)).toBe('1.5 MB');
    });

    it('should return model label', () => {
      expect(component.getModelLabel()).toBe('HTDemucs');
    });

    it('should set model name', () => {
      component.setModelName('mdx');
      expect(component.modelName).toBe('mdx');
    });

    it('should set output format', () => {
      component.setOutputFormat('wav');
      expect(component.outputFormat).toBe('wav');
    });

    it('should return isProcessing based on activeJob status', () => {
      component.activeJob = { jobId: '1', fileName: 'test.mp3', status: 'processing', progress: 50 };
      expect(component.isProcessing()).toBe(true);

      component.activeJob = { jobId: '1', fileName: 'test.mp3', status: 'completed', progress: 100 };
      expect(component.isProcessing()).toBe(false);
    });

    it('should open download URL for stem', () => {
      component.activeJob = { jobId: 'job-123', fileName: 'test.mp3', status: 'completed', progress: 100 };
      mockApi.getStemUrl = vi.fn().mockReturnValue('/api/stems/job-123/vocals');
      vi.spyOn(window, 'open').mockImplementation(() => null);
      component.onStemDownload('vocals');
      expect(window.open).toHaveBeenCalledWith('/api/stems/job-123/vocals', '_blank');
    });
  });
});
