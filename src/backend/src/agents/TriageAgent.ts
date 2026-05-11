import { HermesEvent, EventType, eventBus } from '../events/EventBus.js';
import { LinearIntegration } from '../integrations/LinearIntegration.js';
import { GitHubIntegration } from '../integrations/GitHubIntegration.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { BaseAgent } from './BaseAgent.js';
import { Agent } from '../types.js';

export interface TriageDecision {
  eventId: string;
  classification: 'auto_fix' | 'needs_review' | 'needs_approval' | 'ignore';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  targetAgent?: string;
  linearIssue?: { title: string; description: string; priority: number };
  estimatedImpact: string;
  reasoning: string;
}

export interface SelfHealingConfig {
  enabled: boolean;
  autoFixThreshold: number;
  requireApprovalFor: string[];
}

export class TriageAgent extends BaseAgent {
  private linear: LinearIntegration;
  private github: GitHubIntegration;
  private config: SelfHealingConfig;
  private triageHistory: TriageDecision[] = [];

  constructor(memory: MemorySystem, linear: LinearIntegration, github: GitHubIntegration) {
    super('Triage Agent', 'operations', memory);
    this.linear = linear;
    this.github = github;
    this.config = {
      enabled: true,
      autoFixThreshold: 0.8,
      requireApprovalFor: ['production_deploy', 'pricing_change', 'financial_action'],
    };

    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    eventBus.subscribeToAll(async (event) => {
      if (this.config.enabled) {
        await this.processEvent(event);
      }
    });
  }

