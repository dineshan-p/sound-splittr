/**
 * Tests for NotificationToast component.
 *
 * Verifies type-based styling, message display,
 * dismiss button, and auto-dismiss behavior.
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NotificationToast } from './notification-toast';
import { NotificationService } from '../../core/services/notification.service';

describe('NotificationToast', () => {
  let fixture: ComponentFixture<NotificationToast>;
  let component: NotificationToast;
  let notifService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationToast],
      providers: [NotificationService],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationToast);
    component = fixture.componentInstance;
    notifService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not display when no notification', () => {
      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('visible')).toBe(false);
    });
  });

  describe('notification display', () => {
    it('should display notification message', fakeAsync(() => {
      notifService.show('Test message', 'info');
      tick();
      fixture.detectChanges();

      const msgEl = fixture.debugElement.query(By.css('.notification-message'));
      expect(msgEl.nativeElement.textContent).toContain('Test message');
    }));

    it('should show info type styling', fakeAsync(() => {
      notifService.info('Info notification');
      tick();
      fixture.detectChanges();

      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('info')).toBe(true);
    }));

    it('should show success type styling', fakeAsync(() => {
      notifService.success('Success notification');
      tick();
      fixture.detectChanges();

      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('success')).toBe(true);
    }));

    it('should show warning type styling', fakeAsync(() => {
      notifService.warning('Warning notification');
      tick();
      fixture.detectChanges();

      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('warning')).toBe(true);
    }));

    it('should show error type styling', fakeAsync(() => {
      notifService.error('Error notification');
      tick();
      fixture.detectChanges();

      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('error')).toBe(true);
    }));
  });

  describe('auto-dismiss', () => {
    it('should hide notification after duration', fakeAsync(() => {
      notifService.show('Auto-dismiss', 'info', 300);
      tick(300);
      fixture.detectChanges();

      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('visible')).toBe(false);
    }));
  });

  describe('manual dismiss', () => {
    it('should hide notification when dismiss button is clicked', fakeAsync(() => {
      notifService.show('Dismiss me', 'info', 5000);
      tick();
      fixture.detectChanges();

      const dismissBtn = fixture.debugElement.query(By.css('.dismiss-btn'));
      dismissBtn.nativeElement.click();
      tick();
      fixture.detectChanges();

      const toastEl = fixture.debugElement.query(By.css('.notification-toast'));
      expect(toastEl.nativeElement.classList.contains('visible')).toBe(false);
    }));
  });
});
