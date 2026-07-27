import { getAiClient, DEFAULT_MODEL } from '../config.js';

export class BaseAgent {
  constructor({ id, name, role, avatar, color, audioPitch, systemInstruction }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.avatar = avatar;
    this.color = color;
    this.audioPitch = audioPitch || 440; // Default A4 tone
    this.systemInstruction = systemInstruction;
  }

  async generate({ prompt, jsonMode = true, mockResponseHandler = null, onLog = () => {} }) {
    onLog({
      agentId: this.id,
      agentName: this.name,
      status: 'thinking',
      message: `${this.name} (${this.role}) is analyzing payload...`
    });

    const ai = getAiClient();

    if (!ai) {
      // Graceful fallback to rich structured mock data if API key is not configured yet
      onLog({
        agentId: this.id,
        agentName: this.name,
        status: 'mock_notice',
        message: 'No GEMINI_API_KEY detected. Running in Demo Simulation Mode...'
      });

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate thinking latency

      if (mockResponseHandler) {
        const mockResult = mockResponseHandler(prompt);
        onLog({
          agentId: this.id,
          agentName: this.name,
          status: 'completed',
          message: `${this.name} finished analysis (Demo Mode).`
        });
        return mockResult;
      }
    }

    try {
      const config = {
        systemInstruction: this.systemInstruction,
      };

      if (jsonMode) {
        config.responseMimeType = 'application/json';
      }

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: config
      });

      const text = response.text;
      
      onLog({
        agentId: this.id,
        agentName: this.name,
        status: 'completed',
        message: `${this.name} successfully generated proposal.`
      });

      if (jsonMode) {
        try {
          return JSON.parse(text);
        } catch (e) {
          // If JSON parse fails, attempt regex extraction
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          return { rawText: text };
        }
      }

      return text;
    } catch (error) {
      onLog({
        agentId: this.id,
        agentName: this.name,
        status: 'error',
        message: `Error in ${this.name}: ${error.message}`
      });

      if (mockResponseHandler) {
        return mockResponseHandler(prompt);
      }
      throw error;
    }
  }
}
