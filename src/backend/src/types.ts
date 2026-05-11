export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  config: AgentConfig;
  createdAt: Date;
  lastActiveAt?: Date;
  metrics: AgentMetrics;
}

export type AgentType =
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'finance'
  | 'legal'
  | 'research'
  | 'personal'
  | 'orchestrator';

export type AgentStatus = 'idle' | 'active' | 'busy' | 'error' | 'disabled';

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryAttempts: number;
  autoApprove: boolean;
  approvalThreshold: number;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  totalExecutionTime: number;
  averageTaskDuration: number;
  successRate: number;
}

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description: string;
  assignedTo?: string;
  dependencies: string[];
  input: Record<string, unknown>;
  output?: unknown;
  result?: TaskResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: TaskMetadata;
}

export type TaskType =
  | 'research'
  | 'content'
  | 'outreach'
  | 'analysis'
  | 'automation'
  | 'approval'
  | 'learning'
  | 'reporting';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskResult {
  success: boolean;
  output?: unknown;
  error?: string;
  metrics: {
    duration: number;
    tokensUsed?: number;
    toolCalls?: number;
  };
}

export interface TaskMetadata {
  source: 'user' | 'system' | 'scheduled' | 'agent';
  requiresApproval: boolean;
  approvedAt?: Date;
  context?: Record<string, unknown>;
}

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: MemoryMetadata;
  createdAt: Date;
  accessedAt: Date;
  importance: number;
  tags: string[];
}

export type MemoryType =
  | 'interaction'
  | 'knowledge'
  | 'preference'
  | 'context'
  | 'skill'
  | 'decision';

export interface MemoryMetadata {
  source: string;
  agentId?: string;
  taskId?: string;
  userId?: string;
  expiresAt?: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  businessContext: BusinessContext;
  goals: Goal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'mixed';
  notificationPreferences: string[];
  defaultAgents: string[];
  approvalThresholds: {
    spending: number;
    commitments: number;
  };
}

export interface BusinessContext {
  industry: string;
  businessType: string;
  currentTools: string[];
  teamSize: number;
  painPoints: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  status: 'active' | 'completed' | 'paused';
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  actions: ToolAction[];
  config: Record<string, unknown>;
}

export type ToolCategory =
  | 'communication'
  | 'productivity'
  | 'data'
  | 'automation'
  | 'scraping'
  | 'analytics';

export interface ToolAction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  type: ApprovalType;
  title: string;
  description: string;
  details: unknown;
  requestedAt: Date;
  status: ApprovalStatus;
  resolvedAt?: Date;
  resolution?: string;
}

export type ApprovalType = 'spending' | 'commitment' | 'content' | 'custom';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AgentMessage {
  id: string;
  agentId: string;
  type: 'request' | 'response' | 'error' | 'notification';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}