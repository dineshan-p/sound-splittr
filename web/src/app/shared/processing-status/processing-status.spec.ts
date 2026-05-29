/**
 * Tests for ProcessingStatusComponent.
 *
 * Verifies stage label mapping, status classes, and progress formatting.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessingStatusComponent } from './processing-status';
import type { JobStatus } from '../../core/models';

describe('ProcessingStatusComponent', () => {
  let component: ProcessingStatusComponent;
  let fixture: ComponentFixture<ProcessingStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProcessingStatusComponent],
    });

    fixture = TestBed.createComponent(ProcessingStatusComponent);
    component = fixture.componentInstance;
    // Set required input BEFORE detectChanges
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'processing' as JobStatus,
      progress: 0,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map stage labels', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'processing' as JobStatus,
      progress: 50,
      stage: 'splitting',
    });
    fixture.detectChanges();
    expect(component.stageLabel).toBe('Separating stems...');
  });

  it('should fallback to status when no stage', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'failed' as JobStatus,
      progress: 0,
    });
    fixture.detectChanges();
    // STAGE_LABELS maps "failed" → "Processing failed"
    expect(component.stageLabel).toBe('Processing failed');
  });

  it('should return correct status class for completed', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'completed' as JobStatus,
      progress: 100,
    });
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-complete');
  });

  it('should return correct status class for failed', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'failed' as JobStatus,
      progress: 0,
    });
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-failed');
  });

  it('should return processing class for in-progress', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'processing' as JobStatus,
      progress: 50,
    });
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-processing');
  });

  it('should format integer progress', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'processing' as JobStatus,
      progress: 75,
    });
    fixture.detectChanges();
    expect(component.progressFormatted).toBe('75%');
  });

  it('should format decimal progress', () => {
    fixture.componentRef.setInput('job', {
      jobId: '1',
      fileName: 'test.mp3',
      status: 'processing' as JobStatus,
      progress: 33.3,
    });
    fixture.detectChanges();
    expect(component.progressFormatted).toBe('33.3%');
  });
});
