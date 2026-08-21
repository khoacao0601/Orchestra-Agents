import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: [
      'tests/**/*.spec.js',
      'frontend/src/app/core/services/websocket.service.spec.ts'
    ],
  },
});
