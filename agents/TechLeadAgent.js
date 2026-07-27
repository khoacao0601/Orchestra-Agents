import { BaseAgent } from './BaseAgent.js';

export class TechLeadAgent extends BaseAgent {
  constructor() {
    super({
      id: 'techlead',
      name: 'Alex Rivera',
      role: 'Principal Tech Lead',
      avatar: '🛠️',
      color: '#8b5cf6',
      audioPitch: 880.00,
      systemInstruction: `You are Alex Rivera, Principal Tech Lead. Return JSON output with a "humanSummary" field in plain, human language.`
    });
  }

  async designArchitecture(rawIdea, brief, productData, onLog) {
    const prompt = `Design location-based technical architecture with "humanSummary":
Brief: ${JSON.stringify(brief)}

Return JSON with schema:
{
  "recommendedStack": {"frontend": "React Native", "backend": "Node.js", "database": "Supabase PostGIS", "thirdPartyServices": ["Google Maps"]},
  "architectureHighlights": ["Highlight 1"],
  "technicalChallenges": [{"challenge": "Challenge", "mitigation": "Mitigation"}],
  "estimatedDevTimeWeeks": 5,
  "complexityScore": "Medium",
  "humanSummary": "Plain-English 2-sentence conversational summary of Tech strategy."
}`;

    return await this.generate({
      prompt,
      jsonMode: true,
      onLog,
      mockResponseHandler: () => ({
        recommendedStack: {
          frontend: "React Native (Expo) with Mapbox GL / Google Maps SDK",
          backend: "Node.js (Fastify) with WebSocket location engine",
          database: "Supabase (PostgreSQL with PostGIS extension for ST_DWithin spatial queries)",
          thirdPartyServices: ["Google Maps API", "Stripe/VNPay", "Veriff KYC", "FCM Push Notifications"]
        },
        architectureHighlights: [
          "PostGIS Spatial Index (`ST_DWithin`) for instant sub-second nearby walker discovery",
          "WebSocket Gateway emitting compressed binary GPS location ticks every 5 seconds"
        ],
        technicalChallenges: [
          { challenge: "High mobile battery drain during GPS streaming", mitigation: "Adaptive location polling (5s moving, 30s stationary)." }
        ],
        estimatedDevTimeWeeks: 5,
        complexityScore: "Medium",
        humanSummary: "Alex (Tech): 'Technically, we will build this in React Native and Supabase PostGIS. PostGIS lets us do sub-second location searches for nearby walkers, and we will throttle GPS updates to prevent draining mobile battery!'"
      })
    });
  }
}
