import { describe, it, expect } from 'vitest';

describe('Test Environment Setup', () => {
  it('should initialize process.env.NODE_ENV as test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should ensure process.env.GEMINI_API_KEY is defined', () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
  });
});
