import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NewsroomStateAnnotation } from '../../langgraph/newsroomState.js';
import { createNewsroomGraph } from '../../langgraph/newsroomGraph.js';
import { BaseAgent } from '../../agents/BaseAgent.js';
import * as configModule from '../../config.js';

// Mock config module to control AI client behavior (null for Demo Mode)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAiClient: vi.fn().mockReturnValue(null),
  };
});

describe('LangGraph Newsroom State & Pipeline Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configModule.getAiClient).mockReturnValue(null);

    // Bypass artificial 1.5s delay in BaseAgent for fast graph execution
    vi.spyOn(BaseAgent.prototype, 'generate').mockImplementation(async function ({ prompt, mockResponseHandler, onLog }) {
      if (onLog) {
        onLog({ agentId: this.id, agentName: this.name, status: 'thinking', message: `${this.name} analyzing...` });
      }
      if (mockResponseHandler) {
        const result = mockResponseHandler(prompt);
        if (onLog) {
          onLog({ agentId: this.id, agentName: this.name, status: 'completed', message: `${this.name} completed.` });
        }
        return result;
      }
      return null;
    });
  });

  describe('NewsroomStateAnnotation Definition', () => {
    it('should export a valid StateAnnotation object with expected state channels', () => {
      expect(NewsroomStateAnnotation).toBeDefined();
      expect(NewsroomStateAnnotation.spec).toBeDefined();

      const specKeys = Object.keys(NewsroomStateAnnotation.spec);
      expect(specKeys).toContain('topic');
      expect(specKeys).toContain('targetCategory');
      expect(specKeys).toContain('targetRegion');
      expect(specKeys).toContain('targetLanguage');
      expect(specKeys).toContain('rawArticles');
      expect(specKeys).toContain('filteredArticles');
      expect(specKeys).toContain('topicInsights');
      expect(specKeys).toContain('translatedArticles');
      expect(specKeys).toContain('publishedArticles');
      expect(specKeys).toContain('activeNodes');
      expect(specKeys).toContain('logs');
      expect(specKeys).toContain('error');
    });
  });

  describe('createNewsroomGraph Workflow Execution', () => {
    it('should compile graph into a valid Runnable graph instance', () => {
      const graph = createNewsroomGraph();
      expect(graph).toBeDefined();
      expect(typeof graph.invoke).toBe('function');
    });

    it('should execute full graph pipeline end-to-end for category "economy"', async () => {
      const broadcastLog = vi.fn();
      const updateAgentState = vi.fn();

      const graph = createNewsroomGraph(broadcastLog, updateAgentState);

      const finalState = await graph.invoke({
        topic: 'Global Semiconductor Supply Chain',
        targetCategory: 'economy',
        targetRegion: 'Asia-Pacific',
        targetLanguage: 'en'
      });

      // Verify node state updates were broadcasted
      expect(updateAgentState).toHaveBeenCalledWith('web_scout', 'thinking');
      expect(updateAgentState).toHaveBeenCalledWith('region_filter', 'thinking');
      expect(updateAgentState).toHaveBeenCalledWith('topic_economy', 'thinking');
      expect(updateAgentState).toHaveBeenCalledWith('translator', 'thinking');
      expect(updateAgentState).toHaveBeenCalledWith('journalist_publisher', 'thinking');

      // Verify final state data flow
      expect(finalState.rawArticles.length).toBeGreaterThan(0);
      expect(finalState.filteredArticles.length).toBeGreaterThan(0);
      expect(finalState.topicInsights.economy.length).toBeGreaterThan(0);
      expect(finalState.translatedArticles.length).toBeGreaterThan(0);
      expect(finalState.publishedArticles.length).toBeGreaterThan(0);

      // Verify published article structure
      const published = finalState.publishedArticles[0];
      expect(published.category).toBe('economy');
      expect(published.categoryLabel).toBe('Economy & Markets');
      expect(published.tldr).toContain('[TL;DR]');
    });

    it('should execute graph pipeline and route to politicsSpecialist when targetCategory is "politics"', async () => {
      const updateAgentState = vi.fn();
      const graph = createNewsroomGraph(() => {}, updateAgentState);

      const finalState = await graph.invoke({
        topic: 'UN Maritime Security Summit',
        targetCategory: 'politics',
        targetRegion: 'Europe',
        targetLanguage: 'en'
      });

      expect(updateAgentState).toHaveBeenCalledWith('topic_politics', 'thinking');
      expect(finalState.topicInsights.politics.length).toBeGreaterThan(0);
      expect(finalState.publishedArticles[0].categoryLabel).toBe('Politics & Geopolitics');
    });

    it('should execute graph pipeline and route to weatherSpecialist when targetCategory is "weather"', async () => {
      const updateAgentState = vi.fn();
      const graph = createNewsroomGraph(() => {}, updateAgentState);

      const finalState = await graph.invoke({
        topic: 'Global Super Typhoon Alert',
        targetCategory: 'weather',
        targetRegion: 'Americas',
        targetLanguage: 'en'
      });

      expect(updateAgentState).toHaveBeenCalledWith('topic_weather', 'thinking');
      expect(finalState.topicInsights.weather.length).toBeGreaterThan(0);
      expect(finalState.publishedArticles[0].categoryLabel).toBe('Weather & Climate');
    });

    it('should execute chained topic nodes (economy -> politics -> weather) when targetCategory is "all"', async () => {
      const updateAgentState = vi.fn();
      const graph = createNewsroomGraph(() => {}, updateAgentState);

      const finalState = await graph.invoke({
        topic: 'Global Breaking News Round-Up',
        targetCategory: 'all',
        targetRegion: 'Global',
        targetLanguage: 'en'
      });

      expect(updateAgentState).toHaveBeenCalledWith('topic_economy', 'thinking');
      expect(updateAgentState).toHaveBeenCalledWith('topic_politics', 'thinking');
      expect(updateAgentState).toHaveBeenCalledWith('topic_weather', 'thinking');

      expect(finalState.topicInsights.economy).toBeDefined();
      expect(finalState.topicInsights.politics).toBeDefined();
      expect(finalState.topicInsights.weather).toBeDefined();
      expect(finalState.publishedArticles.length).toBeGreaterThan(0);
    });
  });
});