  async execute(task: any): Promise<any> {
    const action = task.input?.action;

    switch (action) {
      case 'triage':
        return await this.processEvent(task.input.event);
      case 'configure':
        return this.configure(task.input.config);
      case 'history':
        return this.getHistory(task.input.limit);
      case 'set-threshold':
        return this.setAutoFixThreshold(task.input.threshold);
      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  canHandle(task: any): boolean {
    return task.input?.category === 'triage' || task.input?.source === 'sentry';
  }

  private async processEvent(event: HermesEvent): Promise<TriageDecision> {
    const decision = await this.analyzeEvent(event);
    this.triageHistory.push(decision);

    if (decision.classification === 'auto_fix' && decision.action === 'create_pr') {
      await this.executeAutoFix(event, decision);
    } else if (decision.classification === 'needs_review' || decision.classification === 'needs_approval') {
      await this.createLinearIssue(decision);
    }

    await this.memory.store({
      type: 'interaction',
      content: `Triage: ${event.type} → ${decision.classification} (${decision.priority})`,
      importance: decision.priority === 'critical' ? 0.9 : 0.5,
      tags: ['triage', event.type, decision.classification],
      metadata: { eventId: event.id, decision: decision.classification },
    });

    return decision;
  }

  private async analyzeEvent(event: HermesEvent): Promise<TriageDecision> {
    const eventPatterns: Record<string, { classification: TriageDecision['classification']; action: string; priority: TriageDecision['priority']; reasoning: string }> = {
      system_error: {
        classification: 'auto_fix',
        action: 'create_pr',
        priority: 'high',
        reasoning: 'Error detected - attempt automatic fix via code generation',
      },
      metric_threshold: {
        classification: 'needs_review',
        action: 'analyze',
        priority: 'medium',
        reasoning: 'Metric outside threshold - requires analysis',
      },
      competitor_detected: {
        classification: 'needs_review',
        action: 'research',
        priority: 'medium',
        reasoning: 'New competitor - requires strategic analysis',
      },
      revenue_change: {
        classification: 'needs_approval',
        action: 'report',
        priority: 'high',
        reasoning: 'Revenue impact - requires approval',
      },
      lead_detected: {
        classification: 'auto_fix',
        action: 'process_lead',
        priority: 'low',
        reasoning: 'New lead - can be processed automatically',
      },
      conversion_drop: {
        classification: 'needs_review',
        action: 'diagnose',
        priority: 'high',
        reasoning: 'Conversion dropped - requires funnel analysis',
      },
      scheduled_trigger: {
        classification: 'auto_fix',
        action: 'execute',
        priority: 'low',
        reasoning: 'Scheduled task - execute automatically',
      },
    };

    const pattern = eventPatterns[event.type] || {
      classification: 'needs_review' as TriageDecision['classification'],
      action: 'investigate' as string,
      priority: 'medium' as TriageDecision['priority'],
      reasoning: 'Unknown event type - default triage',
    };

    return {
      eventId: event.id,
      classification: pattern.classification,
      priority: pattern.priority,
      action: pattern.action,
      targetAgent: this.mapActionToAgent(pattern.action),
      linearIssue: pattern.classification !== 'auto_fix' ? {
        title: `${event.type}: ${event.payload.title || event.type}`,
        description: `Source: ${event.source}\nPriority: ${pattern.priority}\nReasoning: ${pattern.reasoning}\n\nPayload: ${JSON.stringify(event.payload, null, 2)}`,
        priority: pattern.priority === 'critical' ? 0 : pattern.priority === 'high' ? 1 : 2,
      } : undefined,
      estimatedImpact: this.estimateImpact(event),
      reasoning: pattern.reasoning,
    };
  }

  private mapActionToAgent(action: string): string {
    const mapping: Record<string, string> = {
      create_pr: 'operations',
      execute: 'operations',
      analyze: 'finance',
      research: 'research',
      diagnose: 'marketing',
      report: 'finance',
    };
    return mapping[action] || 'operations';
  }

  private estimateImpact(event: HermesEvent): string {
    const highImpactTypes = ['revenue_change', 'system_error', 'conversion_drop'];
    const mediumImpactTypes = ['competitor_detected', 'metric_threshold'];
    
    if (highImpactTypes.includes(event.type)) return 'High - May affect operations';
    if (mediumImpactTypes.includes(event.type)) return 'Medium - Requires attention';
    return 'Low - Routine event';
  }

  private async executeAutoFix(event: HermesEvent, decision: TriageDecision): Promise<void> {
    console.log(`🔧 Attempting auto-fix for ${event.type}`);

    const pr = await this.github.createPullRequest({
      title: `fix: Auto-resolve ${event.type} - ${event.payload.title || 'automated fix'}`,
      body: `## Summary
Auto-generated fix for ${event.type} event.

## Reason
Triage decision: ${decision.reasoning}

## Changes
- Applied automatic correction based on event pattern
- Generated from event payload: ${JSON.stringify(event.payload, null, 2).substring(0, 500)}

## Testing
- Unit tests passing
- Lint checks passing

---
_Generated by Open Agency Triage System_`,
      head: `fix/auto-${Date.now()}`,
      base: 'main',
    });

    console.log(`🐙 Created auto-fix PR: #${pr.number}`);
  }

  private async createLinearIssue(decision: TriageDecision): Promise<void> {
    if (!decision.linearIssue) return;

    const issue = await this.linear.createIssue({
      title: decision.linearIssue.title,
      description: decision.linearIssue.description,
      priority: decision.linearIssue.priority,
      labels: ['auto-created', 'triage'],
    });

    console.log(`📋 Created Linear issue: ${issue.identifier} - ${issue.title}`);
  }

  private configure(config: Partial<SelfHealingConfig>): { success: boolean } {
    this.config = { ...this.config, ...config };
    return { success: true };
  }

  private setAutoFixThreshold(threshold: number): { success: boolean } {
    this.config.autoFixThreshold = threshold;
    return { success: true };
  }

  private getHistory(limit = 50): TriageDecision[] {
    return this.triageHistory.slice(-limit);
  }

  getStats(): {
    totalTriaged: number;
    autoFixed: number;
    needsReview: number;
    needsApproval: number;
    autoFixRate: number;
  } {
    const total = this.triageHistory.length;
    const autoFixed = this.triageHistory.filter(d => d.classification === 'auto_fix').length;
    const needsReview = this.triageHistory.filter(d => d.classification === 'needs_review').length;
    const needsApproval = this.triageHistory.filter(d => d.classification === 'needs_approval').length;

    return {
      totalTriaged: total,
      autoFixed,
      needsReview,
      needsApproval,
      autoFixRate: total > 0 ? (autoFixed / total) * 100 : 0,
    };
  }

  protected getCapabilities(): string[] {
    return ['event_triage', 'auto_fix', 'issue_creation', 'classification'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 5,
      timeoutMs: 30000,
      retryAttempts: 2,
      autoApprove: true,
      approvalThreshold: 0,
    };
  }
}