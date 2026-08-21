import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JournalistPublisherAgent } from '../../agents/JournalistPublisherAgent.js';
import * as configModule from '../../config.js';

// Mock config module to control AI client behavior (null for Demo Mode)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn().mockReturnValue(null),
  };
});

describe('JournalistPublisherAgent', () => {
  let agent;

  const sampleArticles = [
    {
      id: 'art-1',
      title: 'Global Semiconductor Alliance Expanded',
      translatedTitle: 'Global Semiconductor Alliance Expanded',
      snippet: 'Foundries increase chip output.',
      translatedSnippet: 'Foundries increase chip output.',
      domainCategory: 'economy',
      regionTag: 'Asia-Pacific',
      location: { country: 'Japan', city: 'Tokyo', lat: 35.67, lng: 139.65 },
      trustScore: 94,
      factCheckRating: 'Verified',
      domainInsights: {
        keyTakeaways: ['Foundries expand.'],
        expertAnalysis: 'Demand remains solid.',
        tags: ['Semiconductors', 'Economy']
      }
    },
    {
      id: 'art-2',
      title: 'UN Climate Summit Concludes',
      translatedTitle: 'UN Climate Summit Concludes',
      snippet: 'Delegates agree on new emission reduction targets.',
      translatedSnippet: 'Delegates agree on new emission reduction targets.',
      domainCategory: 'weather',
      regionTag: 'Europe',
      trustScore: 88,
      factCheckRating: 'Verified'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(configModule.getAiClient).mockReturnValue(null);
    agent = new JournalistPublisherAgent();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor Initialization', () => {
    it('should initialize JournalistPublisherAgent constructor properties correctly', () => {
      expect(agent.id).toBe('journalist_publisher');
      expect(agent.name).toBe('Journalist & Publisher Agent');
      expect(agent.role).toBe('Editor & Chief Publisher');
      expect(agent.avatar).toBe('📰');
      expect(agent.color).toBe('#f43f5e');
      expect(agent.audioPitch).toBe(840);
      expect(agent.systemInstruction).toContain('Journalist & Publisher Agent');
    });
  });

  describe('publishArticles in Demo Simulation Mode', () => {
    it('should format articles into story cards with TL;DR, tags, cardColor, and cardIcon for economy', async () => {
      const logs = [];
      const promise = agent.publishArticles(sampleArticles, 'Tech & Economy', (l) => logs.push(l));

      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result).toHaveLength(2);

      const card1 = result[0];
      expect(card1.tldr).toBe('[TL;DR] Foundries increase chip output.');
      expect(card1.category).toBe('economy');
      expect(card1.categoryLabel).toBe('Economy & Markets');
      expect(card1.cardColor).toBe('#f59e0b');
      expect(card1.cardIcon).toBe('📊');
      expect(card1.confidenceScore).toBe(94);

      expect(logs.some(l => l.status === 'publishing')).toBe(true);
      expect(logs.some(l => l.status === 'completed' && l.message.includes('published 2 stories'))).toBe(true);
    });

    it('should format category meta for weather category articles correctly', async () => {
      const promise = agent.publishArticles([sampleArticles[1]]);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      const card2 = result[0];
      expect(card2.category).toBe('weather');
      expect(card2.categoryLabel).toBe('Weather & Climate');
      expect(card2.cardColor).toBe('#06b6d4');
      expect(card2.cardIcon).toBe('🌤️');
    });

    it('should format politics category meta correctly', async () => {
      const politicsArticle = [{ id: 'pol-1', title: 'Treaty Signed', snippet: 'Pact ratified', domainCategory: 'politics' }];
      const promise = agent.publishArticles(politicsArticle);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result[0].categoryLabel).toBe('Politics & Geopolitics');
      expect(result[0].cardColor).toBe('#8b5cf6');
      expect(result[0].cardIcon).toBe('🏛️');
    });

    it('should assign default fallback values when properties like location, trustScore or tags are missing', async () => {
      const bareArticle = [{ title: 'Bare Story', snippet: 'Bare summary' }];
      const promise = agent.publishArticles(bareArticle);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      const card = result[0];
      expect(card.id).toContain('pub-');
      expect(card.region).toBe('Global Wire');
      expect(card.location.country).toBe('Worldwide');
      expect(card.confidenceScore).toBe(96);
      expect(card.factCheckRating).toBe('Verified');
      expect(card.source).toBe('Orchestra Global Wire');
    });
  });

  describe('publishArticles in Live AI Mode', () => {
    it('should call Gemini API and return parsed publishedArticles', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          publishedArticles: [
            {
              id: 'art-1',
              title: 'Global Semiconductor Alliance Expanded',
              tldr: '[TL;DR] Foundries increase output.',
              snippet: 'Foundries increase output.',
              category: 'economy',
              categoryLabel: 'Economy & Markets',
              confidenceScore: 98,
              cardColor: '#f59e0b',
              cardIcon: '📊'
            }
          ]
        })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.publishArticles(sampleArticles);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].confidenceScore).toBe(98);
    });

    it('should fallback to mockHandler result if AI client returns response without publishedArticles array', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ invalidResponse: true })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.publishArticles(sampleArticles);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Global Semiconductor Alliance Expanded');
    });
  });
});
