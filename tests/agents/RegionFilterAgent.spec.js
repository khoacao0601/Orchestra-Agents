import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RegionFilterAgent } from '../../agents/RegionFilterAgent.js';
import * as configModule from '../../config.js';

// Mock config module to control AI client behavior (null for Demo Mode)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn().mockReturnValue(null),
  };
});

describe('RegionFilterAgent', () => {
  let agent;

  const sampleRawArticles = [
    {
      id: 'raw-1',
      title: 'Global Semiconductor Supply Pact',
      snippet: 'Asia-Pacific and US foundries sign joint production agreement.',
      source: 'Nikkei Asia'
    },
    {
      id: 'raw-2',
      title: 'European Union Green Energy Transition Accord',
      snippet: 'Brussels mandates renewable integration across member states.',
      source: 'Euractiv'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(configModule.getAiClient).mockReturnValue(null);
    agent = new RegionFilterAgent();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor Initialization', () => {
    it('should initialize RegionFilterAgent constructor properties correctly', () => {
      expect(agent.id).toBe('region_filter');
      expect(agent.name).toBe('Region Filter Agent');
      expect(agent.role).toBe('Geographic & Relevance Analyst');
      expect(agent.avatar).toBe('📍');
      expect(agent.color).toBe('#10b981');
      expect(agent.audioPitch).toBe(580);
      expect(agent.systemInstruction).toContain('Region Filter Agent');
    });
  });

  describe('filterByRegion in Demo Simulation Mode', () => {
    it('should tag articles with Asia-Pacific coordinates when targetRegion is Asia-Pacific', async () => {
      const logs = [];
      const filterPromise = agent.filterByRegion(sampleRawArticles, 'Asia-Pacific', (l) => logs.push(l));

      await vi.advanceTimersByTimeAsync(1500);

      const result = await filterPromise;

      expect(result).toHaveLength(2);
      expect(result[0].regionTag).toBe('Asia-Pacific');
      expect(result[0].location.city).toBe('Tokyo / Singapore');
      expect(result[0].location.lat).toBe(35.6762);
      expect(result[0].location.lng).toBe(139.6503);
      expect(result[0].relevanceScore).toBeGreaterThanOrEqual(90);
      expect(result[0].factCheckRating).toBe('Verified');

      expect(logs.some(l => l.status === 'filtering')).toBe(true);
      expect(logs.some(l => l.status === 'completed')).toBe(true);
    });

    it('should tag articles with Europe coordinates when targetRegion is Europe', async () => {
      const filterPromise = agent.filterByRegion(sampleRawArticles, 'Europe');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await filterPromise;

      expect(result[0].regionTag).toBe('Europe');
      expect(result[0].location.city).toBe('Geneva / London');
      expect(result[0].location.lat).toBe(46.2044);
    });

    it('should tag articles with Americas coordinates when targetRegion is Americas', async () => {
      const filterPromise = agent.filterByRegion(sampleRawArticles, 'Americas');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await filterPromise;

      expect(result[0].regionTag).toBe('Americas');
      expect(result[0].location.city).toBe('Washington D.C. / New York');
    });

    it('should default to Global coordinates and alternate region tags when targetRegion is Global', async () => {
      const filterPromise = agent.filterByRegion(sampleRawArticles, 'Global');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await filterPromise;

      expect(result[0].regionTag).toBe('Asia-Pacific');
      expect(result[1].regionTag).toBe('Europe & Americas');
      expect(result[0].location.city).toBe('Global Hub');
      expect(result[0].location.lat).toBe(20.0);
    });

    it('should preserve original raw article properties (id, title, snippet, source)', async () => {
      const filterPromise = agent.filterByRegion(sampleRawArticles, 'Europe');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await filterPromise;

      expect(result[0].id).toBe('raw-1');
      expect(result[0].title).toBe('Global Semiconductor Supply Pact');
      expect(result[0].source).toBe('Nikkei Asia');
    });
  });

  describe('filterByRegion in Live AI Mode', () => {
    it('should pass prompt to AI client and return parsed filtered articles from Gemini', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          filtered: [
            {
              id: 'raw-1',
              title: 'Global Semiconductor Supply Pact',
              snippet: 'Asia-Pacific and US foundries sign joint production agreement.',
              source: 'Nikkei Asia',
              regionTag: 'Asia-Pacific',
              location: { country: 'Taiwan', city: 'Hsinchu', lat: 24.8138, lng: 120.9675 },
              relevanceScore: 98,
              factCheckRating: 'Verified'
            }
          ]
        })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const logs = [];
      const result = await agent.filterByRegion(sampleRawArticles, 'Asia-Pacific', (l) => logs.push(l));

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].regionTag).toBe('Asia-Pacific');
      expect(result[0].location.city).toBe('Hsinchu');
      expect(result[0].relevanceScore).toBe(98);
      expect(logs.some(l => l.status === 'completed')).toBe(true);
    });

    it('should fallback to mockHandler result if AI client returns response without filtered array', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ invalidKey: [] })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.filterByRegion(sampleRawArticles, 'Europe');

      expect(result).toHaveLength(2);
      expect(result[0].regionTag).toBe('Europe');
    });
  });
});
