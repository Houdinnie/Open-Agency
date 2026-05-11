import { HermesEvent, EventType, eventBus } from './EventBus.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import { MemorySystem } from '../memory/MemorySystem.js';

interface RoutingRule {
  id: string;
  eventType: EventType | '*';
  agentType: string;
  priority: number;
  condition?: (event: HermesEvent) => boolean;
}

interface DispatchResult {
  eventId: string;
  routedTo: string;
  success: boolean;
  executionTime: number;
  result?: unknown;
}

export class EventDispatcher {
  private registry: AgentRegistry;
  private memory: MemorySystem;
  private rules: RoutingRule[] = [];
  private dispatchHistory: DispatchResult[] = [];

  constructor(registry: AgentRegistry, memory: MemorySystem) {
    this.registry = registry;
    this.memory = memory;
    this.initializeRoutingRules();
    this.subscribeToEvents();
  }

  private initializeRoutingRules(): void {
    this.rules = [
      { id: 'r1', eventType: 'lead_detected', agentType: 'sales', priority: 1 },
      { id: 'r2', eventType: 'email_received', agentType: 'operations', priority: 1 },
      { id: 'r3', eventType: 'price_change', agentType: 'finance', priority: 1 },
      { id: 'r4', eventType: 'competitor_detected', agentType: 'research', priority: 2 },
      { id: 'r5', eventType: 'conversion_drop', agentType: 'marketing', priority: 1 },
      { id: 'r6', eventType: 'revenue_change', agentType: 'finance', priority: 1 },
      { id: 'r7', eventType: 'metric_threshold', agentType: 'operations', priority: 1 },
      { id: 'r8', eventType: 'scheduled_trigger', agentType: 'orchestrator', priority: 1 },
      { id: 'r9', eventType: 'system_error', agentType: 'operations', priority: 1 },
      { id: 'r10', eventType: 'scheduled_trigger', agentType: 'marketing', priority: 2, condition: (e) => e.payload.job === 'content_generation' },
      { id: 'r11', eventType: 'scheduled_trigger', agentType: 'sales', priority: 2, condition: (e) => e.payload.job === 'lead_outreach' },
      { id: 'r12', eventType: 'scheduled_trigger', agentType: 'finance', priority: 2, condition: (e) => e.payload.job === 'pricing_optimization' },
    ];

    console.log(`📡 Initialized ${this.rules.length} routing rules`);
  }

  private subscribeToEvents(): void {
    eventBus.subscribeToAll(async (event) => {
      await this.dispatch(event);
    });
  }

  async dispatch(event: HermesEvent): Promise<DispatchResult> {
    const startTime = Date.now();
    
    const matchingRules = this.rules
      .filter(rule => 
        rule.eventType === '*' || 
        rule.eventType === event.type
      )
      .filter(rule => !rule.condition || rule.condition(event))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length === 0) {
      console.log(`⚠️ No routing rules for event: ${event.type}`);
      return {
        eventId: event.id,
        routedTo: 'none',
        success: false,
        executionTime: Date.now() - startTime,
      };
    }

    const primaryRule = matchingRules[0];
    const agent = this.registry.getAgentByType(primaryRule.agentType as any);

    if (!agent) {
      console.error(`❌ No agent found for type: ${primaryRule.agentType}`);
      return {
        eventId: event.id,
        routedTo: primaryRule.agentType,
        success: false,
        executionTime: Date.now() - startTime,
      };
    }

    console.log(`📨 Dispatching event ${event.type} to ${primaryRule.agentType}`);

    try {
      const task = {
        id: `task_${Date.now()}`,
        type: this.mapEventToTaskType(event.type),
        priority: event.priority === 'critical' ? 'critical' : event.priority === 'high' ? 'high' : 'medium',
        title: `Event: ${event.type}`,
        description: `${event.type} from ${event.source}`,
        input: {
          action: this.mapEventToAction(event.type),
          eventData: event.payload,
        },
        metadata: {
          source: 'event_dispatcher',
          eventId: event.id,
          requiresApproval: event.priority === 'critical',
        },
      };

      await agent.setStatus('busy');
      const result = await agent.execute(task as any);
      await agent.setStatus('active');

      const dispatchResult: DispatchResult = {
        eventId: event.id,
        routedTo: primaryRule.agentType,
        success: true,
        executionTime: Date.now() - startTime,
        result: result.output,
      };

      this.dispatchHistory.push(dispatchResult);

      await this.memory.store({
        type: 'interaction',
        content: `Event ${event.type} dispatched to ${primaryRule.agentType}`,
        importance: 0.4,
        tags: ['dispatch', event.type],
        metadata: { eventId: event.id, agent: primaryRule.agentType },
      });

      return dispatchResult;
    } catch (error) {
      const failedResult: DispatchResult = {
        eventId: event.id,
        routedTo: primaryRule.agentType,
        success: false,
        executionTime: Date.now() - startTime,
        result: String(error),
      };

      this.dispatchHistory.push(failedResult);
      
      await this.memory.store({
        type: 'interaction',
        content: `Event ${event.type} dispatch failed: ${error}`,
        importance: 0.7,
        tags: ['dispatch_error', event.type],
        metadata: { eventId: event.id, error: String(error) },
      });

      return failedResult;
    }
  }

  private mapEventToTaskType(eventType: EventType): string {
    const mapping: Record<string, string> = {
      lead_detected: 'outreach',
      email_received: 'automation',
      price_change: 'analysis',
      competitor_detected: 'research',
      conversion_drop: 'analysis',
      revenue_change: 'analysis',
      metric_threshold: 'automation',
      scheduled_trigger: 'automation',
      system_error: 'automation',
      slack_command: 'automation',
      api_webhook: 'automation',
    };
    return mapping[eventType] || 'automation';
  }

  private mapEventToAction(eventType: EventType): string {
    const mapping: Record<string, string> = {
      lead_detected: 'process_lead',
      email_received: 'handle_email',
      price_change: 'analyze_pricing',
      competitor_detected: 'analyze_competitor',
      conversion_drop: 'diagnose_funnel',
      revenue_change: 'analyze_revenue',
      metric_threshold: 'check_thresholds',
      scheduled_trigger: 'execute_scheduled',
      system_error: 'diagnose_error',
      slack_command: 'handle_command',
      api_webhook: 'process_webhook',
    };
    return mapping[eventType] || 'process_event';
  }

  addRule(rule: Omit<RoutingRule, 'id'>): void {
    this.rules.push({ ...rule, id: `rule_${Date.now()}` });
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): RoutingRule[] {
    return this.rules;
  }

  getHistory(limit = 50): DispatchResult[] {
    return this.dispatchHistory.slice(-limit);
  }

  getStats(): { eventsProcessed: number; successRate: number; avgExecutionTime: number } {
    const recent = this.dispatchHistory.slice(-100);
    const successful = recent.filter(r => r.success).length;
    
    return {
      eventsProcessed: this.dispatchHistory.length,
      successRate: recent.length > 0 ? (successful / recent.length) * 100 : 0,
      avgExecutionTime: recent.length > 0 
        ? recent.reduce((sum, r) => sum + r.executionTime, 0) / recent.length 
        : 0,
    };
  }
}