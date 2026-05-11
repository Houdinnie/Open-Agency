import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, TaskType } from '../types.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import { TaskRouter } from './TaskRouter.js';

interface TaskQueueItem {
  task: Task;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

export class AgentOrchestrator {
  private memory: MemorySystem;
  private registry: AgentRegistry;
  private router: TaskRouter;
  private pendingTasks: Map<string, TaskQueueItem> = new Map();
  private taskQueue: Task[] = [];
  private running = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(memory: MemorySystem, registry: AgentRegistry, router: TaskRouter) {
    this.memory = memory;
    this.registry = router instanceof TaskRouter ? router : new TaskRouter(registry);
    this.registry = registry;
  }

  async start(): Promise<void> {
    this.running = true;
    this.pollInterval = setInterval(() => this.processQueue(), 1000);
    console.log('🎯 Atlas Orchestrator started');
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    console.log('🎯 Atlas Orchestrator stopped');
  }

  async createTask(
    title: string,
    description: string,
    type: TaskType,
    priority: TaskPriority,
    input: Record<string, unknown> = {}
  ): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type,
      priority,
      status: 'pending',
      title,
      description,
      input,
      dependencies: [],
      createdAt: new Date(),
      metadata: {
        source: 'user',
        requiresApproval: this.requiresApproval(input),
      },
    };

    this.taskQueue.push(task);
    this.sortQueue();

    await this.memory.store({
      type: 'interaction',
      content: `Task created: ${title}`,
      importance: 0.4,
      tags: ['task', 'created'],
      metadata: { source: 'orchestrator', taskId: task.id },
    });

    return task;
  }

  private requiresApproval(input: Record<string, unknown>): boolean {
    const spending = input.spending as number;
    return typeof spending === 'number' && spending > 500;
  }

  private sortQueue(): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    this.taskQueue.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    const task = this.taskQueue.find(t => t.status === 'pending' && this.canExecute(t));
    if (!task) return;

    const agentId = await this.router.routeToBest(task);
    if (!agentId) return;

    await this.executeTask(task, agentId);
  }

  private canExecute(task: Task): boolean {
    return task.dependencies.every(depId => {
      const dep = [...this.taskQueue].find(t => t.id === depId);
      return dep?.status === 'completed';
    });
  }

  private async executeTask(task: Task, agentId: string): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    task.assignedTo = agentId;

    const agent = this.registry.get(agentId);
    if (!agent) {
      task.status = 'failed';
      task.error = 'Agent not found';
      return;
    }

    try {
      agent.setStatus('busy');
      const result = await agent.execute(task);

      task.status = result.success ? 'completed' : 'failed';
      task.completedAt = new Date();
      task.result = result;

      await this.registry.updateMetrics(agentId, result.success, result.metrics.duration);
      await agent.onTaskComplete(task, result);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();

      await agent.onTaskError(task, error instanceof Error ? error : new Error(String(error)));
    } finally {
      agent.setStatus('active');
    }
  }

  async getTask(id: string): Promise<Task | null> {
    return this.taskQueue.find(t => t.id === id) || null;
  }

  async getTasks(filter?: Partial<TaskStatus>): Promise<Task[]> {
    if (!filter) return this.taskQueue;
    return this.taskQueue.filter(t => t.status === filter);
  }

  async cancelTask(id: string): Promise<boolean> {
    const task = this.taskQueue.find(t => t.id === id);
    if (!task || task.status === 'completed' || task.status === 'running') {
      return false;
    }
    task.status = 'cancelled';
    return true;
  }

  async getStats(): Promise<{
    totalTasks: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    agentStats: ReturnType<AgentRegistry['getStats']>;
  }> {
    return {
      totalTasks: this.taskQueue.length,
      pending: this.taskQueue.filter(t => t.status === 'pending').length,
      running: this.taskQueue.filter(t => t.status === 'running').length,
      completed: this.taskQueue.filter(t => t.status === 'completed').length,
      failed: this.taskQueue.filter(t => t.status === 'failed').length,
      agentStats: this.registry.getStats(),
    };
  }

  async runScheduledTasks(): Promise<void> {
    const now = new Date();
    const scheduled = this.taskQueue.filter(
      t => t.metadata.context?.scheduledAt &&
        new Date(t.metadata.context.scheduledAt as string) <= now &&
        t.status === 'pending'
    );

    for (const task of scheduled) {
      this.taskQueue.push(task);
    }
  }
}