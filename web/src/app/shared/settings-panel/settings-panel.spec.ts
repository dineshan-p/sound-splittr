/**
 * Tests for SettingsPanel component.
 *
 * Verifies form binding, model/format/bitrate selection,
 * save/reset buttons, and settings emission.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SettingsPanel } from './settings-panel';
import { DEFAULT_SETTINGS } from '../../models';

describe('SettingsPanel', () => {
  let fixture: ComponentFixture<SettingsPanel>;
  let component: SettingsPanel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default settings', () => {
      expect(component.settings.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
      expect(component.settings.defaultModel).toBe(DEFAULT_SETTINGS.defaultModel);
      expect(component.settings.defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
      expect(component.settings.defaultBitrate).toBe(DEFAULT_SETTINGS.defaultBitrate);
    });

    it('should render a form element', () => {
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });
  });

  describe('settings input', () => {
    it('should display the current apiUrl', () => {
      component.settings = {
        ...DEFAULT_SETTINGS,
        apiUrl: 'http://custom:8080',
      };
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input[name="apiUrl"]'));
      expect(input.nativeElement.value).toBe('http://custom:8080');
    });

    it('should display the current model', () => {
      component.settings = {
        ...DEFAULT_SETTINGS,
        defaultModel: 'htdemucs_6s',
      };
      fixture.detectChanges();
      const select = fixture.debugElement.query(By.css('select[name="model"]'));
      expect(select.nativeElement.value).toBe('htdemucs_6s');
    });

    it('should display the current format', () => {
      component.settings = {
        ...DEFAULT_SETTINGS,
        defaultFormat: 'flac',
      };
      fixture.detectChanges();
      const select = fixture.debugElement.query(By.css('select[name="format"]'));
      expect(select.nativeElement.value).toBe('flac');
    });

    it('should display the current bitrate', () => {
      component.settings = {
        ...DEFAULT_SETTINGS,
        defaultBitrate: 256,
      };
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input[name="bitrate"]'));
      expect(input.nativeElement.value).toBe('256');
    });
  });

  describe('save button', () => {
    it('should emit savedSettings when save is clicked', () => {
      component.settings = {
        ...DEFAULT_SETTINGS,
        apiUrl: 'http://test:9000',
        defaultModel: 'mdxdemucs',
        defaultFormat: 'wav',
        defaultBitrate: 192,
      };
      fixture.detectChanges();

      let emitted: typeof DEFAULT_SETTINGS | null = null;
      component.savedSettings.subscribe((s) => { emitted = s; });

      const saveBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
      saveBtn.nativeElement.click();
      fixture.detectChanges();

      expect(emitted).not.toBeNull();
      expect(emitted!.apiUrl).toBe('http://test:9000');
      expect(emitted!.defaultModel).toBe('mdxdemucs');
    });

    it('should emit the settings as they are in the form', () => {
      component.settings = {
        ...DEFAULT_SETTINGS,
        defaultFormat: 'mp3',
      };
      fixture.detectChanges();

      let emittedFormat: string = '';
      component.savedSettings.subscribe((s) => { emittedFormat = s.defaultFormat; });

      const saveBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
      saveBtn.nativeElement.click();
      fixture.detectChanges();

      expect(emittedFormat).toBe('mp3');
    });
  });

  describe('reset button', () => {
    it('should emit reset event', () => {
      let resetEmitted = false;
      component.resetSettings.subscribe(() => { resetEmitted = true; });

      const resetBtn = fixture.debugElement.query(By.css('button.reset-btn'));
      resetBtn.nativeElement.click();
      fixture.detectChanges();

      expect(resetEmitted).toBe(true);
    });
  });

  describe('available models', () => {
    it('should render model options', () => {
      fixture.detectChanges();
      const options = fixture.debugElement.queryAll(By.css('select[name="model"] option'));
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('available formats', () => {
    it('should render format options', () => {
      fixture.detectChanges();
      const options = fixture.debugElement.queryAll(By.css('select[name="format"] option'));
      expect(options.length).toBeGreaterThan(0);
    });
  });
});
