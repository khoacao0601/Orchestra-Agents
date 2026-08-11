import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseAgent } from '../../agents/BaseAgent.js';
import * as configModule from '../../config.js';

// Mock config module to control AI client behavior across test cases
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn(),
  };
});

describe('BaseAgent', () => {
  const agentProps = {
    id: 'test-agent-1',
    name: 'Scout Agent',
    role: 'Intelligence Gatherer',
    avatar: '🤖',
    color: '#3498db',
    audioPitch: 520,
    systemInstruction: 'You are an elite news analyst.'
  };

  let agent;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    agent = new BaseAgent(agentProps);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor Initialization', () => {
    it('should correctly assign provided constructor properties', () => {
      expect(agent.id).toBe('test-agent-1');
      expect(agent.name).toBe('Scout Agent');
      expect(agent.role).toBe('Intelligence Gatherer');
      expect(agent.avatar).toBe('🤖');
      expect(agent.color).toBe('#3498db');
      expect(agent.audioPitch).toBe(520);
      expect(agent.systemInstruction).toBe('You are an elite news analyst.');
    });

    it('should default audioPitch to 440 when omitted', () => {
      const defaultAgent = new BaseAgent({ id: 'default-agent', name: 'Default', role: 'Tester' });
      expect(defaultAgent.audioPitch).toBe(440);
    });
  });

  describe('Demo Simulation Mode (No AI Client)', () => {
    beforeEach(() => {
      vi.mocked(configModule.getAiClient).mockReturnValue(null);
    });

    it('should trigger thinking and mock_notice logs, then return mock response', async () => {
      const logs = [];
      const onLog = (log) => logs.push(log);
      const mockHandler = vi.fn().mockImplementation((prompt) => ({ status: 'mock_data', prompt }));

      const promise = agent.generate({
        prompt: 'Analyze tech news',
        mockResponseHandler: mockHandler,
        onLog
      });

      // Fast-forward fake timer for 1500ms delay in Demo Mode
      await vi.advanceTimersByTimeAsync(1500);

      const result = await promise;

      expect(mockHandler).toHaveBeenCalledWith('Analyze tech news');
      expect(result).toEqual({ status: 'mock_data', prompt: 'Analyze tech news' });

      expect(logs).toHaveLength(3);
      expect(logs[0].status).toBe('thinking');
      expect(logs[1].status).toBe('mock_notice');
      expect(logs[2].status).toBe('completed');
    });

    it('should return null if mockResponseHandler is not provided when AI client is null', async () => {
      const promise = agent.generate({ prompt: 'Hello' });
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('Live AI Client Mode (generateContent)', () => {
    let mockGenerateContent;

    beforeEach(() => {
      mockGenerateContent = vi.fn();
      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: {
          generateContent: mockGenerateContent
        }
      });
    });

    it('should send correct systemInstruction, jsonMode config, and parse valid JSON output', async () => {
      const mockJsonResponse = { articles: [{ title: 'AI Breakthrough' }] };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockJsonResponse)
      });

      const logs = [];
      const result = await agent.generate({
        prompt: 'Gather articles',
        jsonMode: true,
        onLog: (log) => logs.push(log)
      });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: configModule.DEFAULT_MODEL,
        contents: 'Gather articles',
        config: {
          systemInstruction: 'You are an elite news analyst.',
          responseMimeType: 'application/json'
        }
      });

      expect(result).toEqual(mockJsonResponse);
      expect(logs.some((l) => l.status === 'completed')).toBe(true);
    });

    it('should extract JSON via regex if text contains surrounding non-JSON formatting', async () => {
      const formattedText = 'Here is the result:\n{\n  "status": "extracted"\n}\nHope this helps!';
      mockGenerateContent.mockResolvedValue({ text: formattedText });

      const result = await agent.generate({ prompt: 'Extract data', jsonMode: true });
      expect(result).toEqual({ status: 'extracted' });
    });

    it('should fallback to { rawText: text } if JSON parsing and regex extraction fail', async () => {
      const unparseableText = 'Plain non-json response without brackets';
      mockGenerateContent.mockResolvedValue({ text: unparseableText });

      const result = await agent.generate({ prompt: 'Extract data', jsonMode: true });
      expect(result).toEqual({ rawText: 'Plain non-json response without brackets' });
    });

    it('should return raw text directly when jsonMode is false', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Raw text summary' });

      const result = await agent.generate({ prompt: 'Summarize', jsonMode: false });
      expect(result).toBe('Raw text summary');
    });

    it('should catch AI API errors, log error status, and fallback to mockResponseHandler if provided', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

      const logs = [];
      const mockHandler = vi.fn().mockReturnValue({ fallback: true });

      const result = await agent.generate({
        prompt: 'Query news',
        mockResponseHandler: mockHandler,
        onLog: (l) => logs.push(l)
      });

      expect(logs.some((l) => l.status === 'error' && l.message.includes('API quota exceeded'))).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith('Query news');
      expect(result).toEqual({ fallback: true });
    });

    it('should re-throw error if AI API fails and no mockResponseHandler is provided', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Fatal API crash'));

      await expect(agent.generate({ prompt: 'Query news' })).rejects.toThrow('Fatal API crash');
    });
  });
});
