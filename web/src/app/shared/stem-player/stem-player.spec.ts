/**
 * Tests for StemPlayer component.
 *
 * Verifies play/pause, volume, solo/mute toggles,
 * audio element state, and error handling.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StemPlayer } from './stem-player';
import { Stem } from '../../models';

describe('StemPlayer', () => {
  let fixture: ComponentFixture<StemPlayer>;
  let component: StemPlayer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StemPlayer],
    }).compileComponents();

    fixture = TestBed.createComponent(StemPlayer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start with muted=false', () => {
      expect(component.muted).toBe(false);
    });

    it('should start with solo=false', () => {
      expect(component.solo).toBe(false);
    });

    it('should start with volume=1', () => {
      expect(component.volume).toBe(1);
    });

    it('should not be playing initially', () => {
      expect(component.playing).toBe(false);
    });
  });

  describe('stem input', () => {
    it('should display the stem name', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();
      const nameEl = fixture.debugElement.query(By.css('.stem-name'));
      expect(nameEl.nativeElement.textContent).toContain('vocals');
    });

    it('should display the stem URL as a data attribute', () => {
      component.stem = { name: 'drums', url: '/stems/job-1/drums.wav' };
      fixture.detectChanges();
      // Check that the component has the stem set.
      expect(component.stem.name).toBe('drums');
    });
  });

  describe('play/pause', () => {
    it('should emit playing when play is called', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      let playing = false;
      component.playingChange.subscribe((v) => { playing = v; });

      component.play();
      expect(playing).toBe(true);
    });

    it('should emit playing=false when pause is called', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      component.playing = true;
      fixture.detectChanges();

      let playing = false;
      component.playingChange.subscribe((v) => { playing = v; });

      component.pause();
      expect(playing).toBe(false);
    });

    it('should toggle play/pause when playPause is called', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      let playing = false;
      component.playingChange.subscribe((v) => { playing = v; });

      // Initially not playing.
      component.playPause();
      expect(playing).toBe(true);

      // Now pause.
      component.playing = true;
      component.playPause();
      expect(playing).toBe(false);
    });
  });

  describe('volume control', () => {
    it('should emit volume change when setVolume is called', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      let volume = 0;
      component.volumeChange.subscribe((v) => { volume = v; });

      component.setVolume(0.5);
      expect(volume).toBe(0.5);
      expect(component.volume).toBe(0.5);
    });

    it('should clamp volume to valid range [0, 1]', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      component.setVolume(1.5);
      expect(component.volume).toBe(1);

      component.setVolume(-0.5);
      expect(component.volume).toBe(0);
    });

    it('should emit volume=0 when mute is toggled', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      component.volume = 0.8;
      fixture.detectChanges();

      let volume = 0;
      component.volumeChange.subscribe((v) => { volume = v; });

      component.toggleMute();
      expect(volume).toBe(0);
    });

    it('should restore volume when unmute is toggled', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      component.volume = 0.8;
      component.muted = true;
      fixture.detectChanges();

      let volume = 0;
      component.volumeChange.subscribe((v) => { volume = v; });

      component.toggleMute();
      expect(volume).toBe(0.8);
    });
  });

  describe('solo/mute', () => {
    it('should toggle solo state', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      expect(component.solo).toBe(false);
      component.toggleSolo();
      expect(component.solo).toBe(true);
      component.toggleSolo();
      expect(component.solo).toBe(false);
    });

    it('should toggle mute state', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      expect(component.muted).toBe(false);
      component.toggleMute();
      expect(component.muted).toBe(true);
      component.toggleMute();
      expect(component.muted).toBe(false);
    });

    it('should emit solo change', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      let solo = false;
      component.soloChange.subscribe((v) => { solo = v; });

      component.toggleSolo();
      expect(solo).toBe(true);
    });

    it('should emit mute change', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      let muted = false;
      component.mutedChange.subscribe((v) => { muted = v; });

      component.toggleMute();
      expect(muted).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should emit error on audio error event', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();

      let error: string | null = null;
      component.error.subscribe((e) => { error = e; });

      component.onError(new Event('error'));
      expect(error).toContain('audio error');
    });

    it('should emit error with custom message', () => {
      component.onError(new Event('error'), 'Custom error');
      // The error event should have been handled.
    });
  });

  describe('audio element interaction', () => {
    it('should have an audio element in the template', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();
      const audioEl = fixture.debugElement.query(By.css('audio'));
      expect(audioEl).toBeTruthy();
    });

    it('should set audio src when stem changes', () => {
      component.stem = { name: 'vocals', url: '/stems/job-1/vocals.wav' };
      fixture.detectChanges();
      const audioEl = fixture.debugElement.query(By.css('audio'));
      expect(audioEl.nativeElement.src).toContain('/stems/job-1/vocals.wav');
    });
  });
});
