/**
 * Test setup — runs before every Vitest test suite.
 *
 * Provides a clean environment for Angular component/service testing
 * by mocking browser APIs and setting up Angular testing utilities.
 */
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Mock localStorage for tests (Angular's services use it heavily).
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.location.origin for tests.
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost' },
  writable: true,
});

// Mock ResizeObserver (used by some Angular components).
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).IntersectionObserver = class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock DragEvent (jsdom does not have native DragEvent).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).DragEvent = class DragEventMock extends Event {
  dataTransfer: any = { items: [], types: [], files: [] };
  constructor(type: string, init?: EventInit) {
    super(type, init);
  }
};

// Mock DataTransfer (jsdom does not have native DataTransfer).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).DataTransfer = class DataTransferMock {
  items: any[] = [];
  types: string[] = [];
  files: FileList = new Map() as unknown as FileList;

  add(file: File): void {
    this.items.push(file);
    this.types.push(file.type);
    (this.files as unknown as Map<number, File>).set(this.items.length - 1, file);
    Object.defineProperty(this.files, 'length', { value: this.items.length });
    Object.defineProperty(this.files, 'item', {
      value: (index: number) => this.items[index] ?? null,
    });
  }
};
