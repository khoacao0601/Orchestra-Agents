import { BaseAgent } from './BaseAgent.js';

export class TranslatorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'translator',
      name: 'Translator Agent',
      role: 'Multi-lingual Polyglot Specialist',
      avatar: '🔤',
      color: '#ec4899',
      audioPitch: 760,
      systemInstruction: `You are the Translator Agent. Your job is to accurately translate global news, titles, summaries, and key takeaways into target languages (English, French, Spanish, Japanese, Vietnamese) with natural journalistic fluency.`
    });
  }

  async translateArticles(articles, targetLanguage = 'en', onLog = () => {}) {
    const langMap = {
      en: 'English',
      fr: 'Français (French)',
      es: 'Español (Spanish)',
      ja: '日本語 (Japanese)',
      vi: 'Vietnamese'
    };

    const targetLangName = langMap[targetLanguage] || 'English';

    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'translating',
      message: `Translating ${articles.length} analyzed articles into target language: ${targetLangName}...`
    });

    const prompt = `Input Articles: ${JSON.stringify(articles)}
Target Language: ${targetLangName} (${targetLanguage})

Task: Translate the title, snippet, expert analysis, and key takeaways into ${targetLangName}. Ensure natural tone, high readability, and accurate domain terminology.

Return JSON format:
{
  "translatedArticles": [
    {
      "id": "string",
      "title": "string",
      "snippet": "string",
      "expertAnalysis": "string",
      "keyTakeaways": ["string"],
      "language": "${targetLanguage}"
    }
  ]
}`;

    const mockHandler = () => {
      const translatedArticles = articles.map((art) => {
        const title = art.title;
        const snippet = art.snippet;
        const expertAnalysis = art.domainInsights?.expertAnalysis || art.snippet;
        const keyTakeaways = art.domainInsights?.keyTakeaways || [art.snippet];

        return {
          ...art,
          translatedTitle: title,
          translatedSnippet: snippet,
          translatedExpertAnalysis: expertAnalysis,
          translatedKeyTakeaways: keyTakeaways,
          language: targetLanguage
        };
      });

      return { translatedArticles };
    };

    const result = await this.generate({
      prompt,
      jsonMode: true,
      mockResponseHandler: mockHandler,
      onLog
    });

    const translated = result?.translatedArticles || mockHandler().translatedArticles;

    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'completed',
      message: `Translator Agent successfully localized articles into target language [${targetLanguage}].`
    });

    return translated;
  }
}
