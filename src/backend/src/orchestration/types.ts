export type TaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  agentId?: string;
  dependencies: string[];
  status: TaskStatus;
  priority: TaskPriority;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  tasks: Task[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface ExecutionContext {
  workflowId: string;
  taskId: string;
  agentId: string;
  input: Record<string, unknown>;
  startTime: Date;
}

export interface AgentResult {
  agentId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

export interface EventContext {
  type: string;
  payload: Record<string, unknown>;
  source: string;
  timestamp: Date;
  priority: number;
}