/**
 * Tests for StemListComponent.
 *
 * Verifies stem list rendering, total size calculation, and download events.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StemListComponent } from './stem-list';
import type { StemInfo } from '../../core/models';

describe('StemListComponent', () => {
  let component: StemListComponent;
  let fixture: ComponentFixture<StemListComponent>;

  const mockStems: StemInfo[] = [
    { name: 'vocals', displayName: 'Vocals', path: '/vocals.mp3', sizeBytes: 5_000_000 },
    { name: 'drums', displayName: 'Drums', path: '/drums.mp3', sizeBytes: 4_000_000 },
    { name: 'bass', displayName: 'Bass', path: '/bass.mp3', sizeBytes: 3_000_000 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StemListComponent],
    });

    fixture = TestBed.createComponent(StemListComponent);
    component = fixture.componentInstance;
    // Set required inputs BEFORE detectChanges
    fixture.componentRef.setInput('stems', mockStems);
    fixture.componentRef.setInput('downloadBaseUrl', 'http://localhost:8000/api/stems/job1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert stems to player format', () => {
    const playerStems = component.playerStems;
    expect(playerStems.length).toBe(3);
    expect(playerStems[0].name).toBe('vocals');
    expect(playerStems[0].src).toBe('http://localhost:8000/api/stems/job1/vocals');
  });

  it('should calculate total size', () => {
    // 12,000,000 bytes = 11.4 MB (12_000_000 / 1_048_576)
    expect(component.totalSize).toBe('11.4 MB');
  });

  it('should format small sizes in bytes', () => {
    fixture.componentRef.setInput('stems', [{ name: 'test', displayName: 'Test', path: '/test.mp3', sizeBytes: 500 }]);
    fixture.detectChanges();
    expect(component.totalSize).toBe('500 B');
  });

  it('should format medium sizes in KB', () => {
    // 1500 bytes = 1.46 KB → "1 KB"
    fixture.componentRef.setInput('stems', [{ name: 'test', displayName: 'Test', path: '/test.mp3', sizeBytes: 1500 }]);
    fixture.detectChanges();
    expect(component.totalSize).toBe('1 KB');
  });

  it('should emit stemDownloaded on stem download', () => {
    let emittedName: string | null = null;
    component.stemDownloaded.subscribe((name) => { emittedName = name; });
    component.onStemDownload('vocals');
    expect(emittedName).toBe('vocals');
  });

  it('should emit downloadAll', () => {
    let emitted = false;
    component.downloadAll.subscribe(() => { emitted = true; });
    component.onDownloadAll();
    expect(emitted).toBe(true);
  });
});
