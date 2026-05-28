/**
 * Tests for SettingsPage component.
 *
 * Verifies settings panel rendering, save/reset events,
 * and settings service integration.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SettingsPage } from './settings-page';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';
import { DEFAULT_SETTINGS } from '../../models';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let component: SettingsPage;

  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', [
      'patch', 'reset', 'current',
    ]);
    mockSettingsService.current.and.returnValue({
      ...DEFAULT_SETTINGS,
    });

    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'show', 'success', 'error', 'info', 'warning', 'clear',
    ]);
    mockNotificationService.current.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { useValue: mockSettingsService },
        { useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have a page-title element', () => {
      const title = fixture.debugElement.query(By.css('.page-title'));
      expect(title).toBeTruthy();
    });

    it('should render a settings panel', () => {
      const panel = fixture.debugElement.query(By.css('app-settings-panel'));
      expect(panel).toBeTruthy();
    });
  });

  describe('settings panel integration', () => {
    it('should pass settings to the panel', () => {
      expect(component.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should save settings when panel emits savedSettings', () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        apiUrl: 'http://custom:9000',
        defaultModel: 'htdemucs_6s',
      };
      component.onSettingsSaved(newSettings);
      expect(mockSettingsService.patch).toHaveBeenCalledWith(newSettings);
    });

    it('should reset settings when panel emits resetSettings', () => {
      component.onSettingsReset();
      expect(mockSettingsService.reset).toHaveBeenCalled();
    });
  });

  describe('save notification', () => {
    it('should show success notification when settings are saved', () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        apiUrl: 'http://custom:9000',
      };
      component.onSettingsSaved(newSettings);
      expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should show error notification if settings save fails', () => {
      mockSettingsService.patch.and.throwError('Save failed');
      const newSettings = {
        ...DEFAULT_SETTINGS,
        apiUrl: 'http://custom:9000',
      };
      component.onSettingsSaved(newSettings);
      expect(mockNotificationService.error).toHaveBeenCalled();
    });
  });

  describe('reset notification', () => {
    it('should show success notification when settings are reset', () => {
      component.onSettingsReset();
      expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should show error notification if settings reset fails', () => {
      mockSettingsService.reset.and.throwError('Reset failed');
      component.onSettingsReset();
      expect(mockNotificationService.error).toHaveBeenCalled();
    });
  });
});
