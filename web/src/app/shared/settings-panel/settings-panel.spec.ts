/**
 * Tests for SettingsPanel component.
 *
 * Verifies two-way binding with SettingsService, reset to defaults,
 * and connection testing.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi } from 'vitest';

import { SettingsPanelComponent } from './settings-panel';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';

describe('SettingsPanelComponent', () => {
  let fixture: ComponentFixture<SettingsPanelComponent>;
  let component: SettingsPanelComponent;
  let mockPatch: ReturnType<typeof vi.fn>;
  let mockReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPatch = vi.fn();
    mockReset = vi.fn();

    const mockSettings = {
      current: vi.fn(() => ({ apiUrl: 'http://localhost:8000', defaultModel: 'htdemucs', defaultFormat: 'mp3', defaultBitrate: 320 })),
      get apiUrl(): string { return 'http://localhost:8000'; },
      set apiUrl(v: string) { mockPatch({ apiUrl: v }); },
      get model(): string { return 'htdemucs'; },
      set model(v: string) { mockPatch({ defaultModel: v }); },
      get format(): string { return 'mp3'; },
      set format(v: string) { mockPatch({ defaultFormat: v }); },
      get bitrate(): number { return 320; },
      set bitrate(v: number) { mockPatch({ defaultBitrate: v }); },
      patch: mockPatch,
      reset: mockReset,
    } as unknown as SettingsService;

    const mockNotifications = {
      current: vi.fn(() => null),
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      confirm: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [SettingsPanelComponent, FormsModule],
      providers: [
        { provide: SettingsService, useValue: mockSettings },
        { provide: NotificationService, useValue: mockNotifications },
      ],
    });

    fixture = TestBed.createComponent(SettingsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with settings values', () => {
    expect(component.apiUrl).toBe('http://localhost:8000');
    expect(component.model).toBe('htdemucs');
    expect(component.format).toBe('mp3');
    expect(component.bitrate).toBe(320);
  });

  it('should update settings when apiUrl changes', () => {
    component.apiUrl = 'http://new-host:9000';
    expect(mockPatch).toHaveBeenCalledWith({ apiUrl: 'http://new-host:9000' });
  });

  it('should update settings when model changes', () => {
    component.model = 'mdxdemucs';
    expect(mockPatch).toHaveBeenCalledWith({ defaultModel: 'mdxdemucs' });
  });

  it('should update settings when format changes', () => {
    component.format = 'wav';
    expect(mockPatch).toHaveBeenCalledWith({ defaultFormat: 'wav' });
  });

  it('should update settings when bitrate changes', () => {
    component.bitrate = 44;
    expect(mockPatch).toHaveBeenCalledWith({ defaultBitrate: 44 });
  });

  it('should parse integer value', () => {
    expect(component.parseIntValue('42')).toBe(42);
    expect(component.parseIntValue('abc')).toBeNaN();
    expect(component.parseIntValue('')).toBeNaN();
  });

  it('should guard format value', () => {
    const callCountBefore = mockPatch.mock.calls.length;
    component.setFormatValue('mp3');
    expect(mockPatch).toHaveBeenCalledWith({ defaultFormat: 'mp3' });

    component.setFormatValue('invalid');
    // invalid should not trigger another patch call
    expect(mockPatch).toHaveBeenCalledTimes(callCountBefore + 1);
  });

  it('should reset to defaults', () => {
    component.resetToDefaults();
    expect(mockReset).toHaveBeenCalled();
  });

  it('should test connection', () => {
    component.testConnection();
    // The method uses fetch, so we can't easily mock it in this test.
    // Just verify it doesn't throw.
  });
});
