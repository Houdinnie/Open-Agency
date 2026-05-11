import { Task, TaskType, AgentType } from '../types.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';

const TASK_TYPE_MAPPING: Record<TaskType, AgentType[]> = {
  research: ['research'],
  content: ['marketing'],
  outreach: ['sales'],
  analysis: ['research', 'finance'],
  automation: ['operations'],
  approval: ['orchestrator'],
  learning: ['orchestrator'],
  reporting: ['operations', 'marketing'],
};

export class TaskRouter {
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  async route(task: Task): Promise<string | null> {
    const preferredTypes = TASK_TYPE_MAPPING[task.type] || ['operations'];

    for (const agentType of preferredTypes) {
      const agents = this.registry.getByType(agentType);
      const available = agents.find(a => a.status !== 'busy');
      if (available) {
        return available.id;
      }
    }

    const allAvailable = await this.registry.getAvailableAgents();
    if (allAvailable.length > 0) {
      return allAvailable[0].id;
    }

    return null;
  }

  async routeToBest(task: Task): Promise<string | null> {
    const candidates = await this.registry.getAvailableAgents();

    if (candidates.length === 0) {
      return null;
    }

    const scored = candidates.map(agent => {
      let score = 0;

      const preferredTypes = TASK_TYPE_MAPPING[task.type] || [];
      if (preferredTypes.includes(agent.type)) {
        score += 10;
      }

      if (agent.status === 'idle') {
        score += 5;
      }

      if (agent.metrics.successRate > 90) {
        score += 3;
      }

      const avgDuration = agent.metrics.averageTaskDuration;
      if (avgDuration > 0 && avgDuration < task.metadata.context?.expectedDuration) {
        score += 2;
      }

      return { agent, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.agent.id || null;
  }

  getRecommendedType(taskType: TaskType): AgentType[] {
    return TASK_TYPE_MAPPING[taskType] || ['operations'];
  }
}