/**
 * Tests for NotificationToastComponent.
 *
 * Verifies the toast displays the active notification from NotificationService,
 * shows the correct type class, and dismisses on click.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { NotificationToastComponent } from './notification-toast';
import { NotificationService, NotificationType } from '../../core/services/notification.service';

describe('NotificationToastComponent', () => {
  let component: NotificationToastComponent;
  let fixture: ComponentFixture<NotificationToastComponent>;
  let currentSignal: WritableSignal<any>;

  beforeEach(() => {
    currentSignal = signal(null);

    const notifObj: any = {
      current: currentSignal,
      show: vi.fn(),
      clear: vi.fn(() => { currentSignal.set(null); }),
    };

    TestBed.configureTestingModule({
      imports: [NotificationToastComponent],
      providers: [{ provide: NotificationService, useValue: notifObj }],
    });

    fixture = TestBed.createComponent(NotificationToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when no notification', () => {
    currentSignal.set(null);
    fixture.detectChanges();

    const toast = fixture.debugElement.query(By.css('.toast'));
    expect(toast).toBeNull();
  });

  it('should render toast when notification is set', () => {
    currentSignal.set({
      id: 1,
      message: 'Test notification',
      type: 'info' as NotificationType,
      duration: 4000,
    });
    fixture.detectChanges();

    const toast = fixture.debugElement.query(By.css('.toast'));
    expect(toast).not.toBeNull();
    expect(toast.nativeElement.textContent).toContain('Test notification');
  });

  it('should show correct type class', () => {
    currentSignal.set({
      id: 1,
      message: 'Error message',
      type: 'error' as NotificationType,
      duration: 4000,
    });
    fixture.detectChanges();

    const toast = fixture.debugElement.query(By.css('.toast'));
    expect(toast.nativeElement.classList.contains('type-error')).toBe(true);
  });

  it('should dismiss on click', () => {
    currentSignal.set({
      id: 1,
      message: 'Test',
      type: 'info' as NotificationType,
      duration: 4000,
    });
    fixture.detectChanges();

    const dismissBtn = fixture.debugElement.query(By.css('.toast-dismiss'));
    dismissBtn.nativeElement.click();
    expect(currentSignal()).toBeNull();
  });
});
