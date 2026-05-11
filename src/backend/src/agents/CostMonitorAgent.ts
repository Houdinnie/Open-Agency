import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentType } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';

export interface CostEntry {
  id: string;
  timestamp: Date;
  category: 'llm' | 'api' | 'compute' | 'storage' | 'integration';
  amount: number;
  currency: string;
  description: string;
  taskId?: string;
  agentId?: string;
}

export interface CostBudget {
  dailyLimit: number;
  monthlyLimit: number;
  alertThreshold: number;
}

export interface CostMetrics {
  totalSpent: number;
  dailySpent: number;
  monthlySpent: number;
  projectedMonthly: number;
  byCategory: Record<string, number>;
  byAgent: Record<string, number>;
}

export class CostMonitorAgent extends BaseAgent {
  private costs: CostEntry[] = [];
  private budget: CostBudget = {
    dailyLimit: 10,
    monthlyLimit: 200,
    alertThreshold: 0.8,
  };
  private costPerToken = {
    openai: { input: 0.003, output: 0.015 },
    anthropic: { input: 0.003, output: 0.015 },
    grok: { input: 0.002, output: 0.01 },
  };

  constructor(memory: MemorySystem) {
    super('Cost Monitor', 'operations', memory);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('💰 Cost Monitor Agent initialized');
  }

  async execute(task: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const action = task.input?.action;
      
      switch (action) {
        case 'track':
          return this.trackCost(task.input);
        case 'getMetrics':
          return this.getMetrics();
        case 'setBudget':
          return this.setBudget(task.input);
        case 'checkBudget':
          return this.checkBudget();
        case 'optimize':
          return this.suggestOptimizations();
        case 'report':
          return this.generateReport();
        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    } finally {
      await this.updateExecutionMetrics(Date.now() - startTime);
    }
  }

  canHandle(task: any): boolean {
    return task.input?.category === 'cost' || task.type === 'analysis';
  }

  async trackCost(data: {
    category: 'llm' | 'api' | 'compute' | 'storage' | 'integration';
    amount: number;
    description: string;
    tokens?: { input: number; output: number };
    provider?: string;
    taskId?: string;
    agentId?: string;
  }): Promise<{ success: boolean; entry: CostEntry }> {
    let amount = data.amount;

    if (data.category === 'llm' && data.tokens && data.provider) {
      const rates = this.costPerToken[data.provider as keyof typeof this.costPerToken];
      if (rates) {
        amount = (data.tokens.input * rates.input + data.tokens.output * rates.output) / 1000;
      }
    }

    const entry: CostEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      category: data.category,
      amount,
      currency: 'USD',
      description: data.description,
      taskId: data.taskId,
      agentId: data.agentId,
    };

    this.costs.push(entry);

    await this.memory.store({
      type: 'knowledge',
      content: `Cost tracked: ${data.category} - $${amount.toFixed(4)}`,
      importance: 0.3,
      tags: ['cost', data.category],
      metadata: { source: this.id, entry },
    });

    if (this.shouldAlert()) {
      await this.sendBudgetAlert();
    }

    return { success: true, entry };
  }

  getMetrics(): CostMetrics {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayCosts = this.costs.filter(c => c.timestamp >= todayStart);
    const monthCosts = this.costs.filter(c => c.timestamp >= monthStart);

    const byCategory: Record<string, number> = {};
    const byAgent: Record<string, number> = {};

    for (const cost of this.costs) {
      byCategory[cost.category] = (byCategory[cost.category] || 0) + cost.amount;
      if (cost.agentId) {
        byAgent[cost.agentId] = (byAgent[cost.agentId] || 0) + cost.amount;
      }
    }

    const monthlySpent = monthCosts.reduce((sum, c) => sum + c.amount, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const projectedMonthly = monthlySpent * (daysInMonth / daysPassed);

    return {
      totalSpent: this.costs.reduce((sum, c) => sum + c.amount, 0),
      dailySpent: todayCosts.reduce((sum, c) => sum + c.amount, 0),
      monthlySpent,
      projectedMonthly,
      byCategory,
      byAgent,
    };
  }

  setBudget(budget: Partial<CostBudget>): { success: boolean } {
    this.budget = { ...this.budget, ...budget };
    return { success: true };
  }

  checkBudget(): { 
    withinDaily: boolean; 
    withinMonthly: boolean; 
    alertTriggered: boolean;
    remaining: { daily: number; monthly: number };
  } {
    const metrics = this.getMetrics();
    const withinDaily = metrics.dailySpent < this.budget.dailyLimit;
    const withinMonthly = metrics.monthlySpent < this.budget.monthlyLimit;
    const alertTriggered = metrics.monthlySpent > this.budget.monthlyLimit * this.budget.alertThreshold;

    return {
      withinDaily,
      withinMonthly,
      alertTriggered,
      remaining: {
        daily: Math.max(0, this.budget.dailyLimit - metrics.dailySpent),
        monthly: Math.max(0, this.budget.monthlyLimit - metrics.monthlySpent),
      },
    };
  }

  suggestOptimizations(): { suggestions: string[]; potentialSavings: number } {
    const metrics = this.getMetrics();
    const suggestions: string[] = [];
    let potentialSavings = 0;

    if (metrics.byCategory.llm > 0 && metrics.byCategory.llm > 50) {
      suggestions.push('Consider using smaller/faster models for routine tasks');
      suggestions.push('Implement response caching for repeated queries');
      potentialSavings += metrics.byCategory.llm * 0.3;
    }

    if (metrics.byCategory.compute > 20) {
      suggestions.push('Enable container sleep mode for idle agents');
      suggestions.push('Schedule batch processing during off-peak hours');
      potentialSavings += metrics.byCategory.compute * 0.2;
    }

    const avgCostPerTask = metrics.totalSpent / Math.max(1, this.costs.length);
    if (avgCostPerTask > 0.5) {
      suggestions.push('Review high-cost tasks for optimization opportunities');
    }

    return { suggestions, potentialSavings };
  }

  generateReport(): { 
    period: string;
    metrics: CostMetrics;
    budget: CostBudget;
    summary: string;
  } {
    const metrics = this.getMetrics();
    const budgetStatus = this.checkBudget();

    let summary = '';
    if (budgetStatus.withinMonthly) {
      summary = `On track. $${(budgetStatus.remaining.monthly).toFixed(2)} remaining for the month.`;
    } else {
      summary = `Budget exceeded by $${(metrics.monthlySpent - this.budget.monthlyLimit).toFixed(2)}.`;
    }

    return {
      period: new Date().toISOString().slice(0, 7),
      metrics,
      budget: this.budget,
      summary,
    };
  }

  private shouldAlert(): boolean {
    const status = this.checkBudget();
    return status.alertTriggered;
  }

  private async sendBudgetAlert(): Promise<void> {
    await this.memory.store({
      type: 'interaction',
      content: 'Budget alert: Monthly spending exceeded 80% threshold',
      importance: 0.9,
      tags: ['alert', 'budget'],
      metadata: { source: this.id },
    });
  }

  private async updateExecutionMetrics(duration: number): Promise<void> {
    await this.memory.store({
      type: 'interaction',
      content: `Cost monitoring cycle completed in ${duration}ms`,
      importance: 0.1,
      tags: ['metrics', 'cost'],
      metadata: { source: this.id },
    });
  }

  protected getCapabilities(): string[] {
    return ['cost_tracking', 'budget_management', 'optimization', 'reporting'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 1,
      timeoutMs: 30000,
      retryAttempts: 2,
      autoApprove: true,
      approvalThreshold: 0,
    };
  }
}