/**
 * Test setup — runs before every Vitest test suite.
 *
 * Provides a clean environment for Angular component/service testing
 * by mocking browser APIs and setting up Angular testing utilities.
 */
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

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
