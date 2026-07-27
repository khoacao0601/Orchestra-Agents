import { BaseAgent } from './BaseAgent.js';

export class VcAgent extends BaseAgent {
  constructor() {
    super({
      id: 'vc',
      name: 'Vance Sterling (Devil\'s Advocate)',
      role: 'Skeptical Venture Capitalist',
      avatar: '😈',
      color: '#ef4444',
      audioPitch: 392.00,
      systemInstruction: `You are Vance Sterling, Skeptical VC. Return JSON output with a "humanSummary" field in plain, human language.`
    });
  }

  async auditProposal({ rawIdea, brief, marketData, productData, techData }, onLog) {
    const prompt = `Audit proposal with "humanSummary":
Brief: ${JSON.stringify(brief)}

Return JSON with schema:
{
  "feasibilityScore": 7.8,
  "verdict": "Conditional Approval",
  "harshCritique": "Critique text",
  "topRisks": [{"risk": "Risk", "description": "Desc"}],
  "actionableRecommendations": ["Rec 1"],
  "humanSummary": "Plain-English 2-sentence conversational summary of VC audit."
}`;

    return await this.generate({
      prompt,
      jsonMode: true,
      onLog,
      mockResponseHandler: () => ({
        feasibilityScore: 7.8,
        verdict: "Conditional Approval",
        harshCritique: "Off-platform cash leakage is your biggest threat! Once an owner finds a trustworthy walker 200m away, they will exchange Zalo numbers and pay cash off-platform. You MUST bundle compulsory insurance and walker loyalty rewards to keep transactions on-platform.",
        topRisks: [
          { risk: "Off-Platform Transaction Leakage", description: "Owners & nearby walkers bypass platform after initial location match to avoid commission." },
          { risk: "Third-Party Pet Injury Liability", description: "Traffic accidents during walks without formal insurance coverage." }
        ],
        actionableRecommendations: [
          "Bundle complimentary $1,000 USD pet injury insurance inside every location-verified walk.",
          "Implement Walker Proximity Badging with weekly retention bonuses for high-rating neighborhood walkers."
        ],
        humanSummary: "Vance (VC Advocate): 'Not so fast! Your idea will bleed money because owners and walkers will exchange Zalo numbers to avoid your fee. To survive, you MUST bundle free $1,000 pet insurance into every app walk so users don't dare deal off-platform!'"
      })
    });
  }
}
