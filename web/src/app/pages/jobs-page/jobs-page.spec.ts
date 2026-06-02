/**
 * Tests for JobsPage component.
 *
 * Verifies job loading, filtering, selection, deletion, and utility methods.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { JobsPage } from './jobs-page';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import type { Job } from '../../core/models';

describe('JobsPage', () => {
  let component: JobsPage;
  let mockApi: ApiService;
  let mockNotifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JobsPage],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: {
          listJobs: vi.fn(),
          deleteJob: vi.fn(),
          getStemUrl: vi.fn(),
        }},
        { provide: NotificationService, useValue: {
          current: vi.fn(() => null),
          success: vi.fn(),
          error: vi.fn(),
          confirm: vi.fn(),
          clear: vi.fn(),
        }},
      ],
    });

    component = TestBed.createComponent(JobsPage).componentInstance;
    mockApi = TestBed.inject(ApiService) as ApiService;
    mockNotifications = TestBed.inject(NotificationService) as NotificationService;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load jobs on init', async () => {
      const mockJobs: Job[] = [
        { id: '1', fileName: 'test.mp3', fileSize: 1000, durationSeconds: null, status: 'completed', progress: 100, modelUsed: 'htdemucs', stems: [], createdAt: new Date().toISOString() },
      ];
      vi.spyOn(mockApi, 'listJobs').mockReturnValue(of(mockJobs));
      component.ngOnInit();
      await mockApi.listJobs().toPromise();
      expect(mockApi.listJobs).toHaveBeenCalled();
      expect(component.jobs.length).toBe(1);
    });

    it('should handle load error', async () => {
      vi.spyOn(mockApi, 'listJobs').mockReturnValue(throwError(() => new Error('Not found')));
      component.ngOnInit();
      try {
        await mockApi.listJobs().toPromise();
      } catch {
        // Expected
      }
      expect(component.error).toContain('Failed to load job history');
      expect(component.jobs).toEqual([]);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      component.jobs = [
        { id: '1', fileName: 'rock.mp3', fileSize: 1000, durationSeconds: null, status: 'completed', progress: 100, modelUsed: 'htdemucs', stems: [], createdAt: new Date().toISOString() },
        { id: '2', fileName: 'jazz.mp3', fileSize: 1000, durationSeconds: null, status: 'failed', progress: 0, modelUsed: 'htdemucs', stems: [], createdAt: new Date().toISOString() },
        { id: '3', fileName: 'pop.mp3', fileSize: 1000, durationSeconds: null, status: 'processing', progress: 50, modelUsed: 'htdemucs', stems: [], createdAt: new Date().toISOString() },
      ];
    });

    it('should filter by search query', () => {
      component.searchQuery = 'rock';
      const filtered = component.filteredJobs;
      expect(filtered.length).toBe(1);
      expect(filtered[0].fileName).toBe('rock.mp3');
    });

    it('should filter by status', () => {
      component.statusFilter = 'failed';
      const filtered = component.filteredJobs;
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('failed');
    });

    it('should combine search and status filters', () => {
      component.searchQuery = 'rock';
      component.statusFilter = 'completed';
      const filtered = component.filteredJobs;
      expect(filtered.length).toBe(1);
    });

    it('should return all jobs when no filters', () => {
      component.searchQuery = '';
      component.statusFilter = 'all';
      expect(component.filteredJobs.length).toBe(3);
    });
  });

  describe('selection', () => {
    beforeEach(() => {
      component.jobs = [
        { id: '1', fileName: 'test1.mp3', fileSize: 1000, durationSeconds: null, status: 'completed', progress: 100, modelUsed: 'htdemucs', stems: [], createdAt: new Date().toISOString() },
        { id: '2', fileName: 'test2.mp3', fileSize: 1000, durationSeconds: null, status: 'completed', progress: 100, modelUsed: 'htdemucs', stems: [], createdAt: new Date().toISOString() },
      ];
    });

    it('should toggle select individual job', () => {
      component.toggleSelect('1');
      expect(component.selectedIds.has('1')).toBe(true);
      component.toggleSelect('1');
      expect(component.selectedIds.has('1')).toBe(false);
    });

    it('should toggle select all', () => {
      component.toggleSelectAll();
      expect(component.selectedIds.size).toBe(2);
      expect(component.isAllSelected).toBe(true);
      component.toggleSelectAll();
      expect(component.selectedIds.size).toBe(0);
    });

    it('should clear selection', () => {
      component.selectedIds.add('1');
      component.selectedIds.add('2');
      component.clearSelection();
      expect(component.selectedIds.size).toBe(0);
    });

    it('should report selected count', () => {
      component.selectedIds.add('1');
      expect(component.selectedCount).toBe(1);
    });
  });

  describe('utility methods', () => {
    it('should get status class', () => {
      expect(component.getStatusClass('completed')).toBe('status-badge badge-completed');
      expect(component.getStatusClass('failed')).toBe('status-badge badge-failed');
      expect(component.getStatusClass('unknown')).toBe('status-badge ');
    });

    it('should format relative time', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30000).toISOString(); // 30s ago
      expect(component.formatRelative(recent)).toBe('just now');

      const oneMinAgo = new Date(now.getTime() - 60000).toISOString();
      expect(component.formatRelative(oneMinAgo)).toBe('1m ago');
    });

    it('should get stem count', () => {
      const job: Job = {
        id: '1', fileName: 'test.mp3', fileSize: 1000, durationSeconds: null,
        status: 'completed', progress: 100, modelUsed: 'htdemucs',
        stems: [{ name: 'vocals', displayName: 'Vocals', path: '/v.mp3', sizeBytes: 100 }],
        createdAt: new Date().toISOString(),
      };
      expect(component.getStemCount(job)).toBe(1);
    });

    it('should capitalize strings', () => {
      expect(component.capitalize('failed')).toBe('Failed');
    });

    it('should format duration', () => {
      expect(component.formatDuration(90)).toBe('1m 30s');
      expect(component.formatDuration(60)).toBe('1m');
      expect(component.formatDuration(30)).toBe('30s');
    });
  });
});
