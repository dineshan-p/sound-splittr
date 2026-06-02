/**
 * Tests for NotificationService.
 *
 * Verifies notification creation, auto-dismiss, and clearing behavior.
 */
import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a notification with default duration', () => {
    service.show('Test message');
    const current = service.current();
    expect(current).not.toBeNull();
    expect(current!.message).toBe('Test message');
    expect(current!.type).toBe('info');
    expect(current!.duration).toBe(4000);
  });

  it('should show info notification', () => {
    service.show('Info message', 'info');
    const current = service.current();
    expect(current!.type).toBe('info');
  });

  it('should show success notification', () => {
    service.show('Success message', 'success');
    const current = service.current();
    expect(current!.type).toBe('success');
  });

  it('should show warning notification', () => {
    service.show('Warning message', 'warning');
    const current = service.current();
    expect(current!.type).toBe('warning');
  });

  it('should show error notification', () => {
    service.show('Error message', 'error');
    const current = service.current();
    expect(current!.type).toBe('error');
  });

  it('should clear notification', () => {
    service.show('Test message');
    service.clear();
    expect(service.current()).toBeNull();
  });

  it('should auto-dismiss after duration', async () => {
    service.show('Auto-dismiss test', 'info', 100);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(service.current()).toBeNull();
  });
});
