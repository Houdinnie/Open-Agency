import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentType, Task, TaskResult } from '../types.js';
import { MemorySystem } from '../memory/MemorySystem.js';

export abstract class BaseAgent {
  id: string;
  name: string;
  type: AgentType;
  protected memory: MemorySystem;
  protected status: 'idle' | 'active' | 'busy' | 'error' = 'idle';

  constructor(name: string, type: AgentType, memory: MemorySystem) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.memory = memory;
  }

  abstract execute(task: Task): Promise<TaskResult>;

  abstract canHandle(task: Task): boolean;

  async initialize(): Promise<void> {
    this.status = 'active';
    console.log(`🤖 ${this.name} (${this.type}) initialized`);
  }

  async onTaskComplete(task: Task, result: TaskResult): Promise<void> {
    await this.memory.store({
      type: 'interaction',
      content: `Task ${task.id} completed: ${result.success ? 'success' : 'failed'}`,
      importance: result.success ? 0.5 : 0.8,
      tags: [this.type, 'task', result.success ? 'success' : 'failure'],
      metadata: {
        source: this.id,
        taskId: task.id,
      },
    });
  }

  async onTaskError(task: Task, error: Error): Promise<void> {
    await this.memory.store({
      type: 'interaction',
      content: `Task ${task.id} failed: ${error.message}`,
      importance: 0.9,
      tags: [this.type, 'error'],
      metadata: {
        source: this.id,
        taskId: task.id,
      },
    });
  }

  getStatus() {
    return this.status;
  }

  setStatus(status: 'idle' | 'active' | 'busy' | 'error'): void {
    this.status = status;
  }

  getMetadata(): Agent {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      capabilities: this.getCapabilities(),
      config: this.getConfig(),
      createdAt: new Date(),
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalExecutionTime: 0,
        averageTaskDuration: 0,
        successRate: 100,
      },
    };
  }

  protected abstract getCapabilities(): string[];

  protected abstract getConfig(): Agent['config'];
}