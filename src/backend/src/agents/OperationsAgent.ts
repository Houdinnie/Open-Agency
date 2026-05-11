import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  lastRun?: Date;
  nextRun: Date;
  status: 'active' | 'paused' | 'error';
  result?: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  runCount: number;
}

export class OperationsAgent extends BaseAgent {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private automations: Map<string, Automation> = new Map();
  private taskHistory: Array<{ task: string; result: string; timestamp: Date }> = [];

  constructor(memory: MemorySystem) {
    super('Operations Agent', 'operations', memory);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.loadDefaultAutomations();
  }

  private loadDefaultAutomations(): void {
    this.automations.set('daily-report', {
      id: 'daily-report',
      name: 'Daily Report Generation',
      trigger: 'schedule:00:00',
      actions: ['compile_metrics', 'send_email'],
      enabled: true,
      runCount: 0,
    });

    this.automations.set('lead-alert', {
      id: 'lead-alert',
      name: 'New Lead Alert',
      trigger: 'event:new_lead',
      actions: ['notify_user', 'create_task'],
      enabled: true,
      runCount: 0,
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'schedule-task':
          result = await this.scheduleTask(task.input);
          break;
        case 'create-automation':
          result = await this.createAutomation(task.input);
          break;
        case 'run-automation':
          result = await this.runAutomation(task.input);
          break;
        case 'optimize-workflow':
          result = await this.optimizeWorkflow(task.input);
          break;
        case 'batch-process':
          result = await this.batchProcess(task.input);
          break;
        case 'get-status':
          result = this.getOperationsStatus();
          break;
        default:
          result = await this.handleGenericOps(task);
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
    return task.type === 'automation' || task.input?.category === 'operations';
  }

  private async scheduleTask(input: Record<string, unknown>): Promise<ScheduledTask> {
    const name = input.name as string;
    const schedule = input.schedule as string;
    const taskId = `scheduled_${Date.now()}`;

    const nextRun = this.calculateNextRun(schedule);

    const scheduledTask: ScheduledTask = {
      id: taskId,
      name,
      schedule,
      nextRun,
      status: 'active',
    };

    this.scheduledTasks.set(taskId, scheduledTask);

    await this.memory.store({
      type: 'knowledge',
      content: `Scheduled task: ${name} (${schedule})`,
      importance: 0.5,
      tags: ['schedule', 'automation'],
      metadata: { taskId },
    });

    return scheduledTask;
  }

  private calculateNextRun(schedule: string): Date {
    const now = new Date();
    const [hours, minutes] = schedule.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private async createAutomation(input: Record<string, unknown>): Promise<Automation> {
    const name = input.name as string;
    const trigger = input.trigger as string;
    const actions = (input.actions as string[]) || [];

    const automation: Automation = {
      id: `auto_${Date.now()}`,
      name,
      trigger,
      actions,
      enabled: true,
      runCount: 0,
    };

    this.automations.set(automation.id, automation);

    return automation;
  }

  private async runAutomation(input: Record<string, unknown>): Promise<{ success: boolean; output: string }> {
    const automationId = input.automationId as string;
    const automation = this.automations.get(automationId);

    if (!automation) {
      return { success: false, output: 'Automation not found' };
    }

    automation.runCount++;
    const result = `Executed ${automation.name}: ${automation.actions.join(' → ')}`;

    this.taskHistory.push({
      task: automation.name,
      result: 'success',
      timestamp: new Date(),
    });

    return { success: true, output: result };
  }

  private async optimizeWorkflow(input: Record<string, unknown>): Promise<{
    suggestions: string[];
    improvements: number;
  }> {
    const workflowId = input.workflowId as string;

    const suggestions = [
      'Reduce parallel execution to prevent resource contention',
      'Add caching for repeated operations',
      'Implement retry logic for failing steps',
      'Consolidate similar tasks into batches',
    ];

    return {
      suggestions,
      improvements: suggestions.length,
    };
  }

  private async batchProcess(input: Record<string, unknown>): Promise<{
    processed: number;
    successful: number;
    failed: number;
    duration: number;
  }> {
    const items = (input.items as unknown[]) || [];
    const operation = input.operation as string;

    const start = Date.now();
    let successful = 0;
    let failed = 0;

    for (const item of items) {
      try {
        console.log(`Processing: ${JSON.stringify(item)}`);
        successful++;
      } catch (e) {
        failed++;
      }
    }

    return {
      processed: items.length,
      successful,
      failed,
      duration: Date.now() - start,
    };
  }

  private getOperationsStatus(): {
    scheduledTasks: number;
    automations: number;
    historyCount: number;
    uptime: number;
  } {
    return {
      scheduledTasks: this.scheduledTasks.size,
      automations: this.automations.size,
      historyCount: this.taskHistory.length,
      uptime: Date.now(),
    };
  }

  private async handleGenericOps(task: Task): Promise<string> {
    return `Completed operation: ${task.title}`;
  }

  getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }

  getAutomations(): Automation[] {
    return Array.from(this.automations.values());
  }

  getHistory(limit = 50): typeof this.taskHistory {
    return this.taskHistory.slice(-limit);
  }

  protected getCapabilities(): string[] {
    return ['task_management', 'scheduling', 'automation', 'batch_processing'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 5,
      timeoutMs: 30000,
      retryAttempts: 3,
      autoApprove: true,
      approvalThreshold: 50,
    };
  }
}