import { BaseAgent } from './BaseAgent.js';

export class ResearcherAgent extends BaseAgent {
  constructor() {
    super({
      id: 'researcher',
      name: 'Dr. Marcus Vance',
      role: 'Chief Market Researcher',
      avatar: '📊',
      color: '#10b981',
      audioPitch: 659.25,
      systemInstruction: `You are Dr. Marcus Vance, Chief Market Researcher. Return JSON output with a "humanSummary" field in clear, plain human language.`
    });
  }

  async analyzeMarket(rawIdea, brief, onLog) {
    const prompt = `Conduct market research for location-based dog walking platform:
Brief: ${JSON.stringify(brief)}

Return JSON with schema including "humanSummary":
{
  "tam": "$1.2B",
  "sam": "$85M",
  "som": "$3.5M",
  "competitors": [{"name": "Facebook Groups", "strength": "Free", "weakness": "Unsafe"}],
  "targetAudience": {"demographics": "Expats", "primaryPainPoint": "No time", "willingnessToPay": "High"},
  "locationDensityInsight": "Insight",
  "humanSummary": "Plain-English 2-sentence conversational summary of market findings."
}`;

    return await this.generate({
      prompt,
      jsonMode: true,
      onLog,
      mockResponseHandler: () => ({
        tam: "$1.2B Southeast Asia Pet Care & Services",
        sam: "$85M Vietnam Urban Pet Care Market",
        som: "$3.5M Target Launch (District 2 Thao Dien & District 7 Phu My Hung)",
        competitors: [
          { name: "Unorganized Facebook Groups", strength: "Zero commission fee", weakness: "No location matching, no identity checks, high risk of key theft or pet loss" },
          { name: "Traditional Vet Kennels", strength: "Physical medical facility", weakness: "Requires owner to transport pet; no on-demand walking" },
          { name: "Freelance Local Sitters", strength: "Direct relationship", weakness: "Unreliable availability, no GPS tracking during walk" }
        ],
        targetAudience: {
          demographics: "Condominium pet owners & expats aged 25-42 living in high-density urban areas (District 2, District 7, District 1 HCMC)",
          primaryPainPoint: "Guilt & lack of time for daily 45-min walks; need trusted nearby walkers available within 15 mins",
          willingnessToPay: "High ($8 - $12 USD per 45-minute walk)"
        },
        locationDensityInsight: "Focusing initial deployment within a 3km radius inside Thao Dien yields 84% instant walker match rate due to high dog owner density.",
        humanSummary: "Marcus (Research): 'Good news! HCMC expat hubs like Thao Dien & Phu My Hung are high-density pet zones. Current solutions are unorganized Facebook groups with zero safety checks. Pet owners are eager to pay $8-$12 per walk for verified nearby walkers!'"
      })
    });
  }
}
