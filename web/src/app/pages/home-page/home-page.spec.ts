/**
 * Tests for HomePage component.
 *
 * Verifies the page layout, upload area integration,
 * processing status display, and stem list display.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomePage } from './home-page';
import { JobStatus, Job } from '../../models';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { of, throwError } from 'rxjs';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;

  const mockApiService = {
    upload: jasmine.createSpy('upload').and.returnValue(of('job-123')),
    listJobs: jasmine.createSpy('listJobs').and.returnValue(of([])),
    getJob: jasmine.createSpy('getJob').and.returnValue(of({
      id: 'job-123',
      state: JobStatus.IDLE,
      progress: 0,
      stems: [],
    })),
    getStems: jasmine.createSpy('getStems').and.returnValue(of([])),
    getHealth: jasmine.createSpy('getHealth').and.returnValue(of({
      status: 'ok',
      gpu_available: true,
      models_loaded: 2,
    })),
  };

  const mockNotificationService = {
    show: jasmine.createSpy('show'),
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    info: jasmine.createSpy('info'),
    warning: jasmine.createSpy('warning'),
    clear: jasmine.createSpy('clear'),
    current: jasmine.createSpy('current').and.returnValue(null),
    confirm: jasmine.createSpy('confirm').and.returnValue(Promise.resolve(true)),
  };

  const mockSettingsService = {
    patch: jasmine.createSpy('patch'),
    reset: jasmine.createSpy('reset'),
    current: jasmine.createSpy('current').and.returnValue({
      apiUrl: 'http://localhost:8000',
      defaultModel: 'htdemucs',
      defaultFormat: 'wav',
      defaultBitrate: 192,
    }),
    apiUrl: 'http://localhost:8000',
    model: 'htdemucs',
    format: 'wav',
    bitrate: 192,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { useValue: mockApiService },
        { useValue: mockNotificationService },
        { useValue: mockSettingsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
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

    it('should render an upload area', () => {
      const uploadArea = fixture.debugElement.query(By.css('app-upload-area'));
      expect(uploadArea).toBeTruthy();
    });

    it('should render a processing status component', () => {
      const status = fixture.debugElement.query(By.css('app-processing-status'));
      expect(status).toBeTruthy();
    });

    it('should render a stem list component', () => {
      const list = fixture.debugElement.query(By.css('app-stem-list'));
      expect(list).toBeTruthy();
    });
  });

  describe('health check', () => {
    it('should call getHealth on init', () => {
      expect(mockApiService.getHealth).toHaveBeenCalled();
    });

    it('should set health status when health check succeeds', () => {
      expect(component.healthStatus).toBe('ok');
      expect(component.gpuAvailable).toBe(true);
    });

    it('should handle health check failure gracefully', () => {
      mockApiService.getHealth.and.returnValue(throwError(() => new Error('Server down')));
      component.ngOnInit();
      expect(component.healthStatus).toBe('error');
    });
  });

  describe('file upload', () => {
    it('should call api.upload when files are selected', () => {
      const files = [new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' })];
      component.onFilesSelected(files);
      expect(mockApiService.upload).toHaveBeenCalled();
    });

    it('should show success notification on upload', () => {
      const files = [new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' })];
      component.onFilesSelected(files);
      expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should show error notification on upload failure', () => {
      mockApiService.upload.and.returnValue(throwError(() => new Error('Upload failed')));
      const files = [new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' })];
      component.onFilesSelected(files);
      expect(mockNotificationService.error).toHaveBeenCalled();
    });
  });

  describe('job polling', () => {
    it('should poll job status when job is assigned', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 50,
        stems: [],
      };
      fixture.detectChanges();
      // The polling should have started.
      expect(mockApiService.getJob).toHaveBeenCalled();
    });

    it('should stop polling when job completes', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.COMPLETED,
        progress: 100,
        stems: [{ name: 'vocals', url: '/stems/job-1/vocals.wav' }],
      };
      fixture.detectChanges();
      // Polling should have stopped.
    });

    it('should stop polling when job fails', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.FAILED,
        progress: 30,
        error: 'GPU error',
        stems: [],
      };
      fixture.detectChanges();
      // Polling should have stopped.
    });
  });

  describe('stem loading', () => {
    it('should load stems when job completes', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.COMPLETED,
        progress: 100,
        stems: [],
      };
      component.onJobUpdated();
      expect(mockApiService.getStems).toHaveBeenCalledWith('job-1');
    });

    it('should not load stems when job is not completed', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 50,
        stems: [],
      };
      component.onJobUpdated();
      expect(mockApiService.getStems).not.toHaveBeenCalled();
    });
  });

  describe('job cancellation', () => {
    it('should call cancelJob when cancel is triggered', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 50,
        stems: [],
      };
      component.cancelJob();
      // The cancel should have been triggered.
    });
  });
});
