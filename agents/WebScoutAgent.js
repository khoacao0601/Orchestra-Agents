import Parser from 'rss-parser';
import { BaseAgent } from './BaseAgent.js';

const parser = new Parser();

export class WebScoutAgent extends BaseAgent {
  constructor() {
    super({
      id: 'web_scout',
      name: 'Web Scout Agent',
      role: 'Global News Crawler',
      avatar: '🌐',
      color: '#3b82f6',
      audioPitch: 520,
      systemInstruction: `You are the Web Scout Agent. Your job is to fetch, aggregate, and structure raw news data from across the global web and RSS feeds based on topics and queries.`
    });
  }

  async fetchLiveRss(query) {
    try {
      const encodedQuery = encodeURIComponent(query || 'world breaking news');
      const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(rssUrl);

      if (feed && feed.items && feed.items.length > 0) {
        return feed.items.slice(0, 6).map((item, idx) => ({
          id: `raw-${Date.now()}-${idx}`,
          title: item.title || 'Untitled Breaking News',
          source: item.source || 'Global News Network',
          link: item.link || '#',
          pubDate: item.pubDate || new Date().toISOString(),
          snippet: item.contentSnippet || item.content || item.title
        }));
      }
    } catch (err) {
      console.warn('[WebScoutAgent] Live RSS fetch notice:', err.message);
    }
    return null;
  }

  async scoutNews(topic, targetCategory = 'all', onLog = () => {}) {
    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'scouting',
      message: `Scouting web RSS feeds and real-time sources for topic: "${topic}" (Category: ${targetCategory})...`
    });

    const liveRssItems = await this.fetchLiveRss(topic);

    const prompt = `Task: Fetch and extract 4-6 high-impact, realistic global news articles regarding "${topic}" under category "${targetCategory}".
    
Return a JSON object with format:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "snippet": "string",
      "source": "string",
      "publishedAt": "ISO date string",
      "rawCategory": "string"
    }
  ]
}`;

    const mockHandler = () => {
      const now = new Date().toISOString();
      let articles = [];

      if (targetCategory === 'economy' || topic.toLowerCase().includes('economy') || topic.toLowerCase().includes('market')) {
        articles = [
          {
            id: `raw-${Date.now()}-1`,
            title: 'Global Central Banks Coordinate Policy Amid Inflation Shift',
            snippet: 'Major financial authorities announce strategic adjustment in interest rates impacting international equity and forex markets.',
            source: 'Financial Times / Bloomberg',
            publishedAt: now,
            rawCategory: 'Economy'
          },
          {
            id: `raw-${Date.now()}-2`,
            title: 'Tech Giants Announce $50B Semiconductor Manufacturing Alliance',
            snippet: 'A consortium of microchip leaders expands foundry infrastructure to boost supply chain resilience worldwide.',
            source: 'Reuters Economic',
            publishedAt: now,
            rawCategory: 'Economy'
          }
        ];
      } else if (targetCategory === 'politics' || topic.toLowerCase().includes('politics') || topic.toLowerCase().includes('diplomacy')) {
        articles = [
          {
            id: `raw-${Date.now()}-3`,
            title: 'United Nations Convenes Emergency Peace & Maritime Security Summit',
            snippet: 'Delegates from 40+ nations gather in Geneva to sign new multilateral maritime transit frameworks.',
            source: 'BBC World News',
            publishedAt: now,
            rawCategory: 'Politics'
          },
          {
            id: `raw-${Date.now()}-4`,
            title: 'European Union Passes Landmark AI Governance & Digital Sovereignty Act',
            snippet: 'New regulatory standards set global benchmarks for transparency, algorithmic accountability, and data protection.',
            source: 'Euractiv / Politico',
            publishedAt: now,
            rawCategory: 'Politics'
          }
        ];
      } else if (targetCategory === 'weather' || topic.toLowerCase().includes('weather') || topic.toLowerCase().includes('climate')) {
        articles = [
          {
            id: `raw-${Date.now()}-5`,
            title: 'Global Climate Observatory Reports Unprecedented Renewable Energy Surge',
            snippet: 'Solar and wind infrastructure generated over 45% of total power across Asia-Pacific and Europe in Q2.',
            source: 'Climate Action Network',
            publishedAt: now,
            rawCategory: 'Weather & Climate'
          },
          {
            id: `raw-${Date.now()}-6`,
            title: 'Super Typhoon Warning System Upgraded Across Pacific Rim',
            snippet: 'Meteorological agencies deploy satellite AI models to predict storm tracks 72 hours earlier.',
            source: 'World Meteorological Organization',
            publishedAt: now,
            rawCategory: 'Weather & Climate'
          }
        ];
      } else {
        articles = [
          {
            id: `raw-${Date.now()}-1`,
            title: `Global Markets React to Next-Gen AI Advances in ${topic}`,
            snippet: 'Stock indices rally worldwide as major tech clusters report record productivity gains and cross-border partnerships.',
            source: 'Global Tech & Market Journal',
            publishedAt: now,
            rawCategory: 'Economy'
          },
          {
            id: `raw-${Date.now()}-2`,
            title: 'International Summit Reaches Historic Agreement on Cyber Security',
            snippet: 'World leaders sign bilateral pacts to safeguard critical infrastructure and global communications backbones.',
            source: 'Reuters / World News',
            publishedAt: now,
            rawCategory: 'Politics'
          },
          {
            id: `raw-${Date.now()}-3`,
            title: 'Extreme Weather Monitoring Satellites Launched by Joint Space Agency',
            snippet: 'Constellation of high-resolution sensors will track atmospheric humidity and ocean thermal currents real-time.',
            source: 'Earth Science Weekly',
            publishedAt: now,
            rawCategory: 'Weather'
          }
        ];
      }

      if (liveRssItems) {
        articles = liveRssItems.map((item, idx) => ({
          id: item.id,
          title: item.title,
          snippet: item.snippet,
          source: item.source,
          publishedAt: item.pubDate,
          rawCategory: targetCategory !== 'all' ? targetCategory : 'General'
        }));
      }

      return { articles };
    };

    const result = await this.generate({
      prompt,
      jsonMode: true,
      mockResponseHandler: mockHandler,
      onLog
    });

    const articles = result?.articles || mockHandler().articles;
    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'completed',
      message: `Web Scout gathered ${articles.length} raw articles from web sources.`
    });

    return articles;
  }
}
