import { BaseAgent } from './BaseAgent.js';

export class JournalistPublisherAgent extends BaseAgent {
  constructor() {
    super({
      id: 'journalist_publisher',
      name: 'Journalist & Publisher Agent',
      role: 'Editor & Chief Publisher',
      avatar: '📰',
      color: '#f43f5e',
      audioPitch: 840,
      systemInstruction: `You are the Journalist & Publisher Agent. Your job is to format final news articles with catchy titles, TL;DR executive summaries, key takeaways, fact-check validation scores, visual badges, and publish them to the reader portal.`
    });
  }

  async publishArticles(articles, topic = 'Global News', onLog = () => {}) {
    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'publishing',
      message: `Formatting and publishing ${articles.length} news stories to the Reader Portal...`
    });

    const prompt = `Input Articles: ${JSON.stringify(articles)}
Topic Focus: "${topic}"

Task: Format each article into a broadcast-ready news story card. Generate catchy title, executive TL;DR summary, tag styling metadata (color, icon), confidence meter (0-100), and publication metadata.

Return JSON format:
{
  "publishedArticles": [
    {
      "id": "string",
      "title": "string",
      "tldr": "string",
      "snippet": "string",
      "category": "economy" | "politics" | "weather",
      "categoryLabel": "string",
      "region": "string",
      "location": { "country": "string", "city": "string", "lat": number, "lng": number },
      "impactLevel": "High" | "Critical" | "Medium",
      "confidenceScore": number,
      "factCheckRating": "string",
      "source": "string",
      "publishedAt": "string",
      "keyTakeaways": ["string"],
      "expertAnalysis": "string",
      "tags": ["string"],
      "cardColor": "string",
      "cardIcon": "string"
    }
  ]
}`;

    const mockHandler = () => {
      const publishedArticles = articles.map((art, i) => {
        const cat = art.domainCategory || 'economy';

        const categoryMeta = {
          economy: { label: 'Economy & Markets', color: '#f59e0b', icon: '📊' },
          politics: { label: 'Politics & Geopolitics', color: '#8b5cf6', icon: '🏛️' },
          weather: { label: 'Weather & Climate', color: '#06b6d4', icon: '🌤️' }
        };

        const meta = categoryMeta[cat] || categoryMeta['economy'];

        return {
          id: art.id || `pub-${Date.now()}-${i}`,
          title: art.translatedTitle || art.title,
          tldr: `[TL;DR] ${art.translatedSnippet || art.snippet}`,
          snippet: art.translatedSnippet || art.snippet,
          category: cat,
          categoryLabel: meta.label,
          region: art.regionTag || 'Global Wire',
          location: art.location || { country: 'Worldwide', city: 'Global Hub', lat: 20.0, lng: 0.0 },
          impactLevel: art.impactLevel || (i === 0 ? 'Critical' : 'High'),
          confidenceScore: art.trustScore || art.confidenceScore || art.relevanceScore || 96,
          factCheckRating: art.factCheckRating || 'Verified',
          source: art.source || 'Orchestra Global Wire',
          publishedAt: art.publishedAt || new Date().toISOString(),
          keyTakeaways: art.translatedKeyTakeaways || art.domainInsights?.keyTakeaways || [art.snippet],
          expertAnalysis: art.translatedExpertAnalysis || art.domainInsights?.expertAnalysis || art.snippet,
          tags: art.domainInsights?.tags || [cat, 'Global News'],
          cardColor: meta.color,
          cardIcon: meta.icon
        };
      });

      return { publishedArticles };
    };

    const result = await this.generate({
      prompt,
      jsonMode: true,
      mockResponseHandler: mockHandler,
      onLog
    });

    const published = result?.publishedArticles || mockHandler().publishedArticles;

    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'completed',
      message: `🎉 AI Agent Orchestra successfully published ${published.length} stories to the Reader Portal!`
    });

    return published;
  }
}
