import { StateGraph, START, END } from '@langchain/langgraph';
import { NewsroomStateAnnotation } from './newsroomState.js';
import { WebScoutAgent } from '../agents/WebScoutAgent.js';
import { RegionFilterAgent } from '../agents/RegionFilterAgent.js';
import { TopicSpecialistAgent } from '../agents/TopicSpecialistAgent.js';
import { TranslatorAgent } from '../agents/TranslatorAgent.js';
import { JournalistPublisherAgent } from '../agents/JournalistPublisherAgent.js';

/**
 * Build and compile the LangGraph Newsroom StateGraph
 * @param {Function} broadcastLog Callback to stream agent logs real-time via WebSockets
 * @param {Function} updateAgentState Callback to stream agent node status updates
 */
export function createNewsroomGraph(broadcastLog = () => {}, updateAgentState = () => {}) {
  // Instantiating agents
  const scout = new WebScoutAgent();
  const regionFilter = new RegionFilterAgent();
  const economySpecialist = new TopicSpecialistAgent('economy');
  const politicsSpecialist = new TopicSpecialistAgent('politics');
  const weatherSpecialist = new TopicSpecialistAgent('weather');
  const translator = new TranslatorAgent();
  const publisher = new JournalistPublisherAgent();

  // Helper log emitter
  const logHelper = (logData) => {
    broadcastLog(logData);
  };

  // Node 1: Web Scout Node
  const webScoutNode = async (state) => {
    updateAgentState('web_scout', 'thinking');
    const rawArticles = await scout.scoutNews(state.topic, state.targetCategory, logHelper);
    updateAgentState('web_scout', 'completed', { count: rawArticles.length });
    return {
      rawArticles,
      activeNodes: { web_scout: 'completed' }
    };
  };

  // Node 2: Region Filter Node
  const regionFilterNode = async (state) => {
    updateAgentState('region_filter', 'thinking');
    const filteredArticles = await regionFilter.filterByRegion(state.rawArticles, state.targetRegion, logHelper);
    updateAgentState('region_filter', 'completed', { count: filteredArticles.length });
    return {
      filteredArticles,
      activeNodes: { region_filter: 'completed' }
    };
  };

  // Node 3A: Economy Specialist Node
  const economyNode = async (state) => {
    updateAgentState('topic_economy', 'thinking');
    const econArticles = state.filteredArticles.filter(
      (a) => a.rawCategory?.toLowerCase().includes('econ') || state.targetCategory === 'economy' || state.targetCategory === 'all'
    );
    const articlesToProcess = econArticles.length > 0 ? econArticles : state.filteredArticles;
    const econAnalyzed = await economySpecialist.analyzeArticles(articlesToProcess, logHelper);
    updateAgentState('topic_economy', 'completed', { count: econAnalyzed.length });
    return {
      topicInsights: { ...state.topicInsights, economy: econAnalyzed },
      activeNodes: { topic_economy: 'completed' }
    };
  };

  // Node 3B: Politics Specialist Node
  const politicsNode = async (state) => {
    updateAgentState('topic_politics', 'thinking');
    const polArticles = state.filteredArticles.filter(
      (a) => a.rawCategory?.toLowerCase().includes('politic') || state.targetCategory === 'politics' || state.targetCategory === 'all'
    );
    const articlesToProcess = polArticles.length > 0 ? polArticles : state.filteredArticles;
    const polAnalyzed = await politicsSpecialist.analyzeArticles(articlesToProcess, logHelper);
    updateAgentState('topic_politics', 'completed', { count: polAnalyzed.length });
    return {
      topicInsights: { ...state.topicInsights, politics: polAnalyzed },
      activeNodes: { topic_politics: 'completed' }
    };
  };

  // Node 3C: Weather Specialist Node
  const weatherNode = async (state) => {
    updateAgentState('topic_weather', 'thinking');
    const weatherArticles = state.filteredArticles.filter(
      (a) => a.rawCategory?.toLowerCase().includes('weather') || a.rawCategory?.toLowerCase().includes('climate') || state.targetCategory === 'weather' || state.targetCategory === 'all'
    );
    const articlesToProcess = weatherArticles.length > 0 ? weatherArticles : state.filteredArticles;
    const weatherAnalyzed = await weatherSpecialist.analyzeArticles(articlesToProcess, logHelper);
    updateAgentState('topic_weather', 'completed', { count: weatherAnalyzed.length });
    return {
      topicInsights: { ...state.topicInsights, weather: weatherAnalyzed },
      activeNodes: { topic_weather: 'completed' }
    };
  };

  // Node 4: Translator Node
  const translatorNode = async (state) => {
    updateAgentState('translator', 'thinking');
    // Combine insights from all active topic nodes
    let allAnalyzed = [];
    if (state.topicInsights.economy) allAnalyzed.push(...state.topicInsights.economy);
    if (state.topicInsights.politics) allAnalyzed.push(...state.topicInsights.politics);
    if (state.topicInsights.weather) allAnalyzed.push(...state.topicInsights.weather);

    if (allAnalyzed.length === 0) {
      allAnalyzed = state.filteredArticles;
    }

    const translatedArticles = await translator.translateArticles(allAnalyzed, state.targetLanguage, logHelper);
    updateAgentState('translator', 'completed', { count: translatedArticles.length });
    return {
      translatedArticles,
      activeNodes: { translator: 'completed' }
    };
  };

  // Node 5: Journalist & Publisher Node
  const publisherNode = async (state) => {
    updateAgentState('journalist_publisher', 'thinking');
    const publishedArticles = await publisher.publishArticles(state.translatedArticles, state.topic, logHelper);
    updateAgentState('journalist_publisher', 'completed', { count: publishedArticles.length });
    return {
      publishedArticles,
      activeNodes: { journalist_publisher: 'completed' }
    };
  };

  // Build StateGraph
  const workflow = new StateGraph(NewsroomStateAnnotation)
    .addNode('webScout', webScoutNode)
    .addNode('regionFilter', regionFilterNode)
    .addNode('economySpecialist', economyNode)
    .addNode('politicsSpecialist', politicsNode)
    .addNode('weatherSpecialist', weatherNode)
    .addNode('translator', translatorNode)
    .addNode('publisher', publisherNode);

  // Define Edges
  workflow.addEdge(START, 'webScout');
  workflow.addEdge('webScout', 'regionFilter');

  // Conditional Edge routing based on target category
  workflow.addConditionalEdges(
    'regionFilter',
    (state) => {
      const cat = (state.targetCategory || 'all').toLowerCase();
      if (cat === 'economy') return 'economySpecialist';
      if (cat === 'politics') return 'politicsSpecialist';
      if (cat === 'weather') return 'weatherSpecialist';
      // If 'all', route to economySpecialist, politicsSpecialist, weatherSpecialist in sequence or parallel
      return 'economySpecialist';
    },
    {
      economySpecialist: 'economySpecialist',
      politicsSpecialist: 'politicsSpecialist',
      weatherSpecialist: 'weatherSpecialist'
    }
  );

  // Topic Specialist chaining
  workflow.addConditionalEdges(
    'economySpecialist',
    (state) => {
      if (state.targetCategory === 'all') return 'politicsSpecialist';
      return 'translator';
    },
    {
      politicsSpecialist: 'politicsSpecialist',
      translator: 'translator'
    }
  );

  workflow.addConditionalEdges(
    'politicsSpecialist',
    (state) => {
      if (state.targetCategory === 'all') return 'weatherSpecialist';
      return 'translator';
    },
    {
      weatherSpecialist: 'weatherSpecialist',
      translator: 'translator'
    }
  );

  workflow.addEdge('weatherSpecialist', 'translator');
  workflow.addEdge('translator', 'publisher');
  workflow.addEdge('publisher', END);

  return workflow.compile();
}
