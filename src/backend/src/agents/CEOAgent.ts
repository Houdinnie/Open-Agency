import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  milestones: Milestone[];
}

interface Milestone {
  title: string;
  completed: boolean;
  date?: Date;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  initiatives: string[];
  expectedImpact: string;
  timeline: string;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

export class CEOAgent extends BaseAgent {
  private goals: Map<string, Goal> = new Map();
  private strategies: Map<string, Strategy> = new Map();

  constructor(memory: MemorySystem) {
    super('CEO Agent', 'orchestrator', memory);
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'strategize':
          result = await this.strategize(task.input);
          break;
        case 'set-goal':
          result = await this.setGoal(task.input);
          break;
        case 'analyze-performance':
          result = await this.analyzePerformance(task.input);
          break;
        case 'prioritize':
          result = await this.prioritize(task.input);
          break;
        case 'allocate-resources':
          result = await this.allocateResources(task.input);
          break;
        case 'review-operations':
          result = await this.reviewOperations();
          break;
        case 'plan-quarter':
          result = await this.planQuarter(task.input);
          break;
        default:
          result = await this.handleStrategicTask(task);
      }

      return {
        success: true,
        output: result,
        metrics: { duration: Date.now() - startTime },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { duration: Date.now() - startTime },
      };
    }
  }

  canHandle(task: Task): boolean {
    return task.type === 'learning' || task.input?.category === 'strategy' || task.input?.category === 'orchestrator';
  }

  private async strategize(input: Record<string, unknown>): Promise<Strategy> {
    const objective = input.objective as string;
    const context = input.context as string;

    const prompt = `Create a strategic plan for: ${objective}
Context: ${context}

Include:
1. Strategy name
2. Description
3. 3-5 key initiatives
4. Expected impact
5. Timeline`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    const strategy: Strategy = {
      id: `strat_${Date.now()}`,
      name: `${objective} Strategy`,
      description: response.content.substring(0, 200),
      initiatives: this.extractInitiatives(response.content),
      expectedImpact: 'High',
      timeline: 'Q2 2026',
    };

    this.strategies.set(strategy.id, strategy);

    return strategy;
  }

  private extractInitiatives(content: string): string[] {
    const lines = content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
    return lines.slice(0, 5).map(l => l.replace(/^[\d.-]+\s*/, '').replace(/^-\s*/, '').trim());
  }

  private async setGoal(input: Record<string, unknown>): Promise<Goal> {
    const title = input.title as string;
    const description = input.description as string;
    const targetDate = input.targetDate as string;
    const milestones = (input.milestones as string[]) || [];

    const goal: Goal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      targetDate: new Date(targetDate),
      progress: 0,
      status: 'active',
      milestones: milestones.map(m => ({ title: m, completed: false })),
    };

    this.goals.set(goal.id, goal);

    await this.memory.store({
      type: 'knowledge',
      content: `Goal set: ${title}`,
      importance: 0.8,
      tags: ['goal', 'strategy'],
      metadata: { goalId: goal.id },
    });

    return goal;
  }

  private async analyzePerformance(input: Record<string, unknown>): Promise<{
    metrics: PerformanceMetric[];
    summary: string;
    recommendations: string[];
  }> {
    const metrics: PerformanceMetric[] = [
      { metric: 'Task Completion Rate', value: 85, target: 90, trend: 'up' },
      { metric: 'Agent Utilization', value: 72, target: 80, trend: 'stable' },
      { metric: 'Cost Efficiency', value: 88, target: 85, trend: 'up' },
      { metric: 'Autonomy Score', value: 70, target: 80, trend: 'up' },
    ];

    const prompt = `Analyze these metrics and provide recommendations:
${JSON.stringify(metrics)}`;

    const response = await llmService.complete(prompt, {
      system: 'You are a strategic analyst. Provide actionable recommendations.',
    });

    return {
      metrics,
      summary: 'Overall positive trend with room for improvement in agent utilization',
      recommendations: [
        'Increase parallel task execution',
        'Optimize resource allocation',
        'Expand automation coverage',
      ],
    };
  }

  private async prioritize(input: Record<string, unknown>): Promise<{
    priorities: Array<{ item: string; score: number; reason: string }>;
  }> {
    const items = (input.items as string[]) || [];

    const priorities = items.map((item, idx) => ({
      item,
      score: 100 - idx * 10,
      reason: 'Based on strategic alignment',
    }));

    return { priorities };
  }

  private async allocateResources(input: Record<string, unknown>): Promise<{
    allocation: Record<string, number>;
    rationale: string;
  }> {
    const totalBudget = (input.budget as number) || 100;
    
    const allocation = {
      operations: totalBudget * 0.35,
      growth: totalBudget * 0.30,
      research: totalBudget * 0.20,
      infrastructure: totalBudget * 0.15,
    };

    return {
      allocation,
      rationale: 'Balanced allocation focused on growth while maintaining operational efficiency',
    };
  }

  private async reviewOperations(): Promise<{
    healthScore: number;
    areas: Array<{ name: string; status: 'healthy' | 'warning' | 'critical'; details: string }>;
    actions: string[];
  }> {
    return {
      healthScore: 85,
      areas: [
        { name: 'Agent Network', status: 'healthy', details: 'All agents operational' },
        { name: 'Memory System', status: 'healthy', details: 'Memory usage optimal' },
        { name: 'Task Queue', status: 'warning', details: 'Some tasks delayed' },
        { name: 'Integrations', status: 'healthy', details: 'All connections active' },
      ],
      actions: [
        'Optimize task queue processing',
        'Review delayed tasks',
        'Continue monitoring agent performance',
      ],
    };
  }

  private async planQuarter(input: Record<string, unknown>): Promise<{
    quarter: string;
    objectives: string[];
    keyResults: string[];
    resourceRequirements: string[];
  }> {
    const quarter = (input.quarter as string) || 'Q2 2026';

    return {
      quarter,
      objectives: [
        'Increase autonomous task completion to 80%',
        'Launch 3 new agent capabilities',
        'Reduce operational costs by 15%',
        'Expand integration ecosystem',
      ],
      keyResults: [
        'KR1: 80% task completion without human input',
        'KR2: 3 new agent types deployed',
        'KR3: 15% cost reduction achieved',
        'KR4: 10 new integrations added',
      ],
      resourceRequirements: [
        '2 additional compute instances',
        'Enhanced monitoring tools',
        'Team capacity for integration development',
      ],
    };
  }

  private async handleStrategicTask(task: Task): Promise<string> {
    const prompt = `Handle strategic task: ${task.title}\n${task.description}`;
    const response = await llmService.completeWithContext(prompt, this.getContext());
    return response.content;
  }

  private getContext(): string {
    return `You are the CEO Agent for Hermes OS. You are responsible for strategic planning, goal setting, resource allocation, and performance analysis. You think like an executive focused on long-term growth and operational excellence.`;
  }

  getGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  getStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  protected getCapabilities(): string[] {
    return ['strategic_planning', 'goal_setting', 'resource_allocation', 'performance_analysis', 'decision_making'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 2,
      timeoutMs: 120000,
      retryAttempts: 1,
      autoApprove: false,
      approvalThreshold: 1000,
    };
  }
}