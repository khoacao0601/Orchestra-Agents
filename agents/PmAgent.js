import { BaseAgent } from './BaseAgent.js';

export class PmAgent extends BaseAgent {
  constructor() {
    super({
      id: 'pm',
      name: 'Sofia Chen',
      role: 'VP of Product Strategy',
      avatar: '💡',
      color: '#ec4899',
      audioPitch: 783.99,
      systemInstruction: `You are Sofia Chen, VP of Product Strategy. Return JSON output with a "humanSummary" field in plain, human language.`
    });
  }

  async defineProduct(rawIdea, brief, marketData, onLog) {
    const prompt = `Define MVP product strategy with "humanSummary":
Brief: ${JSON.stringify(brief)}

Return JSON with schema:
{
  "valueProposition": "Value prop",
  "coreFeatures": [{"name": "Feature", "priority": "P0", "description": "Desc", "userStory": "Story"}],
  "userOnboardingFlow": ["Step 1", "Step 2"],
  "kpis": ["KPI 1"],
  "humanSummary": "Plain-English 2-sentence conversational summary of PM strategy."
}`;

    return await this.generate({
      prompt,
      jsonMode: true,
      onLog,
      mockResponseHandler: () => ({
        valueProposition: "Instant location-matched dog walking by verified neighborhood walkers with live GPS tracking & safety guarantee.",
        coreFeatures: [
          {
            name: "Geo-Fence Radar Matching",
            priority: "P0",
            description: "Detects user location and instantly displays nearby available background-checked walkers within 1-3km.",
            userStory: "As a dog owner, I want to see nearby verified walkers on a live map so I can request a walk in under 2 clicks."
          },
          {
            name: "Real-Time Walk GPS Trajectory & Telemetry",
            priority: "P0",
            description: "Live interactive map showing walk path, pace, distance, and photo check-ins (pee/poop pin drops).",
            userStory: "As a user at work, I want to monitor my dog's live walking route and receive photo updates in real time."
          },
          {
            name: "Verified Identity Shield & Escrow Booking",
            priority: "P0",
            description: "Biometric KYC for walkers with automated payment escrow released only after user sign-off.",
            userStory: "As a user, I want automated escrow payments released only after reviewing the completed walk summary report."
          }
        ],
        userOnboardingFlow: [
          "1. Enable Geolocation Permission & Add Pet Profile",
          "2. View Live Interactive Map with Nearby Available Walkers",
          "3. One-Tap Request with Escrow Hold & Live Tracking"
        ],
        kpis: ["Average Dispatch Time (< 10 mins)", "Location Matching Accuracy Rate (> 98%)"],
        humanSummary: "Sofia (PM): 'I've scoped 3 core MVP features for PawPals: 1) A 1-click Geo-Radar Match showing nearby walkers, 2) Live map trajectory with photo check-ins so owners can see where their dog is peeing/pooping, and 3) Escrow payments that only release money after walk approval.'"
      })
    });
  }
}
