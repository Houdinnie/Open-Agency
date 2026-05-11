export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'active' | 'busy' | 'error' | 'disabled';
  capabilities: string[];
  createdAt: string;
  lastActiveAt?: string;
  metrics: AgentMetrics;
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
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  title: string;
  description: string;
  assignedTo?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface Stats {
  totalTasks: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  agentStats: {
    total: number;
    active: number;
    busy: number;
    idle: number;
    error: number;
  };
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  cac: number;
}

export interface RevenueStream {
  id: string;
  name: string;
  type: 'seo' | 'outreach' | 'ads' | 'affiliate' | 'services';
  status: 'active' | 'paused' | 'testing';
  revenue: number;
  costs: number;
  roi: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'churned' | 'trial';
  monthlyValue: number;
  startDate: string;
  services: string[];
}

export interface ContentPiece {
  id: string;
  type: 'blog' | 'social' | 'email' | 'ad' | 'video' | 'landing';
  title: string;
  content: string;
  keywords: string[];
  platform?: string;
  status: 'draft' | 'published' | 'scheduled';
  metrics?: {
    views: number;
    engagement: number;
    seoScore: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  source: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
}

export interface OutreachSequence {
  id: string;
  name: string;
  steps: { day: number; channel: string; status: string }[];
  status: string;
}

export interface SEOCampaign {
  id: string;
  targetDomain: string;
  keywords: string[];
  status: string;
  rankings: Record<string, number>;
  traffic: number;
}