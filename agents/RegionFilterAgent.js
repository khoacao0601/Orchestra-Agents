import { BaseAgent } from './BaseAgent.js';

export class RegionFilterAgent extends BaseAgent {
  constructor() {
    super({
      id: 'region_filter',
      name: 'Region Filter Agent',
      role: 'Geographic & Relevance Analyst',
      avatar: '📍',
      color: '#10b981',
      audioPitch: 580,
      systemInstruction: `You are the Region Filter Agent. Your job is to analyze news articles, evaluate their geographic region (Asia-Pacific, Europe, Americas, Middle East, Africa, or Global), check relevance, and assign confidence scores.`
    });
  }

  async filterByRegion(rawArticles, targetRegion = 'Global', onLog = () => {}) {
    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'filtering',
      message: `Analyzing geographic origin and relevance of ${rawArticles.length} raw articles for region: "${targetRegion}"...`
    });

    const prompt = `Input Raw Articles: ${JSON.stringify(rawArticles)}
Target Region Filter: "${targetRegion}"

Task: Assign a region tag (e.g. "Asia-Pacific", "Europe", "Americas", "Middle East", "Global"), location coordinates estimate, relevance score (0-100), and fact-check rating for each article.

Return JSON format:
{
  "filtered": [
    {
      "id": "string",
      "title": "string",
      "snippet": "string",
      "source": "string",
      "publishedAt": "string",
      "regionTag": "string",
      "location": { "country": "string", "city": "string", "lat": number, "lng": number },
      "relevanceScore": number,
      "factCheckRating": "Verified" | "High Confidence" | "Developing"
    }
  ]
}`;

    const mockHandler = () => {
      const regionCoords = {
        'Asia-Pacific': { country: 'Japan & Singapore', city: 'Tokyo / Singapore', lat: 35.6762, lng: 139.6503 },
        'Europe': { country: 'Switzerland & UK', city: 'Geneva / London', lat: 46.2044, lng: 6.1432 },
        'Americas': { country: 'United States', city: 'Washington D.C. / New York', lat: 38.9072, lng: -77.0369 },
        'Global': { country: 'Worldwide', city: 'Global Hub', lat: 20.0, lng: 0.0 }
      };

      const defaultLoc = regionCoords[targetRegion] || regionCoords['Global'];

      const filtered = rawArticles.map((art, i) => ({
        ...art,
        regionTag: targetRegion !== 'Global' ? targetRegion : (i % 2 === 0 ? 'Asia-Pacific' : 'Europe & Americas'),
        location: defaultLoc,
        relevanceScore: 92 + (i * 2) % 8,
        factCheckRating: i % 3 === 0 ? 'Verified' : 'High Confidence'
      }));

      return { filtered };
    };

    const result = await this.generate({
      prompt,
      jsonMode: true,
      mockResponseHandler: mockHandler,
      onLog
    });

    const filtered = result?.filtered || mockHandler().filtered;

    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'completed',
      message: `Region Filter Agent validated ${filtered.length} articles tagged with geographic region data.`
    });

    return filtered;
  }
}
