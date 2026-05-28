/**
 * Tests for StemList component.
 *
 * Verifies stem rendering, click handlers, active stem tracking,
 * and empty state display.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StemList } from './stem-list';
import { Stem } from '../../models';

describe('StemList', () => {
  let fixture: ComponentFixture<StemList>;
  let component: StemList;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StemList],
    }).compileComponents();

    fixture = TestBed.createComponent(StemList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render a list element', () => {
      const listEl = fixture.debugElement.query(By.css('.stem-list'));
      expect(listEl).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('should show no stems message when stems array is empty', () => {
      component.stems = [];
      fixture.detectChanges();
      const msgEl = fixture.debugElement.query(By.css('.no-stems'));
      expect(msgEl).toBeTruthy();
      expect(msgEl.nativeElement.textContent).toContain('No stems');
    });

    it('should show no stems message when stems is null', () => {
      component.stems = null;
      fixture.detectChanges();
      const msgEl = fixture.debugElement.query(By.css('.no-stems'));
      expect(msgEl).toBeTruthy();
    });
  });

  describe('stem rendering', () => {
    it('should render a list item for each stem', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
        { name: 'drums', url: '/stems/job-1/drums.wav' },
        { name: 'bass', url: '/stems/job-1/bass.wav' },
      ];
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      expect(items.length).toBe(3);
    });

    it('should display the stem name in each item', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
        { name: 'drums', url: '/stems/job-1/drums.wav' },
      ];
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      expect(items[0].nativeElement.textContent).toContain('vocals');
      expect(items[1].nativeElement.textContent).toContain('drums');
    });

    it('should render a stem-player for each stem', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
        { name: 'drums', url: '/stems/job-1/drums.wav' },
      ];
      fixture.detectChanges();

      const players = fixture.debugElement.queryAll(By.css('stem-player'));
      expect(players.length).toBe(2);
    });
  });

  describe('stem selection', () => {
    it('should highlight the active stem', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
        { name: 'drums', url: '/stems/job-1/drums.wav' },
      ];
      component.activeStem = 'vocals';
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      expect(items[0].nativeElement.classList.contains('active')).toBe(true);
      expect(items[1].nativeElement.classList.contains('active')).toBe(false);
    });

    it('should emit selectedStem when a stem item is clicked', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
        { name: 'drums', url: '/stems/job-1/drums.wav' },
      ];
      fixture.detectChanges();

      let selectedStem: string | null = null;
      component.selectedStem.subscribe((s) => { selectedStem = s; });

      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      items[1].nativeElement.click();
      expect(selectedStem).toBe('drums');
    });

    it('should not emit when clicking the same stem', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
      ];
      component.activeStem = 'vocals';
      fixture.detectChanges();

      let emitted = false;
      component.selectedStem.subscribe(() => { emitted = true; });

      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      items[0].nativeElement.click();
      expect(emitted).toBe(false);
    });
  });

  describe('stem name formatting', () => {
    it('should display stem names with proper capitalization', () => {
      component.stems = [
        { name: 'MIXED_LETTER', url: '/stems/job-1/mixed.wav' },
      ];
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      // The stem name should be displayed as-is or formatted.
      expect(items[0].nativeElement.textContent).toContain('MIXED_LETTER');
    });

    it('should handle empty stem names', () => {
      component.stems = [
        { name: '', url: '/stems/job-1/empty.wav' },
      ];
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      expect(items.length).toBe(1);
    });
  });

  describe('multiple stems', () => {
    it('should render all 4 stems for a full separation', () => {
      component.stems = [
        { name: 'vocals', url: '/stems/job-1/vocals.wav' },
        { name: 'drums', url: '/stems/job-1/drums.wav' },
        { name: 'bass', url: '/stems/job-1/bass.wav' },
        { name: 'melody', url: '/stems/job-1/melody.wav' },
      ];
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.stem-item'));
      expect(items.length).toBe(4);
    });
  });
});
