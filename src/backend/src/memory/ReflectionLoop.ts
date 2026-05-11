import { v4 as uuidv4 } from 'uuid';
import { Task, TaskResult, MemoryEntry, MemoryType } from '../types.js';
import { MemorySystem } from './MemorySystem.js';

export interface Reflection {
  id: string;
  timestamp: Date;
  type: 'task_review' | 'periodic' | 'skill_creation' | 'optimization';
  summary: string;
  insights: string[];
  actions: ReflectionAction[];
  metrics: ReflectionMetrics;
}

export interface ReflectionAction {
  type: 'create_skill' | 'update_prompt' | 'refine_workflow' | 'adjust_threshold' | 'none';
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'deferred';
}

export interface ReflectionMetrics {
  successRate: number;
  avgTaskDuration: number;
  costEfficiency: number;
  improvementTrend: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'prompt' | 'workflow' | 'tool' | 'template';
  content: unknown;
  effectiveness: number;
  usageCount: number;
  createdAt: Date;
  lastUsed?: Date;
}

export class ReflectionLoop {
  private memory: MemorySystem;
  private skills: Map<string, Skill> = new Map();
  private lastReflection: Date | null = null;
  private reflectionInterval: number = 3600000;
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  constructor(memory: MemorySystem) {
    this.memory = memory;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.interval = setInterval(() => this.cycle(), this.reflectionInterval);
    console.log('🧠 Reflection Loop started');
    await this.initialReflection();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
    console.log('🧠 Reflection Loop stopped');
  }

  private async initialReflection(): Promise<void> {
    await this.performReflection('periodic');
  }

  async onTaskComplete(task: Task, result: TaskResult): Promise<void> {
    await this.memory.store({
      type: 'interaction',
      content: `Task ${task.id} ${result.success ? 'succeeded' : 'failed'}: ${result.metrics.duration}ms`,
      importance: result.success ? 0.3 : 0.8,
      tags: ['task', result.success ? 'success' : 'failure', task.type],
      metadata: { taskId: task.id, result },
    });
  }

  private async cycle(): Promise<void> {
    await this.performReflection('periodic');
  }

