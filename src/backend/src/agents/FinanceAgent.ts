import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  vendor?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Invoice {
  id: string;
  client: string;
  amount: number;
  items: Array<{ description: string; quantity: number; price: number }>;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  createdAt: Date;
}

interface FinancialReport {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  breakdown: Record<string, number>;
}

export class FinanceAgent extends BaseAgent {
  private expenses: Map<string, Expense> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private categories = ['operations', 'marketing', 'sales', 'development', 'admin', 'other'];

  constructor(memory: MemorySystem) {
    super('Finance Agent', 'finance', memory);
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'track-expense':
          result = await this.trackExpense(task.input);
          break;
        case 'create-invoice':
          result = await this.createInvoice(task.input);
          break;
        case 'get-financials':
          result = await this.getFinancials(task.input);
          break;
        case 'forecast':
          result = await this.forecast(task.input);
          break;
        case 'expense-report':
          result = await this.expenseReport(task.input);
          break;
        default:
          result = await this.handleGenericFinance(task);
      }

      return {
        success: true,
        output: result,
        metrics: { duration: Date.now() - startTime },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { duration: Date.now() - startTime },
      };
    }
  }

  canHandle(task: Task): boolean {
    return task.type === 'analysis' || task.input?.category === 'finance';
  }

  private async trackExpense(input: Record<string, unknown>): Promise<Expense> {
    const amount = input.amount as number;
    const category = input.category as string;
    const description = input.description as string;
    const vendor = input.vendor as string;
    const date = input.date as string || new Date().toISOString();

    if (!this.categories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    const expense: Expense = {
      id: `exp_${Date.now()}`,
      amount,
      category,
      description,
      date: new Date(date),
      vendor,
      status: 'pending',
    };

    this.expenses.set(expense.id, expense);

    await this.memory.store({
      type: 'knowledge',
      content: `Expense tracked: $${amount} for ${category}`,
      importance: 0.5,
      tags: ['finance', 'expense'],
      metadata: { expenseId: expense.id, amount },
    });

    return expense;
  }

  private async createInvoice(input: Record<string, unknown>): Promise<Invoice> {
    const client = input.client as string;
    const items = (input.items as Array<{ description: string; quantity: number; price: number }>) || [];
    const dueDays = (input.dueDays as number) || 30;

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      client,
      amount: total,
      items,
      status: 'draft',
      dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    this.invoices.set(invoice.id, invoice);

    return invoice;
  }

  private async getFinancials(input: Record<string, unknown>): Promise<FinancialReport> {
    const period = (input.period as string) || 'monthly';
    const startDate = input.startDate ? new Date(input.startDate as string) : this.getPeriodStart(period);
    const endDate = input.endDate ? new Date(input.endDate as string) : new Date();

    const periodExpenses = Array.from(this.expenses.values())
      .filter(e => e.date >= startDate && e.date <= endDate);

    const revenue = Array.from(this.invoices.values())
      .filter(i => i.status === 'paid' && i.createdAt >= startDate && i.createdAt <= endDate)
      .reduce((sum, i) => sum + i.amount, 0);

    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const breakdown: Record<string, number> = {};
    for (const expense of periodExpenses) {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    }

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      breakdown,
    };
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const day = now.getDay();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  private async forecast(input: Record<string, unknown>): Promise<{
    period: string;
    projectedRevenue: number;
    projectedExpenses: number;
    projectedProfit: number;
    assumptions: string[];
  }> {
    const months = (input.months as number) || 3;
    const financials = await this.getFinancials({ period: 'monthly' });

    const avgRevenue = financials.revenue;
    const avgExpenses = financials.expenses;

    const growthRate = 0.1;
    const expenseGrowthRate = 0.05;

    const projectedRevenue = avgRevenue * months * (1 + growthRate);
    const projectedExpenses = avgExpenses * months * (1 + expenseGrowthRate);

    return {
      period: `Next ${months} months`,
      projectedRevenue: Math.round(projectedRevenue),
      projectedExpenses: Math.round(projectedExpenses),
      projectedProfit: Math.round(projectedRevenue - projectedExpenses),
      assumptions: [
        `Revenue growth: ${growthRate * 100}% per period`,
        `Expense growth: ${expenseGrowthRate * 100}% per period`,
        'Based on historical averages',
      ],
    };
  }

  private async expenseReport(input: Record<string, unknown>): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byVendor: Record<string, number>;
    topExpenses: Expense[];
  }> {
    const period = input.period as string || 'monthly';
    const startDate = this.getPeriodStart(period);

    const periodExpenses = Array.from(this.expenses.values())
      .filter(e => e.date >= startDate);

    const byCategory: Record<string, number> = {};
    const byVendor: Record<string, number> = {};
    let total = 0;

    for (const expense of periodExpenses) {
      total += expense.amount;
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
      if (expense.vendor) {
        byVendor[expense.vendor] = (byVendor[expense.vendor] || 0) + expense.amount;
      }
    }

    const topExpenses = periodExpenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return { total, byCategory, byVendor, topExpenses };
  }

  private async handleGenericFinance(task: Task): Promise<string> {
    return `Finance task completed: ${task.title}`;
  }

  getExpenses(): Expense[] {
    return Array.from(this.expenses.values());
  }

  getInvoices(): Invoice[] {
    return Array.from(this.invoices.values());
  }

  updateInvoiceStatus(id: string, status: Invoice['status']): boolean {
    const invoice = this.invoices.get(id);
    if (invoice) {
      invoice.status = status;
      return true;
    }
    return false;
  }

  protected getCapabilities(): string[] {
    return ['expenses', 'invoicing', 'forecasting', 'financial_reports'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 2,
      timeoutMs: 60000,
      retryAttempts: 2,
      autoApprove: false,
      approvalThreshold: 500,
    };
  }
}