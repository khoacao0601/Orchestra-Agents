import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslatorAgent } from '../../agents/TranslatorAgent.js';
import * as configModule from '../../config.js';

// Mock config module to control AI client behavior (null for Demo Mode)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn().mockReturnValue(null),
  };
});

describe('TranslatorAgent', () => {
  let agent;

  const sampleArticles = [
    {
      id: 'art-1',
      title: 'Global Economic Growth Exceeds Forecasts',
      snippet: 'International trade volume expanded by 4.2% year-over-year.',
      domainCategory: 'economy',
      domainInsights: {
        expertAnalysis: 'Macroeconomic indices indicate strong cross-border capital flow.',
        keyTakeaways: ['Trade volume up 4.2%.', 'Inflation moderates across G20.']
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(configModule.getAiClient).mockReturnValue(null);
    agent = new TranslatorAgent();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor Initialization', () => {
    it('should initialize TranslatorAgent properties correctly', () => {
      expect(agent.id).toBe('translator');
      expect(agent.name).toBe('Translator Agent');
      expect(agent.role).toBe('Multi-lingual Polyglot Specialist');
      expect(agent.avatar).toBe('🔤');
      expect(agent.color).toBe('#ec4899');
      expect(agent.audioPitch).toBe(760);
      expect(agent.systemInstruction).toContain('Translator Agent');
    });
  });

  describe('translateArticles in Demo Simulation Mode', () => {
    it('should translate articles into English by default', async () => {
      const logs = [];
      const promise = agent.translateArticles(sampleArticles, 'en', (l) => logs.push(l));

      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('en');
      expect(result[0].translatedTitle).toBe('Global Economic Growth Exceeds Forecasts');
      expect(result[0].translatedKeyTakeaways).toHaveLength(2);

      expect(logs.some(l => l.status === 'translating' && l.message.includes('English'))).toBe(true);
      expect(logs.some(l => l.status === 'completed')).toBe(true);
    });

    it('should map target language codes to correct language names (fr, es, ja, vi)', async () => {
      const languages = [
        { code: 'fr', name: 'Français (French)' },
        { code: 'es', name: 'Español (Spanish)' },
        { code: 'ja', name: '日本語 (Japanese)' },
        { code: 'vi', name: 'Vietnamese' }
      ];

      for (const lang of languages) {
        const logs = [];
        const promise = agent.translateArticles(sampleArticles, lang.code, (l) => logs.push(l));
        await vi.advanceTimersByTimeAsync(1500);
        const result = await promise;

        expect(result[0].language).toBe(lang.code);
        expect(logs.some(l => l.message.includes(lang.name))).toBe(true);
      }
    });

    it('should fallback domainInsights if domainInsights is missing', async () => {
      const bareArticle = [{ id: 'bare-1', title: 'Bare Article', snippet: 'Bare snippet' }];
      const promise = agent.translateArticles(bareArticle, 'es');

      await vi.advanceTimersByTimeAsync(1500);
      const result = await promise;

      expect(result[0].translatedExpertAnalysis).toBe('Bare snippet');
      expect(result[0].translatedKeyTakeaways).toEqual(['Bare snippet']);
    });
  });

  describe('translateArticles in Live AI Mode', () => {
    it('should call Gemini API and return parsed translatedArticles', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          translatedArticles: [
            {
              id: 'art-1',
              title: 'Croissance économique mondiale supérieure aux prévisions',
              snippet: 'Le volume du commerce international a augmenté de 4,2%.',
              expertAnalysis: 'Les indices macroéconomiques indiquent de forts flux.',
              keyTakeaways: ['Le volume du commerce a augmenté de 4,2%.'],
              language: 'fr'
            }
          ]
        })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.translateArticles(sampleArticles, 'fr');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Croissance');
    });

    it('should fallback to mockHandler result if AI client returns response without translatedArticles array', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ invalidData: true })
      });

      vi.mocked(configModule.getAiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await agent.translateArticles(sampleArticles, 'ja');

      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('ja');
    });
  });
});
