/**
 * Tests for SettingsService.
 *
 * Verifies localStorage persistence, migration of old keys, defaults,
 * patching, and reset functionality.
 */
import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { DEFAULT_SETTINGS } from '../models';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    // Clear localStorage before each test.
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should return defaults when no localStorage data exists', () => {
      const settings = service.current();
      expect(settings.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
      expect(settings.defaultModel).toBe(DEFAULT_SETTINGS.defaultModel);
      expect(settings.defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
      expect(settings.defaultBitrate).toBe(DEFAULT_SETTINGS.defaultBitrate);
    });

    it('should load settings from localStorage', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        apiUrl: 'http://custom:9000',
        defaultModel: 'mdxdemucs',
        defaultFormat: 'wav',
        defaultBitrate: 256,
      };
      localStorage.setItem('sound-splittr-settings', JSON.stringify(customSettings));

      // Create a fresh instance to trigger reload.
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().apiUrl).toBe('http://custom:9000');
      expect(freshService.current().defaultModel).toBe('mdxdemucs');
      expect(freshService.current().defaultFormat).toBe('wav');
      expect(freshService.current().defaultBitrate).toBe(256);
    });
  });

  describe('migration', () => {
    it('should migrate old "bitrate" key to "defaultBitrate"', () => {
      const oldData = {
        ...DEFAULT_SETTINGS,
        bitrate: 192,
      };
      localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultBitrate).toBe(192);
      // The old key should not be present.
      expect((freshService.current() as Record<string, unknown>)['bitrate']).toBeUndefined();
    });

    it('should migrate old "format" key to "defaultFormat"', () => {
      const oldData = {
        ...DEFAULT_SETTINGS,
        format: 'flac',
      };
      localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultFormat).toBe('flac');
    });

    it('should migrate old "model" key to "defaultModel"', () => {
      const oldData = {
        ...DEFAULT_SETTINGS,
        model: 'htdemucs_6s',
      };
      localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultModel).toBe('htdemucs_6s');
    });

    it('should migrate all old keys at once', () => {
      const oldData = {
        bitrate: 128,
        format: 'mp3',
        model: 'mdxdemucs',
      };
      localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultBitrate).toBe(128);
      expect(freshService.current().defaultFormat).toBe('mp3');
      expect(freshService.current().defaultModel).toBe('mdxdemucs');
    });
  });

  describe('defaults for missing values', () => {
    it('should fill missing apiUrl with default', () => {
      localStorage.setItem('sound-splittr-settings', JSON.stringify({}));
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
    });

    it('should fill missing defaultBitrate with default', () => {
      localStorage.setItem('sound-splittr-settings', JSON.stringify({ defaultBitrate: 0 }));
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultBitrate).toBe(DEFAULT_SETTINGS.defaultBitrate);
    });

    it('should fill missing defaultFormat with default', () => {
      localStorage.setItem('sound-splittr-settings', JSON.stringify({ defaultFormat: '' }));
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
    });

    it('should fill missing defaultModel with default', () => {
      localStorage.setItem('sound-splittr-settings', JSON.stringify({ defaultModel: '' }));
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current().defaultModel).toBe(DEFAULT_SETTINGS.defaultModel);
    });
  });

  describe('corrupt data handling', () => {
    it('should fall back to defaults on JSON parse error', () => {
      localStorage.setItem('sound-splittr-settings', 'not json{{{');
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current()).toEqual(DEFAULT_SETTINGS);
    });

    it('should fall back to defaults on any unexpected error', () => {
      // Make localStorage throw.
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('Storage error'); },
          setItem: () => {},
          removeItem: () => {},
        },
        writable: true,
      });
      const freshService = TestBed.inject(SettingsService);
      expect(freshService.current()).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('patch', () => {
    it('should merge partial settings and persist', () => {
      service.patch({ defaultModel: 'mdxdemucs' });
      expect(service.current().defaultModel).toBe('mdxdemucs');
      // Other settings should remain unchanged.
      expect(service.current().defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
    });

    it('should persist the updated settings to localStorage', () => {
      service.patch({ defaultBitrate: 256 });
      const stored = JSON.parse(localStorage.getItem('sound-splittr-settings')!);
      expect(stored.defaultBitrate).toBe(256);
    });
  });

  describe('reset', () => {
    it('should clear localStorage and restore defaults', () => {
      service.patch({ defaultModel: 'htdemucs_6s', defaultFormat: 'flac' });
      service.reset();
      expect(service.current()).toEqual(DEFAULT_SETTINGS);
      expect(localStorage.getItem('sound-splittr-settings')).toBeNull();
    });
  });

  describe('property getters/setters', () => {
    it('apiUrl getter/setter should work', () => {
      service.apiUrl = 'http://test:8080';
      expect(service.apiUrl).toBe('http://test:8080');
      expect(service.current().apiUrl).toBe('http://test:8080');
    });

    it('model getter/setter should work', () => {
      service.model = 'mdxdemucs';
      expect(service.model).toBe('mdxdemucs');
      expect(service.current().defaultModel).toBe('mdxdemucs');
    });

    it('format getter/setter should work', () => {
      service.format = 'wav';
      expect(service.format).toBe('wav');
      expect(service.current().defaultFormat).toBe('wav');
    });

    it('bitrate getter/setter should work', () => {
      service.bitrate = 192;
      expect(service.bitrate).toBe(192);
      expect(service.current().defaultBitrate).toBe(192);
    });
  });
});
