import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebScoutAgent } from '../../agents/WebScoutAgent.js';
import * as configModule from '../../config.js';
import Parser from 'rss-parser';
import { spawnSync } from 'child_process';
import fs from 'fs';

// Mock config module to control AI client behavior (null for Demo Mode)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn().mockReturnValue(null),
  };
});

// Mock child_process named export spawnSync
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    spawnSync: vi.fn(),
  };
});

describe('WebScoutAgent', () => {
  let agent;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Default to Demo simulation mode
    vi.mocked(configModule.getAiClient).mockReturnValue(null);
    // Default spawnSync to non-zero exit code so fallbacks trigger unless explicitly mocked
    vi.mocked(spawnSync).mockReturnValue({ status: 1, stdout: '', stderr: '', error: null });
    agent = new WebScoutAgent();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor Initialization', () => {
    it('should initialize WebScoutAgent properties correctly', () => {
      expect(agent.id).toBe('web_scout');
      expect(agent.name).toBe('Web Scout Agent');
      expect(agent.role).toBe('Global News Crawler & Fact Verifier');
      expect(agent.avatar).toBe('🌐');
      expect(agent.color).toBe('#3b82f6');
      expect(agent.audioPitch).toBe(520);
      expect(agent.systemInstruction).toContain('fact-checking-skill');
    });
  });

  describe('fetchLiveRss', () => {
    it('should return formatted article objects when RSS parse succeeds', async () => {
      const mockItems = [
        {
          title: 'Global Economy Update',
          source: 'Reuters',
          link: 'https://reuters.com/article1',
          pubDate: '2026-08-10T12:00:00Z',
          contentSnippet: 'Central banks adjust rates.'
        }
      ];

      vi.spyOn(Parser.prototype, 'parseURL').mockResolvedValue({ items: mockItems });

      const articles = await agent.fetchLiveRss('economy');

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Global Economy Update');
      expect(articles[0].source).toBe('Reuters');
      expect(articles[0].link).toBe('https://reuters.com/article1');
      expect(articles[0].snippet).toBe('Central banks adjust rates.');
      expect(articles[0].id).toContain('raw-');
    });

    it('should return null if RSS parser throws an error or feed is empty', async () => {
      vi.spyOn(Parser.prototype, 'parseURL').mockRejectedValue(new Error('Network error'));

      const articles = await agent.fetchLiveRss('failing query');

      expect(articles).toBeNull();
    });
  });

  describe('applyFactCheckingSkill', () => {
    const sampleRawArticles = [
      {
        id: 'raw-1',
        title: 'Tech Giants Announce $50B Semiconductor Alliance',
        snippet: 'Consortium expands microchip foundries worldwide.',
        source: 'Reuters Economic'
      },
      {
        id: 'raw-2',
        title: 'Shocking Miracle Cure Discovered in Secret Conspiracy',
        snippet: '10000% gain promised overnight.',
        source: 'Unknown Blog'
      }
    ];

    it('should execute Python script when fact_checker.py exists and spawnSync succeeds', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const pythonOutput = JSON.stringify({
        articles: [
          {
            ...sampleRawArticles[0],
            trustScore: 92,
            factCheckRating: 'Verified',
            factCheckNotes: 'Verified via Python engine'
          },
          {
            ...sampleRawArticles[1],
            trustScore: 85,
            factCheckRating: 'Verified',
            factCheckNotes: 'Verified via Python engine'
          }
        ]
      });

      vi.mocked(spawnSync).mockReturnValue({
        status: 0,
        stdout: pythonOutput,
        stderr: '',
        error: null
      });

      const logs = [];
      const verified = await agent.applyFactCheckingSkill(sampleRawArticles, (l) => logs.push(l));

      expect(verified).toHaveLength(2);
      expect(verified[0].trustScore).toBe(92);
      expect(verified[0].factCheckRating).toBe('Verified');
      expect(logs.some(l => l.message.includes('Successfully executed Python engine'))).toBe(true);
    });

    it('should fallback to JavaScript heuristic verification engine if Python execution fails or script missing', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const logs = [];
      const verified = await agent.applyFactCheckingSkill(sampleRawArticles, (l) => logs.push(l));

      expect(verified).toHaveLength(2);

      // Article 1: Tier-1 source (Reuters) + numerical stat ($50B) -> high trust score
      const art1 = verified[0];
      expect(art1.trustScore).toBeGreaterThanOrEqual(85);
      expect(art1.factCheckRating).toBe('Verified');
      expect(art1.warnings).toHaveLength(0);

      // Article 2: Sensationalist keywords ("shocking", "miracle", "conspiracy") -> lower score & warnings
      const art2 = verified[1];
      expect(art2.trustScore).toBeLessThan(70);
      expect(art2.warnings).toContain('Sensationalist keywords detected in claim');

      expect(logs.some(l => l.message.includes('Audit Complete'))).toBe(true);
    });
  });

  describe('scoutNews', () => {
    it('should gather economy category mock articles in Demo Mode and run fact-checking', async () => {
      vi.spyOn(agent, 'fetchLiveRss').mockResolvedValue(null);

      const logs = [];
      const scoutingPromise = agent.scoutNews('market policy', 'economy', (l) => logs.push(l));

      await vi.advanceTimersByTimeAsync(1500);

      const result = await scoutingPromise;

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(logs.some(l => l.status === 'scouting')).toBe(true);
      expect(logs.some(l => l.status === 'completed')).toBe(true);

      // Verify returned articles have fact checking metadata attached
      expect(result[0]).toHaveProperty('trustScore');
      expect(result[0]).toHaveProperty('factCheckRating');
    });

    it('should gather politics category mock articles when targetCategory is politics', async () => {
      vi.spyOn(agent, 'fetchLiveRss').mockResolvedValue(null);

      const scoutingPromise = agent.scoutNews('diplomacy', 'politics');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await scoutingPromise;

      expect(result.some(a => a.title.includes('United Nations') || a.title.includes('European Union'))).toBe(true);
    });

    it('should gather weather category mock articles when targetCategory is weather', async () => {
      vi.spyOn(agent, 'fetchLiveRss').mockResolvedValue(null);

      const scoutingPromise = agent.scoutNews('storm warning', 'weather');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await scoutingPromise;

      expect(result.some(a => a.title.includes('Climate') || a.title.includes('Typhoon'))).toBe(true);
    });

    it('should override mock articles with live RSS feed items when fetchLiveRss succeeds', async () => {
      const mockLiveRss = [
        {
          id: 'raw-rss-1',
          title: 'Live RSS Breaking Story',
          snippet: 'Live feed content',
          source: 'Associated Press',
          pubDate: '2026-08-10T15:00:00Z',
          link: 'https://apnews.com/1'
        }
      ];

      vi.spyOn(agent, 'fetchLiveRss').mockResolvedValue(mockLiveRss);

      const scoutingPromise = agent.scoutNews('breaking news', 'all');
      await vi.advanceTimersByTimeAsync(1500);
      const result = await scoutingPromise;

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Live RSS Breaking Story');
      expect(result[0].trustScore).toBeGreaterThanOrEqual(85);
    });
  });
});
