/**
 * Tests for SettingsService.
 *
 * Verifies localStorage persistence, default values, migration logic,
 * and signal-based reactive updates.
 */
import { TestBed } from '@angular/core/testing';

import { SettingsService } from './settings.service';
import { DEFAULT_SETTINGS } from '../models';

describe('SettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsService],
    });
    // Clear localStorage before each test.
    localStorage.clear();
  });

  it('should be created', () => {
    const service = TestBed.inject(SettingsService);
    expect(service).toBeTruthy();
  });

  it('should return default settings when nothing is stored', () => {
    const service = TestBed.inject(SettingsService);
    const current = service.current();
    expect(current.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
    expect(current.defaultModel).toBe(DEFAULT_SETTINGS.defaultModel);
    expect(current.defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
    expect(current.defaultBitrate).toBe(DEFAULT_SETTINGS.defaultBitrate);
  });

  it('should return stored settings from localStorage', () => {
    localStorage.setItem(
      'sound-splittr-settings',
      JSON.stringify({
        apiUrl: 'http://custom:9000',
        defaultModel: 'mdxdemucs',
        defaultFormat: 'wav',
        defaultBitrate: 256,
      })
    );

    const service = TestBed.inject(SettingsService);
    const current = service.current();
    expect(current.apiUrl).toBe('http://custom:9000');
    expect(current.defaultModel).toBe('mdxdemucs');
    expect(current.defaultFormat).toBe('wav');
    expect(current.defaultBitrate).toBe(256);
  });

  it('should update settings via patch', () => {
    const service = TestBed.inject(SettingsService);
    service.patch({ defaultModel: 'htdemucs_6s' });

    const current = service.current();
    expect(current.defaultModel).toBe('htdemucs_6s');
    // Other settings should be preserved.
    expect(current.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
  });

  it('should reset settings to defaults', () => {
    const service = TestBed.inject(SettingsService);
    service.patch({ apiUrl: 'http://custom:9000' });
    service.reset();

    const current = service.current();
    expect(current.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
    expect(current.defaultModel).toBe(DEFAULT_SETTINGS.defaultModel);
    expect(current.defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
    expect(current.defaultBitrate).toBe(DEFAULT_SETTINGS.defaultBitrate);
  });

  it('should migrate old "bitrate" key to "defaultBitrate"', () => {
    const oldData = {
      apiUrl: 'http://localhost:8000',
      model: 'htdemucs',
      format: 'mp3',
      bitrate: 192,
    };
    localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

    const freshService = TestBed.inject(SettingsService);
    expect(freshService.current().defaultBitrate).toBe(192);
    // The old key should not be present.
    expect((freshService.current() as unknown as Record<string, unknown>)['bitrate']).toBeUndefined();
  });

  it('should migrate old "format" key to "defaultFormat"', () => {
    const oldData = {
      apiUrl: 'http://localhost:8000',
      model: 'htdemucs',
      format: 'wav',
      bitrate: 320,
    };
    localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

    const freshService = TestBed.inject(SettingsService);
    expect(freshService.current().defaultFormat).toBe('wav');
    expect((freshService.current() as unknown as Record<string, unknown>)['format']).toBeUndefined();
  });

  it('should migrate old "model" key to "defaultModel"', () => {
    const oldData = {
      apiUrl: 'http://localhost:8000',
      model: 'mdxdemucs',
      format: 'mp3',
      bitrate: 320,
    };
    localStorage.setItem('sound-splittr-settings', JSON.stringify(oldData));

    const freshService = TestBed.inject(SettingsService);
    expect(freshService.current().defaultModel).toBe('mdxdemucs');
    expect((freshService.current() as unknown as Record<string, unknown>)['model']).toBeUndefined();
  });

  it('should handle missing keys gracefully', () => {
    localStorage.setItem('sound-splittr-settings', JSON.stringify({}));
    const service = TestBed.inject(SettingsService);
    const current = service.current();
    expect(current.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
    expect(current.defaultModel).toBe(DEFAULT_SETTINGS.defaultModel);
    expect(current.defaultFormat).toBe(DEFAULT_SETTINGS.defaultFormat);
    expect(current.defaultBitrate).toBe(DEFAULT_SETTINGS.defaultBitrate);
  });

  it('should handle invalid JSON gracefully', () => {
    localStorage.setItem('sound-splittr-settings', 'not json');
    const service = TestBed.inject(SettingsService);
    const current = service.current();
    // Should fall back to defaults.
    expect(current.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
  });

  it('should handle empty string in localStorage', () => {
    localStorage.setItem('sound-splittr-settings', '');
    const service = TestBed.inject(SettingsService);
    const current = service.current();
    expect(current.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
  });
});
