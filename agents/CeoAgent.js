import { BaseAgent } from './BaseAgent.js';

export class CeoAgent extends BaseAgent {
  constructor() {
    super({
      id: 'ceo',
      name: 'Elena Rostova',
      role: 'CEO & Founder Agent',
      avatar: '👔',
      color: '#3b82f6',
      audioPitch: 523.25,
      systemInstruction: `You are Elena Rostova, CEO Agent of PawPals Connect.
Return output in strictly valid JSON format, including a "humanSummary" field written in clear, natural human language.`
    });
  }

  async createBrief(rawIdea, userLocation, onLog) {
    const prompt = `Analyze this location-based pet walking venture idea: "${rawIdea}".
User Location Context: ${JSON.stringify(userLocation)}

Return JSON matching this schema:
{
  "ventureName": "PawPals Connect",
  "tagline": "Real-time location-based verified dog walking platform",
  "problemStatement": "Dog owners struggle to find trustworthy, nearby dog walkers available within a 1-3km radius.",
  "targetLocationZone": "Primary launch districts and geo-fencing zones",
  "strategicGoal": "Achieve <10 min average walker dispatch time in target location zones.",
  "humanSummary": "Plain-English 2-sentence conversational summary of CEO's mission brief."
}`;

    return await this.generate({
      prompt,
      jsonMode: true,
      onLog,
      mockResponseHandler: () => ({
        ventureName: "PawPals Connect",
        tagline: "Instant Location-Matched Dog Walking Platform for Urban Pet Parents",
        problemStatement: "Busy urban pet owners lack verified, nearby dog walkers who can be dispatched on-demand based on real-time proximity.",
        targetLocationZone: "Hyper-local focus: District 2 (Thao Dien), District 7 (Phu My Hung), and District 1, Ho Chi Minh City.",
        strategicGoal: "Deliver under-10-minute walker arrival by leveraging high-density geo-spatial matching.",
        humanSummary: "CEO Elena: 'Welcome team! Our mission with PawPals Connect is to solve the daily struggle of busy pet owners in HCMC by connecting them with verified nearby dog walkers in under 10 minutes using live GPS location matching.'"
      })
    });
  }

  async synthesizeDeck({ rawIdea, brief, marketData, productData, techData, vcFeedback, userLocation }, onLog) {
    const prompt = `Synthesize all venture components for PawPals Connect into a final polished Pitch Deck.

Return JSON matching this schema:
{
  "deckTitle": "PawPals Connect",
  "vision": "Company Vision for Location-Based Pet Care",
  "marketAnalysis": {
    "tam": "$1.2B SEA Market",
    "sam": "$85M Vietnam Urban Pet Care",
    "som": "$4.5M Target HCMC Hubs",
    "icp": "Ideal Customer Profile",
    "keyCompetitors": ["Competitor A", "Competitor B"]
  },
  "mvpFeatures": [
    {"name": "Feature 1", "description": "Details", "userStory": "As a user..."}
  ],
  "techArchitecture": {
    "stack": ["Tech A", "Tech B"],
    "infrastructure": "Cloud & Location Indexing strategy",
    "complexityScore": "Medium"
  },
  "vcScore": 8.6,
  "riskMitigationStrategy": "Location safety & anti-leakage mitigations",
  "humanSummary": "Plain-English final executive consensus summary."
}`;

    return await this.generate({
      prompt,
      jsonMode: true,
      onLog,
      mockResponseHandler: () => ({
        deckTitle: "PawPals Connect",
        vision: "The On-Demand Uber for Trusted Pet Walking across Southeast Asian Metropolises",
        marketAnalysis: {
          tam: "$1.2B Southeast Asia Pet Care Market",
          sam: "$85M Vietnam Urban Pet Care Market",
          som: "$4.5M High-Density HCMC Expat Hubs",
          icp: "Pet owners aged 25-42 living in high-rise condominiums with limited daily walking time",
          keyCompetitors: ["Unorganized Facebook Expat Groups", "Local Traditional Vet Clinics", "Unverified Freelance Sitters"]
        },
        mvpFeatures: productData.coreFeatures || [
          { name: "Geo-Fence Radar Match", description: "Matches owners with background-checked walkers within 2km radius using live GPS", userStory: "As a pet owner, I want to see nearby available walkers on a live map so I can book immediately." },
          { name: "Live Route & Incident Telemetry", description: "Real-time map trajectory during walk with photo/pee/poop pin drops", userStory: "As a user, I want to track my dog's live GPS route while at work." },
          { name: "Escrow Payment & Safety Guarantee", description: "Payment held in escrow until walk completion with $1,000 pet insurance cover", userStory: "As a user, I want secure auto-payments released only after verifying the walk summary." }
        ],
        techArchitecture: techData.recommendedStack ? techData : {
          stack: ["React Native (Expo)", "Node.js (Fastify)", "Supabase (PostGIS & Realtime)", "Google Maps Geolocation API"],
          infrastructure: "PostGIS spatial index (`ST_DWithin`) with WebSocket telemetry stream",
          complexityScore: "Medium"
        },
        vcScore: vcFeedback.feasibilityScore || 8.6,
        riskMitigationStrategy: vcFeedback.actionableRecommendations ? vcFeedback.actionableRecommendations.join("; ") : "Compulsory pet insurance coverage, GPS spoof detection, and walker loyalty retention incentives.",
        humanSummary: "CEO Elena: 'Final Consensus Reached! We are addressing VC Vance's leakage concerns by bundling complimentary $1,000 pet insurance on every booking and launching exclusively in Thao Dien to dominate neighborhood density.'"
      })
    });
  }
}
