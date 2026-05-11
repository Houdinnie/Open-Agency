import { Task, TaskPriority } from '../types.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';

interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  queuedTasks: number;
}

interface AllocationDecision {
  taskId: string;
  agentId: string | null;
  priority: number;
  estimatedCost: number;
  roi: number;
  shouldExecute: boolean;
  reason: string;
}

export class ResourceAllocator {
  private registry: AgentRegistry;
  private resourceCap: { cpu: number; memory: number };
  private isLowCostMode = false;
  private taskCosts: Map<string, number> = new Map();
  private taskValues: Map<string, number> = new Map();

  constructor(registry: AgentRegistry) {
    this.registry = registry;
    this.resourceCap = { cpu: 80, memory: 80 };
  }

  setResourceCap(cpu: number, memory: number): void {
    this.resourceCap = { cpu, memory };
  }

  enableLowCostMode(enabled: boolean): void {
    this.isLowCostMode = enabled;
    console.log(`💵 Low cost mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  setTaskCost(taskId: string, cost: number): void {
    this.taskCosts.set(taskId, cost);
  }

  setTaskValue(taskId: string, value: number): void {
    this.taskValues.set(taskId, value);
  }

  estimateTaskCost(task: Task): number {
    const baseCosts: Record<string, number> = {
      research: 0.5,
      content: 1.0,
      outreach: 0.3,
      analysis: 0.8,
      automation: 0.2,
      approval: 0.1,
      learning: 0.4,
      reporting: 0.6,
    };

    const priorityMultipliers: Record<TaskPriority, number> = {
      critical: 1.5,
      high: 1.2,
      medium: 1.0,
      low: 0.8,
    };

    const baseCost = baseCosts[task.type] || 0.5;
    const priorityMult = priorityMultipliers[task.priority];
    const dependencyMult = task.dependencies.length > 0 ? 1.2 : 1;

    return baseCost * priorityMult * dependencyMult;
  }

  estimateTaskValue(task: Task): number {
    const baseValues: Record<string, number> = {
      research: 10,
      content: 15,
      outreach: 20,
      analysis: 25,
      automation: 30,
      approval: 5,
      learning: 20,
      reporting: 15,
    };

    const priorityValues: Record<TaskPriority, number> = {
      critical: 50,
      high: 30,
      medium: 15,
      low: 5,
    };

    const baseValue = baseValues[task.type] || 10;
    const priorityValue = priorityValues[task.priority];

    return baseValue + priorityValue;
  }

  calculateROI(task: Task): number {
    const cost = this.taskCosts.get(task.id) || this.estimateTaskCost(task);
    const value = this.taskValues.get(task.id) || this.estimateTaskValue(task);

    if (cost === 0) return 0;
    return (value - cost) / cost;
  }

  allocate(task: Task, resources: ResourceMetrics): AllocationDecision {
    const estimatedCost = this.estimateTaskCost(task);
    const estimatedValue = this.estimateTaskValue(task);
    const roi = estimatedValue > 0 ? (estimatedValue - estimatedCost) / estimatedCost : 0;

    const priorityScores: Record<TaskPriority, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };

    const priority = priorityScores[task.priority] + (roi > 1 ? 20 : 0);

    let shouldExecute = true;
    let reason = 'Resources available';

    if (this.isLowCostMode && estimatedCost > 0.5) {
      shouldExecute = false;
      reason = 'Low cost mode: task cost too high';
    }

    if (resources.cpuUsage > this.resourceCap.cpu) {
      shouldExecute = false;
      reason = 'CPU usage above threshold';
    }

    if (resources.memoryUsage > this.resourceCap.memory) {
      shouldExecute = false;
      reason = 'Memory usage above threshold';
    }

    if (resources.activeAgents >= this.registry.getAll().length * 0.8) {
      shouldExecute = false;
      reason = 'Too many active agents';
    }

    if (resources.queuedTasks > 50 && task.priority === 'low') {
      shouldExecute = false;
      reason = 'Queue overloaded, low priority task paused';
    }

    const availableAgents = this.registry.getAll().filter(a => a.status !== 'busy');
    const agentId = availableAgents.length > 0 ? availableAgents[0].id : null;

    if (!agentId && shouldExecute) {
      shouldExecute = false;
      reason = 'No available agents';
    }

    return {
      taskId: task.id,
      agentId,
      priority,
      estimatedCost,
      roi,
      shouldExecute,
      reason,
    };
  }

  getResourceUtilization(): {
    cpu: number;
    memory: number;
    agentUtilization: number;
    queueBacklog: number;
    costEfficiency: number;
  } {
    const agents = this.registry.getAll();
    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
    const agentUtilization = agents.length > 0 ? (activeAgents / agents.length) * 100 : 0;

    return {
      cpu: Math.random() * 50 + 20,
      memory: Math.random() * 40 + 30,
      agentUtilization,
      queueBacklog: 0,
      costEfficiency: 85,
    };
  }

  optimizeResourceAllocation(): string[] {
    const suggestions: string[] = [];
    const utilization = this.getResourceUtilization();

    if (utilization.agentUtilization < 30) {
      suggestions.push('Consider reducing active agent count to save resources');
    }

    if (utilization.cpu < 20) {
      suggestions.push('Low CPU usage - good for cost efficiency');
    }

    if (utilization.memory < 25) {
      suggestions.push('Low memory usage - system has headroom');
    }

    if (this.isLowCostMode) {
      suggestions.push('Running in low cost mode - some features may be limited');
    }

    return suggestions;
  }

  getScheduledTasks(tasks: Task[]): { immediate: Task[]; deferred: Task[] } {
    const immediate: Task[] = [];
    const deferred: Task[] = [];

    const now = new Date();
    const hour = now.getHours();

    const isPeakHour = hour >= 9 && hour <= 17;
    const costMultiplier = isPeakHour ? 1.5 : 0.7;

    for (const task of tasks) {
      const cost = this.estimateTaskCost(task);
      
      if (this.isLowCostMode && cost * costMultiplier > 1) {
        deferred.push(task);
      } else {
        immediate.push(task);
      }
    }

    return { immediate, deferred };
  }
}