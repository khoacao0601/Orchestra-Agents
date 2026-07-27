import { BaseAgent } from './BaseAgent.js';

export class TopicSpecialistAgent extends BaseAgent {
  constructor(topicType = 'economy') {
    const configMap = {
      economy: {
        id: 'topic_economy',
        name: 'Economy Specialist Agent',
        role: 'Global Markets & Financial Analyst',
        avatar: '📊',
        color: '#f59e0b',
        audioPitch: 640,
        systemInstruction: `You are the Economy Specialist Agent. You analyze financial trends, macroeconomic policy, energy markets, corporate developments, and supply chains.`
      },
      politics: {
        id: 'topic_politics',
        name: 'Politics Specialist Agent',
        role: 'Geopolitics & International Affairs Analyst',
        avatar: '🏛️',
        color: '#8b5cf6',
        audioPitch: 680,
        systemInstruction: `You are the Politics Specialist Agent. You analyze diplomatic summits, government legislation, bilateral trade pacts, governance, and geopolitical risk.`
      },
      weather: {
        id: 'topic_weather',
        name: 'Weather & Climate Specialist Agent',
        role: 'Meteorology & Climate Science Analyst',
        avatar: '🌤️',
        color: '#06b6d4',
        audioPitch: 720,
        systemInstruction: `You are the Weather & Climate Specialist Agent. You analyze extreme weather phenomena, meteorological forecasts, climate policy, green tech, and natural disaster alerts.`
      }
    };

    const cfg = configMap[topicType] || configMap['economy'];
    super(cfg);
    this.topicType = topicType;
  }

  async analyzeArticles(articles, onLog = () => {}) {
    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'analyzing',
      message: `Analyzing domain context for ${articles.length} articles under specialized topic: "${this.topicType.toUpperCase()}"...`
    });

    const prompt = `Input Articles: ${JSON.stringify(articles)}
Topic Domain: "${this.topicType}"

Task: Deeply analyze each article from a domain expert perspective. Extract key takeaway bullet points, impact level (High / Medium / Critical), market/sector tags, and strategic summary.

Return JSON format:
{
  "analyzedArticles": [
    {
      "id": "string",
      "title": "string",
      "domainCategory": "${this.topicType}",
      "impactLevel": "High" | "Critical" | "Medium",
      "domainInsights": {
        "keyTakeaways": ["string", "string"],
        "expertAnalysis": "string",
        "tags": ["string", "string"]
      }
    }
  ]
}`;

    const mockHandler = () => {
      const analyzedArticles = articles.map((art, i) => {
        let takeaways = [];
        let expertAnalysis = '';
        let tags = [];

        if (this.topicType === 'economy') {
          takeaways = [
            'Central banks synchronize liquidity buffers to stabilize cross-border capital flows.',
            'Tech supply chain expansion boosts regional employment and industrial output by +18%.'
          ];
          expertAnalysis = 'Macroeconomic indicators show resilient capital allocation with reduced inflationary pressures across key trading hubs.';
          tags = ['Macroeconomy', 'Markets', 'Semiconductors', 'Trade'];
        } else if (this.topicType === 'politics') {
          takeaways = [
            'Multilateral agreement establishes clear standards for maritime security and digital trade corridors.',
            'Legislative framework mandates strict audit compliance for institutional automated systems.'
          ];
          expertAnalysis = 'Geopolitical diplomacy demonstrates heightened alignment between major economic blocs regarding digital sovereignty.';
          tags = ['Geopolitics', 'Policy', 'UN', 'International Law'];
        } else {
          takeaways = [
            'Renewable generation capacity reaches historic highs, offsetting thermal fuel dependency.',
            'Early-warning satellite constellation reduces emergency response lead-time by 72 hours.'
          ];
          expertAnalysis = 'Atmospheric data reveals accelerating deployment of clean grid technology alongside improved extreme weather readiness.';
          tags = ['Climate', 'Weather Alert', 'Renewable Energy', 'Satellites'];
        }

        return {
          ...art,
          domainCategory: this.topicType,
          impactLevel: i === 0 ? 'Critical' : 'High',
          domainInsights: {
            keyTakeaways: takeaways,
            expertAnalysis,
            tags
          }
        };
      });

      return { analyzedArticles };
    };

    const result = await this.generate({
      prompt,
      jsonMode: true,
      mockResponseHandler: mockHandler,
      onLog
    });

    const analyzed = result?.analyzedArticles || mockHandler().analyzedArticles;

    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'completed',
      message: `${this.name} completed specialized domain analysis for ${analyzed.length} articles.`
    });

    return analyzed;
  }
}