  async performReflection(type: Reflection['type'] = 'periodic'): Promise<Reflection> {
    const recentTasks = await this.memory.getRecent('interaction', 100);
    const recentMemories = await this.memory.getRecent(undefined, 50);

    const taskResults = recentTasks
      .filter(m => m.tags.includes('success') || m.tags.includes('failure'))
      .slice(0, 20);

    const successCount = taskResults.filter(m => m.tags.includes('success')).length;
    const totalCount = taskResults.length;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    const avgDuration = taskResults.length > 0
      ? taskResults.reduce((sum, m) => {
          const match = m.content.match(/(\d+)ms/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0) / taskResults.length
      : 0;

    const reflection: Reflection = {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      summary: this.generateSummary(successRate, avgDuration),
      insights: await this.generateInsights(taskResults, recentMemories),
      actions: await this.determineActions(successRate, avgDuration),
      metrics: {
        successRate,
        avgTaskDuration: avgDuration,
        costEfficiency: 0,
        improvementTrend: await this.calculateTrend(),
      },
    };

    await this.memory.store({
      type: 'knowledge',
      content: `Reflection: ${reflection.summary}`,
      importance: 0.7,
      tags: ['reflection', type],
      metadata: { source: 'reflection-loop', reflection },
    });

    this.lastReflection = new Date();

    for (const action of reflection.actions) {
      if (action.priority === 'high' && action.status === 'pending') {
        await this.executeAction(action);
      }
    }

    return reflection;
  }

  private generateSummary(successRate: number, avgDuration: number): string {
    if (successRate >= 90) {
      return `Excellent performance: ${successRate.toFixed(1)}% success rate, ${avgDuration.toFixed(0)}ms avg task duration`;
    } else if (successRate >= 70) {
      return `Good performance: ${successRate.toFixed(1)}% success rate, ${avgDuration.toFixed(0)}ms avg task duration`;
    } else {
      return `Needs improvement: ${successRate.toFixed(1)}% success rate, ${avgDuration.toFixed(0)}ms avg task duration`;
    }
  }

  private async generateInsights(
    taskResults: MemoryEntry[],
    recentMemories: MemoryEntry[]
  ): Promise<string[]> {
    const insights: string[] = [];

    const typeFrequency: Record<string, number> = {};
    for (const task of taskResults) {
      const type = task.tags.find(t => ['research', 'content', 'outreach', 'analysis'].includes(t));
      if (type) typeFrequency[type] = (typeFrequency[type] || 0) + 1;
    }

    const mostCommon = Object.entries(typeFrequency).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      insights.push(`Most frequent task type: ${mostCommon[0]} (${mostCommon[1]} tasks)`);
    }

    const failedTasks = taskResults.filter(m => m.tags.includes('failure'));
    if (failedTasks.length > 5) {
      insights.push(`Elevated failure count: ${failedTasks.length} recent failures - consider reviewing error patterns`);
    }

    const recentTags = recentMemories.flatMap(m => m.tags);
    const uniqueTags = [...new Set(recentTags)];
    if (uniqueTags.length > 20) {
      insights.push(`Memory diversity increasing: ${uniqueTags.length} unique topics tracked`);
    }

    return insights;
  }

  private async determineActions(
    successRate: number,
    avgDuration: number
  ): Promise<ReflectionAction[]> {
    const actions: ReflectionAction[] = [];

    if (successRate < 70) {
      actions.push({
        type: 'adjust_threshold',
        description: 'Lower approval thresholds to catch issues earlier',
        priority: 'high',
        status: 'pending',
      });
    }

    if (avgDuration > 5000) {
      actions.push({
        type: 'refine_workflow',
        description: 'Optimize task execution workflow to reduce latency',
        priority: 'medium',
        status: 'pending',
      });
    }

    if (successRate > 90) {
      actions.push({
        type: 'create_skill',
        description: 'Document successful patterns into reusable skills',
        priority: 'low',
        status: 'pending',
      });
    }

    return actions;
  }

  private async executeAction(action: ReflectionAction): Promise<void> {
    console.log(`🎯 Executing action: ${action.type} - ${action.description}`);

    switch (action.type) {
      case 'create_skill':
        await this.createSkillFromPattern();
        break;
      case 'update_prompt':
        await this.updatePrompts();
        break;
      case 'refine_workflow':
        await this.refineWorkflow();
        break;
    }

    action.status = 'completed';
  }

  private async createSkillFromPattern(): Promise<Skill> {
    const skill: Skill = {
      id: uuidv4(),
      name: `Auto-generated Skill ${Date.now()}`,
      description: 'Created from reflection loop analysis',
      type: 'workflow',
      content: { patterns: [], triggers: [] },
      effectiveness: 0,
      usageCount: 0,
      createdAt: new Date(),
    };

    this.skills.set(skill.id, skill);

    await this.memory.store({
      type: 'skill',
      content: `Created skill: ${skill.name}`,
      importance: 0.6,
      tags: ['skill', 'auto-created'],
      metadata: { skillId: skill.id },
    });

    return skill;
  }

  private async updatePrompts(): Promise<void> {
    await this.memory.store({
      type: 'knowledge',
      content: 'Prompt optimization applied based on reflection analysis',
      importance: 0.5,
      tags: ['optimization', 'prompts'],
      metadata: { source: 'reflection-loop' },
    });
  }

  private async refineWorkflow(): Promise<void> {
    await this.memory.store({
      type: 'knowledge',
      content: 'Workflow refinement applied based on reflection analysis',
      importance: 0.5,
      tags: ['optimization', 'workflow'],
      metadata: { source: 'reflection-loop' },
    });
  }

  private async calculateTrend(): Promise<number> {
    const recent = await this.memory.getRecent('interaction', 50);
    const older = await this.memory.getRecent('interaction', 100);

    const recentSuccess = recent.filter(m => m.tags.includes('success')).length;
    const olderSuccess = older.filter(m => m.tags.includes('success')).length;

    if (olderSuccess === 0) return 0;
    return ((recentSuccess - olderSuccess) / olderSuccess) * 100;
  }

  async getSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  async useSkill(skillId: string, context: unknown): Promise<{ success: boolean; result: unknown }> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { success: false, result: null };
    }

    skill.usageCount++;
    skill.lastUsed = new Date();

    return { success: true, result: skill.content };
  }

  getReflectionHistory(): { lastReflection: Date | null; interval: number } {
    return {
      lastReflection: this.lastReflection,
      interval: this.reflectionInterval,
    };
  }

  setReflectionInterval(intervalMs: number): void {
    this.reflectionInterval = intervalMs;
    if (this.isRunning && this.interval) {
      clearInterval(this.interval);
      this.interval = setInterval(() => this.cycle(), this.reflectionInterval);
    }
  }
}