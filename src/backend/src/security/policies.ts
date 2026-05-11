import { AgentPolicy } from './types';
import { v4 as uuidv4 } from 'uuid';

function createPolicy(
  agentId: string,
  role: string,
  level: number,
  domain: string[],
  tools: string[],
  dataAccess: Record<string, string>,
  approvalRequired: string[] = []
): AgentPolicy {
  const toolPermissions: Record<string, boolean> = {};
  tools.forEach(t => { toolPermissions[t] = true; });
  
  return {
    agentId,
    role,
    level,
    permissions: {
      tools: toolPermissions,
      dataAccess: dataAccess as any,
    },
    limits: {
      requestsPerMinute: 60,
      maxDailyCostUsd: level * 10,
      maxTasksPerRun: 10 * level,
      maxConcurrentActions: 5 * level,
      maxMemoryAccessMb: 100 * level,
    },
    approvalRequired,
    domain,
    validUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    tokenId: uuidv4(),
  };
}

export const defaultPolicies: Record<string, AgentPolicy> = {
  'router-agent': createPolicy(
    'router-agent',
    'routing',
    1,
    ['routing'],
    [
      'system.health_check',
      'system.read_logs',
      'task.create',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'none', customers: 'none' }
  ),
  
  'planner-agent': createPolicy(
    'planner-agent',
    'planning',
    2,
    ['planning'],
    [
      'task.create',
      'linear.create_issue',
      'memory.search',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'read', customers: 'none' }
  ),
  
  'growth-agent': createPolicy(
    'growth-agent',
    'growth',
    2,
    ['marketing', 'outreach', 'content'],
    [
      'slack.send_message',
      'slack.send_dm',
      'linear.create_issue',
      'linear.update_issue',
      'linear.list_issues',
      'github.read_repo',
      'crm.read',
      'crm.write',
      'analytics.query',
      'memory.store',
      'memory.search',
      'task.create',
    ],
    { analytics: 'read_write', database: 'read', secrets: 'none', crm: 'read_write', customers: 'read' },
    ['financial_actions']
  ),
  
  'sales-agent': createPolicy(
    'sales-agent',
    'sales',
    2,
    ['sales', 'leads'],
    [
      'slack.send_message',
      'email.send',
      'linear.create_issue',
      'linear.update_issue',
      'crm.read',
      'crm.write',
      'database.read',
      'database.write',
      'analytics.query',
      'memory.store',
      'memory.search',
      'task.create',
    ],
    { analytics: 'read', database: 'read_write', secrets: 'none', crm: 'full', customers: 'read' },
    ['financial_actions']
  ),
  
  'pricing-agent': createPolicy(
    'pricing-agent',
    'pricing',
    2,
    ['pricing', 'revenue'],
    [
      'analytics.query',
      'stripe.view_pricing',
      'stripe.view_subscriptions',
      'linear.create_issue',
      'memory.store',
      'memory.search',
      'task.create',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'read', customers: 'read' },
    ['financial_actions', 'production_changes']
  ),
  
  'code-agent': createPolicy(
    'code-agent',
    'development',
    2,
    ['code', 'repository'],
    [
      'github.read_repo',
      'github.create_pr',
      'github.create_branch',
      'code.execute',
      'linear.create_issue',
      'linear.update_issue',
      'linear.list_issues',
      'system.read_logs',
      'deploy.staging',
      'task.create',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'none', customers: 'none' },
    ['production_changes', 'security_changes']
  ),
  
  'operations-agent': createPolicy(
    'operations-agent',
    'operations',
    2,
    ['operations', 'infrastructure'],
    [
      'linear.create_issue',
      'linear.update_issue',
      'linear.list_issues',
      'system.health_check',
      'system.read_logs',
      'monitoring.read',
      'infrastructure.read_config',
      'database.read',
      'database.write',
      'task.create',
    ],
    { analytics: 'read', database: 'read_write', secrets: 'none', crm: 'none', customers: 'none' }
  ),
  
  'research-agent': createPolicy(
    'research-agent',
    'research',
    2,
    ['research', 'analysis'],
    [
      'analytics.query',
      'crm.read',
      'database.read',
      'memory.store',
      'memory.search',
      'linear.create_issue',
      'task.create',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'read', customers: 'read' }
  ),
  
  'triage-agent': createPolicy(
    'triage-agent',
    'triage',
    3,
    ['triage', 'self_healing'],
    [
      'linear.create_issue',
      'linear.update_issue',
      'linear.list_issues',
      'github.create_pr',
      'github.read_repo',
      'code.execute',
      'system.read_logs',
      'system.health_check',
      'database.read',
      'database.write',
      'memory.store',
      'memory.search',
      'task.create',
    ],
    { analytics: 'read', database: 'read_write', secrets: 'none', crm: 'none', customers: 'none' },
    ['production_changes', 'security_changes']
  ),
  
  'executor-agent': createPolicy(
    'executor-agent',
    'execution',
    3,
    ['execution'],
    [
      'slack.send_message',
      'slack.send_dm',
      'email.send',
      'linear.create_issue',
      'linear.update_issue',
      'github.create_pr',
      'github.merge_pr',
      'deploy.staging',
      'database.read',
      'database.write',
      'stripe.view_pricing',
      'stripe.view_subscriptions',
      'infrastructure.read_config',
      'memory.store',
      'task.create',
    ],
    { analytics: 'read_write', database: 'read_write', secrets: 'none', crm: 'read_write', customers: 'read' },
    ['financial_actions', 'production_changes', 'security_changes']
  ),
  
  'reviewer-agent': createPolicy(
    'reviewer-agent',
    'review',
    2,
    ['review', 'quality'],
    [
      'memory.search',
      'linear.list_issues',
      'github.read_repo',
      'analytics.query',
      'system.read_logs',
      'task.create',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'read', customers: 'none' }
  ),
  
  'verifier-agent': createPolicy(
    'verifier-agent',
    'verification',
    2,
    ['verification', 'validation'],
    [
      'analytics.query',
      'system.health_check',
      'system.read_logs',
      'linear.list_issues',
      'github.read_repo',
      'memory.store',
      'memory.search',
      'task.create',
    ],
    { analytics: 'read', database: 'read', secrets: 'none', crm: 'none', customers: 'none' }
  ),
};

export function getPolicy(agentId: string): AgentPolicy | undefined {
  return defaultPolicies[agentId];
}

export function getAgentIds(): string[] {
  return Object.keys(defaultPolicies);
}