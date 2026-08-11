import { beforeEach, afterEach, vi } from 'vitest';

// Enforce test environment settings
process.env.NODE_ENV = 'test';

// Ensure a consistent starting environment (e.g. controlled GEMINI_API_KEY fallback behavior)
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = '';
}

// Global setup hooks for Vitest backend unit test suite
beforeEach(() => {
  // Clear mock history and restore original implementations before each test
  vi.restoreAllMocks();
});

afterEach(() => {
  // Clear active fake timers to prevent leakage between unit tests
  vi.clearAllTimers();
});
