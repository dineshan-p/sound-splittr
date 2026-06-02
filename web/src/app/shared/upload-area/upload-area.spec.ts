/**
 * Tests for UploadArea component.
 *
 * Verifies drag-and-drop, file selection, file validation,
 * and event emission for selected files.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { UploadAreaComponent } from './upload-area';
import { NotificationService } from '../../core/services/notification.service';

describe('UploadAreaComponent', () => {
  let fixture: ComponentFixture<UploadAreaComponent>;
  let component: UploadAreaComponent;
  let mockNotifications: any;

  beforeEach(() => {
    const notifObj: any = {
      current: () => null,
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      confirm: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [UploadAreaComponent],
      providers: [{ provide: NotificationService, useValue: notifObj }],
    });

    fixture = TestBed.createComponent(UploadAreaComponent);
    component = fixture.componentInstance;
    mockNotifications = TestBed.inject(NotificationService) as any;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should accept audio files', () => {
      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      const accept = input.nativeElement.accept;
      expect(accept).toContain('.mp3');
      expect(accept).toContain('.wav');
      expect(accept).toContain('.flac');
    });
  });

  describe('file selection', () => {
    it('should emit uploaded when a file is selected via input', () => {
      const testFile = new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' });
      let emittedEvent: { file: File } | null = null;
      component.uploaded.subscribe((evt) => { emittedEvent = evt; });

      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      // Use Object.defineProperty to set a mock FileList that jsdom accepts
      const mockFiles: File[] = [testFile];
      Object.defineProperty(input.nativeElement, 'files', {
        value: Object.assign(mockFiles, { length: mockFiles.length, item: (i: number) => mockFiles[i] ?? null }),
        writable: true,
      });
      input.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
      fixture.detectChanges();

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent!.file.name).toBe('test.mp3');
    });

    it('should not emit for non-audio files', () => {
      let emittedEvent: { file: File } | null = null;
      component.uploaded.subscribe((evt) => { emittedEvent = evt; });

      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      const mockFiles: File[] = [new File(['dummy'], 'image.png', { type: 'image/png' })];
      Object.defineProperty(input.nativeElement, 'files', {
        value: Object.assign(mockFiles, { length: mockFiles.length, item: (i: number) => mockFiles[i] ?? null }),
        writable: true,
      });
      input.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
      fixture.detectChanges();

      expect(emittedEvent).toBeNull();
    });
  });

  describe('drag-and-drop visual feedback', () => {
    it('should add dragging class when a file is dragged over', () => {
      const area = fixture.debugElement.query(By.css('.upload-area'));

      const dragOverEvent = new DragEvent('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'dataTransfer', {
        value: { items: [], types: ['Files'] },
      });
      area.nativeElement.dispatchEvent(dragOverEvent);
      fixture.detectChanges();

      expect(area.nativeElement.classList.contains('dragging')).toBe(true);
    });

    it('should remove dragging class when drag leaves', () => {
      const area = fixture.debugElement.query(By.css('.upload-area'));

      // Enter.
      const dragEnter = new DragEvent('dragenter', { bubbles: true });
      Object.defineProperty(dragEnter, 'dataTransfer', {
        value: { items: [], types: ['Files'] },
      });
      area.nativeElement.dispatchEvent(dragEnter);

      // Leave.
      const dragLeave = new DragEvent('dragleave', { bubbles: true });
      area.nativeElement.dispatchEvent(dragLeave);
      fixture.detectChanges();

      expect(area.nativeElement.classList.contains('dragging')).toBe(false);
    });

    it('should prevent default on dragover', () => {
      const area = fixture.debugElement.query(By.css('.upload-area'));
      let defaultPrevented = false;

      const dragOver = new DragEvent('dragover', { bubbles: true });
      Object.defineProperty(dragOver, 'dataTransfer', {
        value: { items: [], types: ['Files'] },
      });
      dragOver.preventDefault = () => { defaultPrevented = true; };
      area.nativeElement.dispatchEvent(dragOver);

      expect(defaultPrevented).toBe(true);
    });
  });

  describe('drop event prevention', () => {
    it('should prevent default on drop to avoid browser opening the file', () => {
      let defaultPrevented = false;
      const drop = new DragEvent('drop', { bubbles: true });
      drop.preventDefault = () => { defaultPrevented = true; };

      const area = fixture.debugElement.query(By.css('.upload-area'));
      area.nativeElement.dispatchEvent(drop);

      expect(defaultPrevented).toBe(true);
    });
  });
});
