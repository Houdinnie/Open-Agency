import { Task, TaskStatus, TaskPriority } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface TaskNode {
  id: string;
  task: Task;
  dependencies: Set<string>;
  dependents: Set<string>;
}

export class TaskGraph {
  private nodes: Map<string, TaskNode> = new Map();
  private roots: Set<string> = new Set();
  
  addTask(task: Task): void {
    const node: TaskNode = {
      id: task.id,
      task,
      dependencies: new Set(task.dependencies),
      dependents: new Set(),
    };
    
    this.nodes.set(task.id, node);
    this.updateRoots();
  }
  
  private updateRoots(): void {
    this.roots.clear();
    for (const [id, node] of this.nodes) {
      if (node.dependencies.size === 0) {
        this.roots.add(id);
      }
    }
  }
  
  addDependency(taskId: string, dependsOnId: string): void {
    const taskNode = this.nodes.get(taskId);
    const depNode = this.nodes.get(dependsOnId);
    
    if (taskNode && depNode) {
      taskNode.dependencies.add(dependsOnId);
      depNode.dependents.add(taskId);
      this.roots.delete(taskId);
    }
  }
  
  getReadyTasks(runningIds: Set<string>): Task[] {
    const ready: Task[] = [];
    
    for (const [id, node] of this.nodes) {
      if (node.task.status !== 'pending') continue;
      if (runningIds.has(id)) continue;
      
      const depsMet = Array.from(node.dependencies).every(depId => {
        const dep = this.nodes.get(depId);
        return dep?.task.status === 'completed';
      });
      
      if (depsMet) {
        ready.push(node.task);
      }
    }
    
    return ready.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  isComplete(): boolean {
    for (const node of this.nodes.values()) {
      if (node.task.status !== 'completed' && node.task.status !== 'failed') {
        return false;
      }
    }
    return this.nodes.size > 0;
  }
  
  hasFailures(): boolean {
    for (const node of this.nodes.values()) {
      if (node.task.status === 'failed') return true;
    }
    return false;
  }
  
  getTaskStatus(taskId: string): TaskStatus | undefined {
    return this.nodes.get(taskId)?.task.status;
  }
  
  updateTaskStatus(taskId: string, status: TaskStatus, output?: unknown, error?: string): void {
    const node = this.nodes.get(taskId);
    if (node) {
      node.task.status = status;
      node.task.output = output;
      node.task.error = error;
      
      if (status === 'running' && !node.task.startedAt) {
        node.task.startedAt = new Date();
      }
      if (status === 'completed' || status === 'failed') {
        node.task.completedAt = new Date();
      }
    }
  }
  
  getAllTasks(): Task[] {
    return Array.from(this.nodes.values()).map(n => n.task);
  }
  
  getExecutionOrder(): Task[][] {
    const levels: Task[][] = [];
    const completed = new Set<string>();
    
    while (completed.size < this.nodes.size) {
      const level: Task[] = [];
      
      for (const [id, node] of this.nodes) {
        if (completed.has(id)) continue;
        
        const depsMet = Array.from(node.dependencies).every(d => completed.has(d));
        if (depsMet) {
          level.push(node.task);
        }
      }
      
      if (level.length === 0) break;
      levels.push(level);
      level.forEach(t => completed.add(t.id));
    }
    
    return levels;
  }
  
  reset(): void {
    this.nodes.clear();
    this.roots.clear();
  }
}

export function createTask(
  title: string,
  agentId: string,
  priority: TaskPriority = 'medium',
  dependencies: string[] = [],
  input: Record<string, unknown> = {}
): Task {
  return {
    id: uuidv4(),
    title,
    agentId,
    dependencies,
    status: 'pending',
    priority,
    input,
    createdAt: new Date(),
  };
}