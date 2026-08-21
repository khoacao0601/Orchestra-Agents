import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TopicSpecialistAgent } from '../../agents/TopicSpecialistAgent.js';
import * as configModule from '../../config.js';

// Mock config module to control AI client behavior (null for Demo Mode)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn().mockReturnValue(null),
  };
});

describe('TopicSpecialistAgent', () => {
  const sampleArticles = [
    {
      id: 'art-1',
      title: 'Global Chip Foundry Infrastructure Alliance',
      snippet: 'Foundries expand capacity across Asia and Europe.',
      source: 'Financial Times'
    },
    {
      id: 'art-2',
      title: 'Renewable Power Surge Reaches Record Levels',
      snippet: 'Wind and solar offset fossil fuel usage in Q2.',
      source: 'Reuters'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(configModule.getAiClient).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor Initialization', () => {
    it('should initialize Economy Specialist Agent by default or when topicType is economy', () => {
      const defaultAgent = new TopicSpecialistAgent();
      expect(defaultAgent.id).toBe('topic_economy');
      expect(defaultAgent.name).toBe('Economy Specialist Agent');
      expect(defaultAgent.role).toBe('Global Markets & Financial Analyst');
      expect(defaultAgent.avatar).toBe('📊');
      expect(defaultAgent.color).toBe('#f59e0b');
      expect(defaultAgent.audioPitch).toBe(640);
      expect(defaultAgent.topicType).toBe('economy');
    });

    it('should initialize Politics Specialist Agent when topicType is politics', () => {
      const politicsAgent = new TopicSpecialistAgent('politics');
      expect(politicsAgent.id).toBe('topic_politics');
      expect(politicsAgent.name).toBe('Politics Specialist Agent');
      expect(politicsAgent.role).toBe('Geopolitics & International Affairs Analyst');
      expect(politicsAgent.avatar).toBe('🏛️');
      expect(politicsAgent.color).toBe('#8b5cf6');
      expect(politicsAgent.audioPitch).toBe(680);
      expect(politicsAgent.topicType).toBe('politics');
    });

    it('should initialize Weather Specialist Agent when topicType is weather', () => {
      const weatherAgent = new TopicSpecialistAgent('weather');
      expect(weatherAgent.id).toBe('topic_weather');
      expect(weatherAgent.name).toBe('Weather & Climate Specialist Agent');
      expect(weatherAgent.role).toBe('Meteorology & Climate Science Analyst');
      expect(weatherAgent.avatar).toBe('🌤️');
      expect(weatherAgent.color).toBe('#06b6d4');
      expect(weatherAgent.audioPitch).toBe(720);
      expect(weatherAgent.topicType).toBe('weather');
    });

    it('should fallback to economy config when invalid topicType is passed', () => {
      const unknownAgent = new TopicSpecialistAgent('sports');
      expect(unknownAgent.id).toBe('topic_economy');
      expect(unknownAgent.topicType).toBe('sports');
    });
  });

  describe('analyzeArticles in Demo Simulation Mode', () => {
    it('should generate economy domain insights, takeaways, and tags for economy agent', async () => {
      const agent = new TopicSpecialistAgent('economy');
      const logs = [];

      const promise = agent.analyzeArticles(sampleArticles, (l) => logs.push(l));
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result).toHaveLength(2);
      expect(result[0].domainCategory).toBe('economy');
      expect(result[0].impactLevel).toBe('Critical');
      expect(result[1].impactLevel).toBe('High');
      expect(result[0].domainInsights.keyTakeaways[0]).toContain('liquidity buffers');
      expect(result[0].domainInsights.tags).toContain('Macroeconomy');
      expect(result[0].domainInsights.tags).toContain('Markets');

      expect(logs.some(l => l.status === 'analyzing')).toBe(true);
      expect(logs.some(l => l.status === 'completed')).toBe(true);
    });

    it('should generate politics domain insights, takeaways, and tags for politics agent', async () => {
      const agent = new TopicSpecialistAgent('politics');

      const promise = agent.analyzeArticles(sampleArticles);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result[0].domainCategory).toBe('politics');
      expect(result[0].domainInsights.keyTakeaways[0]).toContain('maritime security');
      expect(result[0].domainInsights.tags).toContain('Geopolitics');
      expect(result[0].domainInsights.tags).toContain('UN');
    });

    it('should generate weather domain insights, takeaways, and tags for weather agent', async () => {
      const agent = new TopicSpecialistAgent('weather');

      const promise = agent.analyzeArticles(sampleArticles);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result[0].domainCategory).toBe('weather');
      expect(result[0].domainInsights.keyTakeaways[0]).toContain('Renewable generation capacity');
      expect(result[0].domainInsights.tags).toContain('Climate');
      expect(result[0].domainInsights.tags).toContain('Renewable Energy');
    });
  });

  describe('analyzeArticles in Live AI Mode', () => {
    it('should send prompt to AI client and return parsed analyzedArticles', async () => {
      const agent = new TopicSpecialistAgent('economy');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          analyzedArticles: [
            {
              id: 'art-1',
              title: 'Global Chip Foundry Infrastructure Alliance',
              domainCategory: 'economy',
              impactLevel: 'Critical',
              domainInsights: {
                keyTakeaways: ['High demand for sub-3nm nodes.'],
                expertAnalysis: 'Strong demand signals.',
                tags: ['Semiconductors']
              }
            }
          ]
        })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.analyzeArticles(sampleArticles);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].domainInsights.keyTakeaways[0]).toBe('High demand for sub-3nm nodes.');
    });

    it('should fallback to mockHandler response if AI client returns payload without analyzedArticles', async () => {
      const agent = new TopicSpecialistAgent('economy');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ invalidResponse: true })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.analyzeArticles(sampleArticles);

      expect(result).toHaveLength(2);
      expect(result[0].domainCategory).toBe('economy');
    });
  });
});
