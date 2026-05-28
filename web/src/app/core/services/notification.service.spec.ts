/**
 * Tests for NotificationService.
 *
 * Verifies toast lifecycle: show, type variants, auto-dismiss, clear, and confirm.
 * Uses setTimeout mocking to avoid real timers.
 */
import { fakeAsync, flush, tick, TestBed } from '@angular/core/testing';
import { NotificationService, NotificationType } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    // Clear any lingering notifications after each test.
    service.clear();
  });

  describe('show', () => {
    it('should set current notification when show is called', () => {
      service.show('Test message', 'info');
      const notif = service.current();
      expect(notif).not.toBeNull();
      expect(notif!.message).toBe('Test message');
      expect(notif!.type).toBe('info');
      expect(notif!.duration).toBe(4000);
    });

    it('should assign incrementing IDs', () => {
      service.show('Message 1', 'info');
      const id1 = service.current()!.id;
      service.show('Message 2', 'success');
      const id2 = service.current()!.id;
      expect(id2).toBeGreaterThan(id1);
    });

    it('should overwrite previous notification', fakeAsync(() => {
      service.show('First', 'info');
      expect(service.current()!.message).toBe('First');
      service.show('Second', 'success');
      expect(service.current()!.message).toBe('Second');
    }));
  });

  describe('type variants', () => {
    it('info should set type to info', () => {
      service.info('Info msg');
      expect(service.current()!.type).toBe('info');
      expect(service.current()!.message).toBe('Info msg');
    });

    it('success should set type to success', () => {
      service.success('Success msg');
      expect(service.current()!.type).toBe('success');
    });

    it('warning should set type to warning', () => {
      service.warning('Warning msg');
      expect(service.current()!.type).toBe('warning');
    });

    it('error should set type to error', () => {
      service.error('Error msg');
      expect(service.current()!.type).toBe('error');
    });
  });

  describe('custom duration', () => {
    it('should accept a custom duration in ms', () => {
      service.show('Custom', 'info', 10000);
      expect(service.current()!.duration).toBe(10000);
    });
  });

  describe('auto-dismiss', () => {
    it('should clear notification after duration', fakeAsync(() => {
      service.show('Auto-dismiss', 'info', 500);
      expect(service.current()).not.toBeNull();
      tick(500);
      expect(service.current()).toBeNull();
    }));

    it('should not clear if a new notification arrives first', fakeAsync(() => {
      service.show('First', 'info', 500);
      tick(300);
      service.show('Second', 'success', 500);
      tick(300);
      // Second notification should still be visible (its timer hasn't fired yet).
      expect(service.current()!.message).toBe('Second');
      flush();
    }));
  });

  describe('clear', () => {
    it('should set current to null', () => {
      service.show('To clear', 'info');
      expect(service.current()).not.toBeNull();
      service.clear();
      expect(service.current()).toBeNull();
    });
  });

  describe('confirm', () => {
    it('should always resolve to true', async () => {
      const result = await service.confirm('Delete?');
      expect(result).toBe(true);
    });

    it('should show a warning notification while waiting', async () => {
      const promise = service.confirm('Confirm action');
      await new Promise((r) => setTimeout(r, 0));
      expect(service.current()!.type).toBe('warning');
      expect(service.current()!.message).toBe('Confirm action');
      // Resolve the promise.
      await promise;
    });
  });
});
