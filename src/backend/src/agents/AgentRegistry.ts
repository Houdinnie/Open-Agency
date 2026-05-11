import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentType, AgentStatus, AgentConfig, AgentMetrics, Task } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { MarketingAgent } from './MarketingAgent.js';
import { SalesAgent } from './SalesAgent.js';
import { OperationsAgent } from './OperationsAgent.js';
import { FinanceAgent } from './FinanceAgent.js';
import { ResearchAgent } from './ResearchAgent.js';
import { PersonalAssistantAgent } from './PersonalAssistantAgent.js';
import { CEOAgent } from './CEOAgent.js';
import { DesignAgent } from './DesignAgent.js';
import { EvolutionAgent } from './EvolutionAgent.js';
import { RevenueOptimizationAgent } from './RevenueOptimizationAgent.js';

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private metadata: Map<string, Agent> = new Map();
  private memory: MemorySystem | null = null;

  constructor(memory?: MemorySystem) {
    this.memory = memory || null;
  }

  setMemory(memory: MemorySystem): void {
    this.memory = memory;
  }

  initialize(memory: MemorySystem): void {
    this.memory = memory;
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    if (!this.memory) {
      console.warn('AgentRegistry: Memory not initialized, using default initialization');
      return;
    }

    const agentClasses: Array<{ name: string; type: AgentType; capabilities: string[]; class: new (memory: MemorySystem) => BaseAgent }> = [
      { name: 'CEO Agent', type: 'orchestrator', capabilities: ['strategic_planning', 'goal_setting', 'resource_allocation', 'decision_making'], class: CEOAgent },
      { name: 'Marketing Agent', type: 'marketing', capabilities: ['content', 'seo', 'campaigns', 'analytics'], class: MarketingAgent },
      { name: 'Sales Agent', type: 'sales', capabilities: ['lead_gen', 'outreach', 'pipeline', 'followup'], class: SalesAgent },
      { name: 'Operations Agent', type: 'operations', capabilities: ['task_management', 'scheduling', 'automation'], class: OperationsAgent },
      { name: 'Finance Agent', type: 'finance', capabilities: ['expenses', 'invoicing', 'forecasting'], class: FinanceAgent },
      { name: 'Research Agent', type: 'research', capabilities: ['web_scraping', 'analysis', 'monitoring'], class: ResearchAgent },
      { name: 'Personal Assistant', type: 'personal', capabilities: ['calendar', 'reminders', 'notes'], class: PersonalAssistantAgent },
      { name: 'Design Agent', type: 'marketing', capabilities: ['design_systems', 'ui_generation', 'brand_application', 'consistency_audit'], class: DesignAgent },
      { name: 'Evolution Agent', type: 'orchestrator', capabilities: ['experimentation', 'optimization', 'mutation', 'pattern_analysis', 'learning'], class: EvolutionAgent },
      { name: 'Revenue Optimization Agent', type: 'finance', capabilities: ['pricing_analysis', 'price_optimization', 'competitor_tracking', 'experiment_management', 'ltv_calculations'], class: RevenueOptimizationAgent },
    ];

    for (const agentClass of agentClasses) {
      const agent = new agentClass.class(this.memory);
      this.agents.set(agent.id, agent);

      const metadata: Agent = {
        id: agent.id,
        name: agentClass.name,
        type: agentClass.type,
        status: 'idle',
        capabilities: agentClass.capabilities,
        config: agent.getConfig(),
        createdAt: new Date(),
        metrics: {
          tasksCompleted: 0,
          tasksFailed: 0,
          totalExecutionTime: 0,
          averageTaskDuration: 0,
          successRate: 100,
        },
      };

      this.metadata.set(agent.id, metadata);
      agent.initialize().catch(console.error);
    }

    console.log(`🤖 Initialized ${agentClasses.length} agents`);
  }

  register(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    const metadata = agent.getMetadata();
    this.metadata.set(agent.id, metadata);
  }

  get(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getMetadata(id: string): Agent | undefined {
    return this.metadata.get(id);
  }

  getAll(): Agent[] {
    return Array.from(this.metadata.values());
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getByType(type: AgentType): Agent[] {
    return Array.from(this.metadata.values()).filter(a => a.type === type);
  }

  getAgentByType(type: AgentType): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.type === type) {
        return agent;
      }
    }
    return undefined;
  }

  async updateStatus(id: string, status: AgentStatus): Promise<void> {
    const metadata = this.metadata.get(id);
    const agent = this.agents.get(id);
    
    if (metadata) {
      metadata.status = status;
      metadata.lastActiveAt = new Date();
    }
    
    if (agent) {
      agent.setStatus(status === 'error' ? 'error' : status === 'busy' ? 'busy' : 'active');
    }
  }

  async updateMetrics(id: string, success: boolean, duration: number): Promise<void> {
    const metadata = this.metadata.get(id);
    if (metadata) {
      if (success) {
        metadata.metrics.tasksCompleted++;
      } else {
        metadata.metrics.tasksFailed++;
      }
      metadata.metrics.totalExecutionTime += duration;
      const total = metadata.metrics.tasksCompleted + metadata.metrics.tasksFailed;
      metadata.metrics.averageTaskDuration = total > 0 
        ? metadata.metrics.totalExecutionTime / total 
        : 0;
      metadata.metrics.successRate = total > 0 
        ? (metadata.metrics.tasksCompleted / total) * 100 
        : 100;
    }
  }

  async getAvailableAgents(capability?: string): Promise<Agent[]> {
    return Array.from(this.metadata.values()).filter(a => {
      if (a.status === 'disabled' || a.status === 'error') return false;
      if (capability && !a.capabilities.includes(capability)) return false;
      const agent = this.agents.get(a.id);
      if (!agent) return false;
      return agent.getStatus() !== 'busy' || a.config.maxConcurrentTasks > 0;
    });
  }

  getStats() {
    const agents = Array.from(this.metadata.values());
    return {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      busy: agents.filter(a => a.status === 'busy').length,
      idle: agents.filter(a => a.status === 'idle').length,
      error: agents.filter(a => a.status === 'error').length,
    };
  }
}