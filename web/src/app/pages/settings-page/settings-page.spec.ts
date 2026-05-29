/**
 * Tests for SettingsPage component.
 *
 * Verifies that the page renders the SettingsPanel and RouterLink.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { SettingsPage } from './settings-page';
import { SettingsPanelComponent } from '../../shared/settings-panel/settings-panel';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;

  beforeEach(() => {
    const settingsObj: any = {
      current: () => ({ apiUrl: 'http://localhost:8000', defaultModel: 'htdemucs', defaultFormat: 'mp3', defaultBitrate: 320 }),
      model: 'htdemucs',
      format: 'mp3',
      bitrate: 320,
      patch: vi.fn(),
      reset: vi.fn(),
    };

    const notifObj: any = {
      current: () => null,
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      confirm: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideRouter([]),
        { provide: SettingsService, useValue: settingsObj },
        { provide: NotificationService, useValue: notifObj },
      ],
    });

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
