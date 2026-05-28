/**
 * Tests for UploadArea component.
 *
 * Verifies drag-and-drop, file selection, file validation,
 * and event emission for selected files.
 */
import { ComponentRef, fakeAsync, tick, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UploadArea } from './upload-area';
import { ComponentFixture } from '@angular/core';

describe('UploadArea', () => {
  let fixture: ComponentFixture<UploadArea>;
  let component: UploadArea;
  let componentRef: ComponentRef<UploadArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadArea],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadArea);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render a file input element', () => {
      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(input).toBeTruthy();
    });

    it('should accept audio files', () => {
      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(input.nativeElement.accept).toContain('audio/');
    });

    it('should not have any files selected initially', () => {
      expect(component.selectedFiles).toBeNull();
    });
  });

  describe('file selection', () => {
    it('should emit selectedFiles when a file is selected via input', () => {
      const files = [new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' })];
      let emittedFiles: FileList | null = null;
      component.selectedFiles.subscribe((fl) => { emittedFiles = fl; });

      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      // Simulate file input change.
      input.nativeElement.files = {
        length: 1,
        item: (index: number) => files[index],
        namedItem: () => null,
        [Symbol.iterator]: function* () { for (const f of files) yield f; },
      } as unknown as FileList;
      input.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
      fixture.detectChanges();

      expect(emittedFiles).not.toBeNull();
      expect(emittedFiles!.length).toBe(1);
    });

    it('should emit selectedFiles on drag-and-drop', fakeAsync(() => {
      const files = [new File(['dummy'], 'test.wav', { type: 'audio/wav' })];
      let emittedFiles: FileList | null = null;
      component.selectedFiles.subscribe((fl) => { emittedFiles = fl; });

      const dropEvent = new DragEvent('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: files as unknown as FileList,
          items: [],
          types: ['Files'],
        },
      });

      const area = fixture.debugElement.query(By.css('.upload-area'));
      area.nativeElement.dispatchEvent(dropEvent);
      tick();
      fixture.detectChanges();

      expect(emittedFiles).not.toBeNull();
      expect(emittedFiles!.length).toBe(1);
    }));

    it('should emit selectedFiles on drag-and-drop with multiple files', fakeAsync(() => {
      const files = [
        new File(['a'], 'a.mp3', { type: 'audio/mpeg' }),
        new File(['b'], 'b.wav', { type: 'audio/wav' }),
      ];
      let emittedFiles: FileList | null = null;
      component.selectedFiles.subscribe((fl) => { emittedFiles = fl; });

      const dropEvent = new DragEvent('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: files as unknown as FileList,
          items: [],
          types: ['Files'],
        },
      });

      const area = fixture.debugElement.query(By.css('.upload-area'));
      area.nativeElement.dispatchEvent(dropEvent);
      tick();
      fixture.detectChanges();

      expect(emittedFiles).not.toBeNull();
      expect(emittedFiles!.length).toBe(2);
    }));
  });

  describe('drag-and-drop visual feedback', () => {
    it('should add drag-over class when a file is dragged over', fakeAsync(() => {
      const area = fixture.debugElement.query(By.css('.upload-area'));

      const dragOverEvent = new DragEvent('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'dataTransfer', {
        value: {
          items: [],
          types: ['Files'],
        },
      });
      area.nativeElement.dispatchEvent(dragOverEvent);
      tick();
      fixture.detectChanges();

      expect(area.nativeElement.classList.contains('drag-over')).toBe(true);
    }));

    it('should remove drag-over class when drag leaves', fakeAsync(() => {
      const area = fixture.debugElement.query(By.css('.upload-area'));

      // Enter.
      const dragEnter = new DragEvent('dragenter', { bubbles: true });
      Object.defineProperty(dragEnter, 'dataTransfer', {
        value: { items: [], types: ['Files'] },
      });
      area.nativeElement.dispatchEvent(dragEnter);
      tick();

      // Leave.
      const dragLeave = new DragEvent('dragleave', { bubbles: true });
      area.nativeElement.dispatchEvent(dragLeave);
      tick();
      fixture.detectChanges();

      expect(area.nativeElement.classList.contains('drag-over')).toBe(false);
    }));

    it('should prevent default on dragover', fakeAsync(() => {
      const area = fixture.debugElement.query(By.css('.upload-area'));
      let defaultPrevented = false;

      const dragOver = new DragEvent('dragover', { bubbles: true });
      Object.defineProperty(dragOver, 'dataTransfer', {
        value: { items: [], types: ['Files'] },
      });
      dragOver.preventDefault = () => { defaultPrevented = true; };
      area.nativeElement.dispatchEvent(dragOver);
      tick();

      expect(defaultPrevented).toBe(true);
    }));
  });

  describe('drop event prevention', () => {
    it('should prevent default on drop to avoid browser opening the file', fakeAsync(() => {
      let defaultPrevented = false;
      const drop = new DragEvent('drop', { bubbles: true });
      drop.preventDefault = () => { defaultPrevented = true; };

      const area = fixture.debugElement.query(By.css('.upload-area'));
      area.nativeElement.dispatchEvent(drop);
      tick();

      expect(defaultPrevented).toBe(true);
    }));
  });
});
