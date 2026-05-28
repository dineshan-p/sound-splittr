/**
 * Tests for ProcessingStatus component.
 *
 * Verifies state display, progress bar, message formatting,
 * and time estimation.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProcessingStatus } from './processing-status';
import { JobStatus } from '../../models';

describe('ProcessingStatus', () => {
  let fixture: ComponentFixture<ProcessingStatus>;
  let component: ProcessingStatus;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessingStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessingStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show no job message when job is null', () => {
      component.job = null;
      fixture.detectChanges();
      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('No active job');
    });
  });

  describe('idle state', () => {
    it('should show idle state message', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.IDLE,
        progress: 0,
        stems: [],
      };
      fixture.detectChanges();
      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('Idle');
    });
  });

  describe('queued state', () => {
    it('should show queued state message', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.QUEUED,
        progress: 0,
        stems: [],
      };
      fixture.detectChanges();
      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('Queued');
    });
  });

  describe('processing state', () => {
    it('should show processing state with progress', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 45,
        stems: [],
      };
      fixture.detectChanges();

      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('Processing');

      const progressBar = fixture.debugElement.query(By.css('.progress-bar'));
      expect(progressBar).toBeTruthy();
    });

    it('should show progress percentage', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 72,
        stems: [],
      };
      fixture.detectChanges();
      const progressBar = fixture.debugElement.query(By.css('.progress-bar'));
      const style = progressBar.nativeElement.style;
      expect(style.width).toBe('72%');
    });

    it('should show progress at 0%', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 0,
        stems: [],
      };
      fixture.detectChanges();
      const progressBar = fixture.debugElement.query(By.css('.progress-bar'));
      const style = progressBar.nativeElement.style;
      expect(style.width).toBe('0%');
    });

    it('should show progress at 100%', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 100,
        stems: [],
      };
      fixture.detectChanges();
      const progressBar = fixture.debugElement.query(By.css('.progress-bar'));
      const style = progressBar.nativeElement.style;
      expect(style.width).toBe('100%');
    });
  });

  describe('completed state', () => {
    it('should show completed state message', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.COMPLETED,
        progress: 100,
        stems: [{ name: 'vocals', url: '/stems/job-1/vocals.wav' }],
      };
      fixture.detectChanges();
      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('Completed');
    });

    it('should show number of stems when completed', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.COMPLETED,
        progress: 100,
        stems: [
          { name: 'vocals', url: '/stems/job-1/vocals.wav' },
          { name: 'drums', url: '/stems/job-1/drums.wav' },
          { name: 'bass', url: '/stems/job-1/bass.wav' },
          { name: 'melody', url: '/stems/job-1/melody.wav' },
        ],
      };
      fixture.detectChanges();
      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('4 stems');
    });
  });

  describe('failed state', () => {
    it('should show failed state message', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.FAILED,
        progress: 30,
        error: 'CUDA out of memory',
        stems: [],
      };
      fixture.detectChanges();
      const statusEl = fixture.debugElement.query(By.css('.status-message'));
      expect(statusEl.nativeElement.textContent).toContain('Failed');
    });

    it('should show error message when available', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.FAILED,
        progress: 30,
        error: 'CUDA out of memory',
        stems: [],
      };
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(By.css('.error-message'));
      expect(errorEl.nativeElement.textContent).toContain('CUDA out of memory');
    });

    it('should not show error message when no error', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.FAILED,
        progress: 30,
        stems: [],
      };
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(By.css('.error-message'));
      expect(errorEl).toBeNull();
    });
  });

  describe('cancel button', () => {
    it('should emit cancelled when cancel button is clicked', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.PROCESSING,
        progress: 50,
        stems: [],
      };
      fixture.detectChanges();

      let cancelled = false;
      component.cancelled.subscribe(() => { cancelled = true; });

      const button = fixture.debugElement.query(By.css('button.cancel-btn'));
      button.nativeElement.click();
      expect(cancelled).toBe(true);
    });

    it('should not show cancel button for non-processing jobs', () => {
      component.job = {
        id: 'job-1',
        state: JobStatus.COMPLETED,
        progress: 100,
        stems: [],
      };
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('button.cancel-btn'));
      expect(button).toBeNull();
    });
  });
});
