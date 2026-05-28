/**
 * Tests for JobsPage component.
 *
 * Verifies job list rendering, state badges,
 * stem download, and job selection.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { JobsPage } from './jobs-page';
import { JobStatus, Job, Stem } from '../../models';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { of, throwError } from 'rxjs';

describe('JobsPage', () => {
  let fixture: ComponentFixture<JobsPage>;
  let component: JobsPage;

  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'listJobs', 'getJob', 'getStems', 'getStemUrl',
      'downloadStem', 'getHealth', 'upload',
    ]);
    mockApiService.listJobs.and.returnValue(of([]));
    mockApiService.getHealth.and.returnValue(of({
      status: 'ok', gpu_available: true, models_loaded: 2,
    }));

    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'show', 'success', 'error', 'info', 'warning', 'clear',
    ]);
    mockNotificationService.current.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [JobsPage],
      providers: [
        { useValue: mockApiService },
        { useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have a page-title element', () => {
      const title = fixture.debugElement.query(By.css('.page-title'));
      expect(title).toBeTruthy();
    });

    it('should render a job list', () => {
      const list = fixture.debugElement.query(By.css('.job-list'));
      expect(list).toBeTruthy();
    });
  });

  describe('job list rendering', () => {
    it('should show no jobs message when list is empty', () => {
      mockApiService.listJobs.and.returnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      const msg = fixture.debugElement.query(By.css('.no-jobs'));
      expect(msg).toBeTruthy();
    });

    it('should render a job item for each job', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.COMPLETED, progress: 100, stems: [] },
        { id: 'job-2', state: JobStatus.PROCESSING, progress: 50, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.job-item'));
      expect(items.length).toBe(2);
    });

    it('should display the job ID', () => {
      const mockJobs: Job[] = [
        { id: 'abc-123', state: JobStatus.IDLE, progress: 0, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.job-item'));
      expect(items[0].nativeElement.textContent).toContain('abc-123');
    });
  });

  describe('state badges', () => {
    it('should show completed badge', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.COMPLETED, progress: 100, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
      expect(badges[0].nativeElement.textContent.trim()).toContain('Completed');
    });

    it('should show processing badge', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.PROCESSING, progress: 50, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
      expect(badges[0].nativeElement.textContent.trim()).toContain('Processing');
    });

    it('should show failed badge', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.FAILED, progress: 30, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
      expect(badges[0].nativeElement.textContent.trim()).toContain('Failed');
    });

    it('should show queued badge', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.QUEUED, progress: 0, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
      expect(badges[0].nativeElement.textContent.trim()).toContain('Queued');
    });

    it('should show idle badge', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.IDLE, progress: 0, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
      expect(badges[0].nativeElement.textContent.trim()).toContain('Idle');
    });
  });

  describe('job selection', () => {
    it('should set selectedJob when selectJob is called', () => {
      const mockJob: Job = {
        id: 'job-1',
        state: JobStatus.COMPLETED,
        progress: 100,
        stems: [{ name: 'vocals', url: '/stems/job-1/vocals.wav' }],
      };
      component.selectJob(mockJob);
      expect(component.selectedJob).toBe(mockJob);
    });
  });

  describe('refresh', () => {
    it('should refresh the job list', () => {
      const mockJobs: Job[] = [
        { id: 'job-1', state: JobStatus.COMPLETED, progress: 100, stems: [] },
      ];
      mockApiService.listJobs.and.returnValue(of(mockJobs));
      component.ngOnInit();
      fixture.detectChanges();

      mockApiService.listJobs.calls.reset();
      mockApiService.listJobs.and.returnValue(of([
        { id: 'job-2', state: JobStatus.IDLE, progress: 0, stems: [] },
      ]));

      component.refreshJobs();
      expect(mockApiService.listJobs).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle listJobs failure', () => {
      mockApiService.listJobs.and.returnValue(throwError(() => new Error('API error')));
      component.ngOnInit();
      expect(mockNotificationService.error).toHaveBeenCalled();
    });
  });

  describe('stem download', () => {
    it('should download a stem when downloadStem is called', () => {
      const mockStem: Stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      const mockBlob = new Blob(['stem data'], { type: 'audio/wav' });
      mockApiService.downloadStem.and.returnValue(of({ blob: mockBlob, filename: 'vocals.wav' }));

      component.downloadStem(mockStem);
      expect(mockApiService.downloadStem).toHaveBeenCalledWith('job-1', 'vocals');
    });
  });
});
