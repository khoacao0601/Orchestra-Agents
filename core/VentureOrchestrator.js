import { CeoAgent } from '../agents/CeoAgent.js';
import { ResearcherAgent } from '../agents/ResearcherAgent.js';
import { PmAgent } from '../agents/PmAgent.js';
import { TechLeadAgent } from '../agents/TechLeadAgent.js';
import { VcAgent } from '../agents/VcAgent.js';

export class VentureOrchestrator {
  constructor(broadcastCallback = () => {}) {
    this.broadcast = broadcastCallback;
    this.ceo = new CeoAgent();
    this.researcher = new ResearcherAgent();
    this.pm = new PmAgent();
    this.techLead = new TechLeadAgent();
    this.vc = new VcAgent();
    
    this.isRunning = false;
  }

  log(data) {
    console.log(`[${data.agentName || 'SYSTEM'}]`, data.message);
    this.broadcast({
      type: 'agent_log',
      payload: data
    });
  }

  updateAgentState(agentId, status, payload = null) {
    this.broadcast({
      type: 'agent_state_update',
      payload: {
        agentId,
        status, // 'idle' | 'thinking' | 'talking' | 'completed' | 'error'
        data: payload
      }
    });
  }

  async runPipeline(rawIdea) {
    if (this.isRunning) {
      throw new Error('An orchestrator pipeline is already in progress.');
    }

    this.isRunning = true;
    this.broadcast({ type: 'venture_started', payload: { rawIdea, timestamp: new Date().toISOString() } });

    try {
      // Step 1: CEO Creates Brief
      this.updateAgentState('ceo', 'thinking');
      this.log({ agentId: 'ceo', agentName: this.ceo.name, status: 'started', message: 'Analyzing raw pitch and formulating strategic brief...' });
      const brief = await this.ceo.createBrief(rawIdea, (l) => this.log(l));
      this.updateAgentState('ceo', 'completed', brief);
      this.broadcast({ type: 'brief_ready', payload: brief });

      // Step 2: Parallel Research & Product & Tech Analysis
      this.log({ agentId: 'system', agentName: 'Orchestrator', status: 'dispatching', message: 'Delegating tasks to Specialist Agents (Researcher, PM, Tech Lead)...' });
      
      this.updateAgentState('researcher', 'thinking');
      this.updateAgentState('pm', 'thinking');
      this.updateAgentState('techlead', 'thinking');

      const [marketData, productData, techData] = await Promise.all([
        this.researcher.analyzeMarket(rawIdea, brief, (l) => this.log(l)),
        this.pm.defineProduct(rawIdea, brief, {}, (l) => this.log(l)),
        this.techLead.designArchitecture(rawIdea, brief, {}, (l) => this.log(l))
      ]);

      this.updateAgentState('researcher', 'completed', marketData);
      this.updateAgentState('pm', 'completed', productData);
      this.updateAgentState('techlead', 'completed', techData);

      this.broadcast({
        type: 'specialists_completed',
        payload: { marketData, productData, techData }
      });

      // Step 3: Devil's Advocate VC Audit
      this.log({ agentId: 'vc', agentName: this.vc.name, status: 'auditing', message: 'Submitting proposal to VC Agent for rigorous critique...' });
      this.updateAgentState('vc', 'thinking');
      
      const vcFeedback = await this.vc.auditProposal({
        rawIdea,
        brief,
        marketData,
        productData,
        techData
      }, (l) => this.log(l));

      this.updateAgentState('vc', 'completed', vcFeedback);
      this.broadcast({ type: 'vc_audit_ready', payload: vcFeedback });

      // Step 4: CEO Synthesizes Final Pitch Deck with Risk Mitigations
      this.log({ agentId: 'ceo', agentName: this.ceo.name, status: 'synthesizing', message: 'Refining venture strategy based on VC feedback and building final Pitch Deck...' });
      this.updateAgentState('ceo', 'thinking');

      const finalDeck = await this.ceo.synthesizeDeck({
        rawIdea,
        brief,
        marketData,
        productData,
        techData,
        vcFeedback
      }, (l) => this.log(l));

      this.updateAgentState('ceo', 'completed', finalDeck);

      this.broadcast({
        type: 'venture_completed',
        payload: {
          brief,
          marketData,
          productData,
          techData,
          vcFeedback,
          finalDeck
        }
      });

      return finalDeck;
    } catch (err) {
      this.log({ agentId: 'system', agentName: 'Orchestrator', status: 'error', message: `Pipeline execution error: ${err.message}` });
      this.broadcast({ type: 'venture_error', payload: err.message });
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}
