/**
 * Tests for StemPlayerComponent.
 *
 * Verifies play/pause, mute/solo, volume, seek, and download.
 * Uses TestBed with input signals set via componentRef.setInput.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { vi } from 'vitest';

import { StemPlayerComponent, StemPlayerProps } from './stem-player';
import { NotificationService } from '../../core/services/notification.service';

describe('StemPlayerComponent', () => {
  let component: StemPlayerComponent;
  let fixture: ComponentFixture<StemPlayerComponent>;
  let mockNotifications: any;

  const defaultStem: StemPlayerProps = {
    name: 'vocals',
    displayName: 'Vocals',
    src: 'http://localhost:8000/api/stems/job1/vocals',
  };

  beforeEach(() => {
    const notifSpy: any = {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      confirm: vi.fn(),
      clear: vi.fn(),
      current: () => null,
    };

    TestBed.configureTestingModule({
      imports: [StemPlayerComponent, FormsModule],
      providers: [{ provide: NotificationService, useValue: notifSpy }],
    });

    fixture = TestBed.createComponent(StemPlayerComponent);
    component = fixture.componentInstance;
    mockNotifications = TestBed.inject(NotificationService) as any;

    // Set the required input signal
    fixture.componentRef.setInput('stem', defaultStem);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with expected signal values', () => {
    expect(component.isPlaying()).toBe(false);
    expect(component.isMuted()).toBe(false);
    expect(component.volume()).toBe(100);
    expect(component.duration()).toBe(0);
    expect(component.currentTime()).toBe(0);
    expect(component.isSoloed()).toBe(false);
  });

  it('should toggle mute', () => {
    component.toggleMute();
    expect(component.isMuted()).toBe(true);
    component.toggleMute();
    expect(component.isMuted()).toBe(false);
  });

  it('should toggle solo', () => {
    component.toggleSolo();
    expect(component.isSoloed()).toBe(true);
    component.toggleSolo();
    expect(component.isSoloed()).toBe(false);
  });

  it('should set volume', () => {
    const event = { target: { value: '50' } } as unknown as Event;
    component.setVolume(event);
    expect(component.volume()).toBe(50);
  });

  it('should seek', () => {
    const event = { target: { value: '30' } } as unknown as Event;
    component.seek(event);
    expect(component.currentTime()).toBe(30);
  });

  it('should format time correctly for minutes', () => {
    expect(component.formatTime(60)).toBe('1:00');
    expect(component.formatTime(120)).toBe('2:00');
    expect(component.formatTime(90)).toBe('1:30');
  });

  it('should format time with hours', () => {
    expect(component.formatTime(3661)).toBe('1:01:01');
    expect(component.formatTime(7200)).toBe('2:00:00');
  });

  it('should emit downloaded on download', () => {
    let emittedName: string | null = null;
    component.downloaded.subscribe((name) => { emittedName = name; });
    component.onDownload();
    expect(emittedName).toBe('vocals');
    expect(mockNotifications.info).toHaveBeenCalledWith('Downloading Vocals');
  });

  it('should handle mute all when not soloed', () => {
    component.handleMuteAll();
    expect(component.isMuted()).toBe(true);
  });
});
