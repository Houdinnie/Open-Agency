export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ToolScope = 'communication' | 'task_management' | 'code_modification' | 'data_access' | 'financial' | 'infrastructure' | 'system';
export type DataAccessLevel = 'none' | 'read' | 'read_write' | 'full';
export type PolicyDecision = 'ALLOW' | 'DENY' | 'ESCALATE_TO_HUMAN' | 'ALLOW_WITH_LIMITS';

export interface ToolDefinition {
  name: string;
  risk: RiskLevel;
  scope: ToolScope;
  description: string;
  approvalRequired: boolean;
  rateLimitPerMinute: number;
}

export interface ToolPermissions {
  [toolName: string]: boolean;
}

export interface DataAccessPermissions {
  crm: DataAccessLevel;
  analytics: DataAccessLevel;
  database: DataAccessLevel;
  secrets: DataAccessLevel;
  customers: DataAccessLevel;
}

export interface AgentLimits {
  requestsPerMinute: number;
  maxDailyCostUsd: number;
  maxTasksPerRun: number;
  maxConcurrentActions: number;
  maxMemoryAccessMb: number;
}

export interface AgentPolicy {
  agentId: string;
  role: string;
  level: number;
  permissions: {
    tools: ToolPermissions;
    dataAccess: DataAccessPermissions;
  };
  limits: AgentLimits;
  approvalRequired: string[];
  domain: string[];
  validUntil: Date;
  tokenId: string;
}

export interface PolicyDecisionResult {
  decision: PolicyDecision;
  reason: string;
  toolName?: string;
  limits?: {
    maxRequests?: number;
    maxCost?: number;
  };
  escalationId?: string;
}

export interface AuditLogEntry {
  id: string;
  agentId: string;
  action: string;
  toolName?: string;
  input: Record<string, unknown>;
  decisionPath: string[];
  result: PolicyDecision;
  timestamp: Date;
  riskLevel: RiskLevel;
  metadata?: Record<string, unknown>;
}

export interface EscalationEvent {
  id: string;
  agentId: string;
  action: string;
  reason: string;
  requestedBy: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'modified' | 'rejected';
  response?: {
    decision: 'approved' | 'modified' | 'rejected';
    note?: string;
    respondedBy?: string;
    respondedAt?: Date;
  };
}

export interface RateLimitEntry {
  agentId: string;
  toolName: string;
  count: number;
  windowStart: Date;
}