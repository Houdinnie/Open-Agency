import { ToolDefinition } from './types';

export const toolRegistry: Record<string, ToolDefinition> = {
  // Communication tools
  'slack.send_message': {
    name: 'slack.send_message',
    risk: 'low',
    scope: 'communication',
    description: 'Send a message via Slack',
    approvalRequired: false,
    rateLimitPerMinute: 60,
  },
  'slack.send_dm': {
    name: 'slack.send_dm',
    risk: 'low',
    scope: 'communication',
    description: 'Send a direct message via Slack',
    approvalRequired: false,
    rateLimitPerMinute: 30,
  },
  'slack.create_channel': {
    name: 'slack.create_channel',
    risk: 'medium',
    scope: 'communication',
    description: 'Create a new Slack channel',
    approvalRequired: false,
    rateLimitPerMinute: 10,
  },
  'email.send': {
    name: 'email.send',
    risk: 'medium',
    scope: 'communication',
    description: 'Send an email via configured provider',
    approvalRequired: true,
    rateLimitPerMinute: 20,
  },
  
  // Task management tools
  'linear.create_issue': {
    name: 'linear.create_issue',
    risk: 'low',
    scope: 'task_management',
    description: 'Create a Linear issue',
    approvalRequired: false,
    rateLimitPerMinute: 30,
  },
  'linear.update_issue': {
    name: 'linear.update_issue',
    risk: 'low',
    scope: 'task_management',
    description: 'Update a Linear issue',
    approvalRequired: false,
    rateLimitPerMinute: 60,
  },
  'linear.list_issues': {
    name: 'linear.list_issues',
    risk: 'low',
    scope: 'task_management',
    description: 'List Linear issues',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  'task.create': {
    name: 'task.create',
    risk: 'low',
    scope: 'task_management',
    description: 'Create an internal task',
    approvalRequired: false,
    rateLimitPerMinute: 50,
  },
  
  // Code tools
  'github.read_repo': {
    name: 'github.read_repo',
    risk: 'low',
    scope: 'code_modification',
    description: 'Read repository contents',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  'github.create_pr': {
    name: 'github.create_pr',
    risk: 'medium',
    scope: 'code_modification',
    description: 'Create a pull request',
    approvalRequired: false,
    rateLimitPerMinute: 20,
  },
  'github.merge_pr': {
    name: 'github.merge_pr',
    risk: 'high',
    scope: 'code_modification',
    description: 'Merge a pull request',
    approvalRequired: true,
    rateLimitPerMinute: 10,
  },
  'github.create_branch': {
    name: 'github.create_branch',
    risk: 'medium',
    scope: 'code_modification',
    description: 'Create a new branch',
    approvalRequired: false,
    rateLimitPerMinute: 20,
  },
  'github.run_workflow': {
    name: 'github.run_workflow',
    risk: 'high',
    scope: 'code_modification',
    description: 'Trigger a GitHub workflow',
    approvalRequired: true,
    rateLimitPerMinute: 5,
  },
  'code.execute': {
    name: 'code.execute',
    risk: 'medium',
    scope: 'code_modification',
    description: 'Execute code in sandbox',
    approvalRequired: false,
    rateLimitPerMinute: 30,
  },
  
  // Data tools
  'database.read': {
    name: 'database.read',
    risk: 'low',
    scope: 'data_access',
    description: 'Read from database',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  'database.write': {
    name: 'database.write',
    risk: 'medium',
    scope: 'data_access',
    description: 'Write to database',
    approvalRequired: false,
    rateLimitPerMinute: 50,
  },
  'analytics.query': {
    name: 'analytics.query',
    risk: 'low',
    scope: 'data_access',
    description: 'Query analytics data',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  'crm.read': {
    name: 'crm.read',
    risk: 'low',
    scope: 'data_access',
    description: 'Read CRM data',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  'crm.write': {
    name: 'crm.write',
    risk: 'medium',
    scope: 'data_access',
    description: 'Write CRM data',
    approvalRequired: false,
    rateLimitPerMinute: 30,
  },
  
  // Financial tools (HIGH RISK - require approval)
  'stripe.view_pricing': {
    name: 'stripe.view_pricing',
    risk: 'low',
    scope: 'financial',
    description: 'View Stripe pricing',
    approvalRequired: false,
    rateLimitPerMinute: 20,
  },
  'stripe.modify_pricing': {
    name: 'stripe.modify_pricing',
    risk: 'critical',
    scope: 'financial',
    description: 'Modify Stripe pricing (DANGEROUS)',
    approvalRequired: true,
    rateLimitPerMinute: 1,
  },
  'stripe.view_subscriptions': {
    name: 'stripe.view_subscriptions',
    risk: 'medium',
    scope: 'financial',
    description: 'View subscription data',
    approvalRequired: false,
    rateLimitPerMinute: 30,
  },
  'billing.create_invoice': {
    name: 'billing.create_invoice',
    risk: 'high',
    scope: 'financial',
    description: 'Create an invoice',
    approvalRequired: true,
    rateLimitPerMinute: 10,
  },
  'payments.process': {
    name: 'payments.process',
    risk: 'critical',
    scope: 'financial',
    description: 'Process a payment (DANGEROUS)',
    approvalRequired: true,
    rateLimitPerMinute: 1,
  },
  
  // Infrastructure tools
  'deploy.staging': {
    name: 'deploy.staging',
    risk: 'high',
    scope: 'infrastructure',
    description: 'Deploy to staging environment',
    approvalRequired: false,
    rateLimitPerMinute: 10,
  },
  'deploy.production': {
    name: 'deploy.production',
    risk: 'critical',
    scope: 'infrastructure',
    description: 'Deploy to production (DANGEROUS)',
    approvalRequired: true,
    rateLimitPerMinute: 1,
  },
  'infrastructure.read_config': {
    name: 'infrastructure.read_config',
    risk: 'low',
    scope: 'infrastructure',
    description: 'Read infrastructure configuration',
    approvalRequired: false,
    rateLimitPerMinute: 50,
  },
  'infrastructure.modify_config': {
    name: 'infrastructure.modify_config',
    risk: 'high',
    scope: 'infrastructure',
    description: 'Modify infrastructure config',
    approvalRequired: true,
    rateLimitPerMinute: 5,
  },
  'monitoring.read': {
    name: 'monitoring.read',
    risk: 'low',
    scope: 'infrastructure',
    description: 'Read monitoring data',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  
  // System tools
  'system.read_logs': {
    name: 'system.read_logs',
    risk: 'low',
    scope: 'system',
    description: 'Read system logs',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
  'system.health_check': {
    name: 'system.health_check',
    risk: 'low',
    scope: 'system',
    description: 'Perform health check',
    approvalRequired: false,
    rateLimitPerMinute: 60,
  },
  'memory.store': {
    name: 'memory.store',
    risk: 'medium',
    scope: 'system',
    description: 'Store in agent memory',
    approvalRequired: false,
    rateLimitPerMinute: 50,
  },
  'memory.search': {
    name: 'memory.search',
    risk: 'low',
    scope: 'system',
    description: 'Search agent memory',
    approvalRequired: false,
    rateLimitPerMinute: 100,
  },
};

export function getToolDefinition(toolName: string): ToolDefinition | undefined {
  return toolRegistry[toolName];
}

export function isToolRegistered(toolName: string): boolean {
  return toolName in toolRegistry;
}

export function isHighRiskTool(toolName: string): boolean {
  const tool = toolRegistry[toolName];
  return tool ? tool.risk === 'high' || tool.risk === 'critical' : false;
}

export function requiresApproval(toolName: string): boolean {
  const tool = toolRegistry[toolName];
  return tool ? tool.approvalRequired : true;
}

export function getToolsByRisk(risk: string): ToolDefinition[] {
  return Object.values(toolRegistry).filter(t => t.risk === risk);
}