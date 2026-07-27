import { createNewsroomGraph } from '../langgraph/newsroomGraph.js';

export class NewsOrchestrator {
  constructor(broadcastCallback = () => {}) {
    this.broadcast = broadcastCallback;
    this.isRunning = false;
    
    // Store latest published articles in memory for immediate reader rendering
    this.latestArticles = [];
    
    // Initial agent graph topology configuration for Admin drag-and-drop diagram
    this.agentTopology = {
      nodes: [
        { id: 'web_scout', name: 'Web Scout Agent', type: 'Scout', avatar: '🌐', x: 80, y: 150, active: true, color: '#3b82f6' },
        { id: 'region_filter', name: 'Region Filter Agent', type: 'Filter', avatar: '📍', x: 300, y: 150, active: true, color: '#10b981' },
        { id: 'topic_economy', name: 'Economy Specialist', type: 'Domain', avatar: '📊', x: 540, y: 50, active: true, color: '#f59e0b' },
        { id: 'topic_politics', name: 'Politics Specialist', type: 'Domain', avatar: '🏛️', x: 540, y: 170, active: true, color: '#8b5cf6' },
        { id: 'topic_weather', name: 'Weather Specialist', type: 'Domain', avatar: '🌤️', x: 540, y: 290, active: true, color: '#06b6d4' },
        { id: 'translator', name: 'Translator Agent', type: 'Localization', avatar: '🔤', x: 780, y: 170, active: true, color: '#ec4899' },
        { id: 'journalist_publisher', name: 'Journalist & Publisher', type: 'Publisher', avatar: '📰', x: 1020, y: 170, active: true, color: '#f43f5e' }
      ],
      connections: [
        { from: 'web_scout', to: 'region_filter' },
        { from: 'region_filter', to: 'topic_economy' },
        { from: 'region_filter', to: 'topic_politics' },
        { from: 'region_filter', to: 'topic_weather' },
        { from: 'topic_economy', to: 'translator' },
        { from: 'topic_politics', to: 'translator' },
        { from: 'topic_weather', to: 'translator' },
        { from: 'translator', to: 'journalist_publisher' }
      ]
    };
  }

  log(data) {
    console.log(`[LangGraph ${data.agentName || 'SYSTEM'}]`, data.message);
    this.broadcast({
      type: 'agent_log',
      payload: data
    });
  }

  updateAgentState(agentId, status, data = null) {
    this.broadcast({
      type: 'agent_state_update',
      payload: {
        agentId,
        status, // 'idle' | 'thinking' | 'completed' | 'error'
        data
      }
    });
  }

  getTopology() {
    return this.agentTopology;
  }

  updateTopology(newTopology) {
    if (newTopology && newTopology.nodes) {
      this.agentTopology = newTopology;
      this.broadcast({
        type: 'topology_updated',
        payload: this.agentTopology
      });
    }
  }

  getLatestArticles() {
    return this.latestArticles;
  }

  async runNewsPipeline({ topic = 'Global Breaking News Today', category = 'all', region = 'Global', language = 'en' }) {
    if (this.isRunning) {
      throw new Error('AI Agent Orchestra pipeline is already running...');
    }

    this.isRunning = true;
    this.broadcast({
      type: 'news_pipeline_started',
      payload: { topic, category, region, language, timestamp: new Date().toISOString() }
    });

    try {
      this.log({
        agentId: 'system',
        agentName: 'LangGraph Engine',
        status: 'dispatching',
        message: `Initializing LangGraph StateGraph pipeline for topic: "${topic}" [Region: ${region}, Language: ${language}]`
      });

      // Build & compile graph with real-time logger callbacks
      const graph = createNewsroomGraph(
        (logData) => this.log(logData),
        (agentId, status, payload) => this.updateAgentState(agentId, status, payload)
      );

      // Invoke LangGraph execution
      const initialInput = {
        topic,
        targetCategory: category,
        targetRegion: region,
        targetLanguage: language
      };

      const finalState = await graph.invoke(initialInput);
      const publishedArticles = finalState.publishedArticles || [];

      // Store in memory
      this.latestArticles = publishedArticles;

      // Broadcast published articles to all connected clients (Reader Portal + Admin Dashboard)
      this.broadcast({
        type: 'news_published',
        payload: {
          articles: publishedArticles,
          topic,
          category,
          region,
          language,
          timestamp: new Date().toISOString()
        }
      });

      this.broadcast({
        type: 'news_pipeline_completed',
        payload: {
          totalArticles: publishedArticles.length,
          timestamp: new Date().toISOString()
        }
      });

      return publishedArticles;
    } catch (err) {
      this.log({
        agentId: 'system',
        agentName: 'LangGraph Engine',
        status: 'error',
        message: `Error executing LangGraph pipeline: ${err.message}`
      });
      this.broadcast({ type: 'news_pipeline_error', payload: err.message });
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}
