import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  source: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  notes: string[];
}

interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'linkedin' | 'cold_email';
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
}

export class SalesAgent extends BaseAgent {
  private leads: Map<string, Lead> = new Map();
  private templates: Map<string, OutreachTemplate> = new Map();

  constructor(memory: MemorySystem) {
    super('Sales Agent', 'sales', memory);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.templates.set('initial-outreach', {
      id: 'initial-outreach',
      name: 'Initial Outreach',
      subject: 'Quick question about {{company}}',
      body: `Hi {{name}},

{{custom_message}}

I'd love to learn more about your current challenges and see if we can help.

Best,
{{sender}}`,
      type: 'email',
    });

    this.templates.set('follow-up', {
      id: 'follow-up',
      name: 'Follow Up',
      subject: 'Following up on {{topic}}',
      body: `Hi {{name}},

Just wanted to follow up on my previous message. Do you have a few minutes to chat?

Best,
{{sender}}`,
      type: 'email',
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'generate-leads':
          result = await this.generateLeads(task.input);
          break;
        case 'score-leads':
          result = await this.scoreLeads(task.input);
          break;
        case 'send-outreach':
          result = await this.sendOutreach(task.input);
          break;
        case 'create-sequence':
          result = await this.createSequence(task.input);
          break;
        case 'update-pipeline':
          result = await this.updatePipeline(task.input);
          break;
        case 'generate-proposal':
          result = await this.generateProposal(task.input);
          break;
        case 'analyze-pipeline':
          result = await this.analyzePipeline();
          break;
        default:
          result = await this.handleGenericSales(task);
      }

      return {
        success: true,
        output: result,
        metrics: { duration: Date.now() - startTime, toolCalls: 1 },
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
    return task.type === 'outreach' || task.input?.category === 'sales';
  }

  private async generateLeads(input: Record<string, unknown>): Promise<Lead[]> {
    const criteria = input.criteria as string;
    const count = (input.count as number) || 10;
    const source = (input.source as string) || 'research';

    const prompt = `Generate ${count} leads based on criteria: ${criteria}
For each lead provide: name, email, company (if applicable), role.
Return as JSON array with these fields.`;

    const response = await llmService.complete(prompt, {
      system: 'You are a lead generation expert. Generate realistic B2B leads.',
    });

    const leads = this.parseLeadsFromResponse(response.content);
    
    for (const lead of leads) {
      lead.source = source;
      lead.status = 'new';
      this.leads.set(lead.id, lead);
    }

    await this.memory.store({
      type: 'knowledge',
      content: `Generated ${leads.length} new leads`,
      importance: 0.6,
      tags: ['leads', 'sales'],
      metadata: { count: leads.length },
    });

    return leads;
  }

  private parseLeadsFromResponse(content: string): Lead[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((p: any) => ({
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: p.name || 'Unknown',
          email: p.email || '',
          company: p.company || '',
          source: 'generated',
          score: Math.floor(Math.random() * 50) + 50,
          status: 'new',
          notes: [],
        }));
      }
    } catch (e) {}
    return [];
  }

  private async scoreLeads(input: Record<string, unknown>): Promise<Lead[]> {
    const leadIds = (input.leadIds as string[]) || [];
    const leads = leadIds.map(id => this.leads.get(id)).filter(Boolean) as Lead[];

    for (const lead of leads) {
      const prompt = `Score this lead from 0-100:
Name: ${lead.name}
Company: ${lead.company || 'N/A'}
Source: ${lead.source}

Consider: company fit, role relevance, engagement signals.`;

      const response = await llmService.complete(prompt, {
        system: 'Score leads based on conversion likelihood.',
      });

      const scoreMatch = response.content.match(/(\d+)/);
      lead.score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    }

    return leads.sort((a, b) => b.score - a.score);
  }

  private async sendOutreach(input: Record<string, unknown>): Promise<{
    success: boolean;
    template: string;
    leads: string[];
  }> {
    const leadIds = (input.leadIds as string[]) || [];
    const templateId = (input.templateId as string) || 'initial-outreach';
    const customMessage = input.customMessage as string;
    const sender = (input.sender as string) || 'Atlas';

    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const leads = leadIds.map(id => this.leads.get(id)).filter(Boolean) as Lead[];
    const sentLeads: string[] = [];

    for (const lead of leads) {
      const personalizedBody = template.body
        .replace(/{{name}}/g, lead.name)
        .replace(/{{company}}/g, lead.company || '')
        .replace(/{{custom_message}}/g, customMessage || '')
        .replace(/{{sender}}/g, sender);

      console.log(`📧 Sending to ${lead.email}: ${template.subject}`);

      lead.status = 'contacted';
      lead.notes.push(`Outreach sent: ${template.name}`);
      sentLeads.push(lead.id);
    }

    await this.memory.store({
      type: 'interaction',
      content: `Outreach sent to ${sentLeads.length} leads`,
      importance: 0.7,
      tags: ['outreach', 'sales'],
      metadata: { count: sentLeads.length },
    });

    return {
      success: true,
      template: template.name,
      leads: sentLeads,
    };
  }

  private async createSequence(input: Record<string, unknown>): Promise<{
    name: string;
    steps: Array<{ day: number; action: string; template: string }>;
  }> {
    const goal = input.goal as string;
    const steps = (input.steps as number) || 5;

    const prompt = `Create a ${steps}-step outreach sequence for: ${goal}
For each step specify: day offset, action (email/follow-up/call), and template type.
Return as JSON array.`;

    const response = await llmService.complete(prompt);

    return {
      name: `${goal} Sequence`,
      steps: this.parseSequenceSteps(response.content, steps),
    };
  }

  private parseSequenceSteps(content: string, count: number): Array<{ day: number; action: string; template: string }> {
    const steps = [];
    for (let i = 1; i <= count; i++) {
      steps.push({
        day: i * 2,
        action: i % 2 === 0 ? 'follow-up' : 'email',
        template: i % 2 === 0 ? 'follow-up' : 'initial-outreach',
      });
    }
    return steps;
  }

  private async updatePipeline(input: Record<string, unknown>): Promise<{ success: boolean }> {
    const leadId = input.leadId as string;
    const newStatus = input.status as Lead['status'];

    const lead = this.leads.get(leadId);
    if (!lead) {
      return { success: false };
    }

    lead.status = newStatus;
    lead.notes.push(`Status updated to ${newStatus}`);

    return { success: true };
  }

  private async generateProposal(input: Record<string, unknown>): Promise<{
    title: string;
    summary: string;
    pricing: Array<{ tier: string; price: number; features: string[] }>;
    nextSteps: string[];
  }> {
    const leadId = input.leadId as string;
    const requirements = input.requirements as string;

    const lead = this.leads.get(leadId);

    const prompt = `Generate a proposal for: ${lead?.name || 'Client'}
Requirements: ${requirements}

Include: title, executive summary, 3 pricing tiers, next steps.`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      title: `Proposal for ${lead?.company || 'Client'}`,
      summary: this.extractSummary(response.content),
      pricing: this.extractPricing(response.content),
      nextSteps: ['Schedule call', 'Review proposal', 'Sign agreement'],
    };
  }

  private extractSummary(content: string): string {
    const match = content.match(/summary[:\s]+([\s\S]{0,200})/i);
    return match?.[1]?.trim() || 'Custom proposal based on requirements';
  }

  private extractPricing(content: string): Array<{ tier: string; price: number; features: string[] }> {
    return [
      { tier: 'Starter', price: 500, features: ['Basic features', 'Email support'] },
      { tier: 'Professional', price: 1500, features: ['All features', 'Priority support', 'Analytics'] },
      { tier: 'Enterprise', price: 5000, features: ['Custom solution', 'Dedicated manager', '24/7 support'] },
    ];
  }

  private async analyzePipeline(): Promise<{
    total: number;
    stages: PipelineStage[];
    conversionRate: number;
    avgDealSize: number;
    forecast: number;
  }> {
    const leads = Array.from(this.leads.values());
    const byStatus: Record<string, { count: number; value: number }> = {};

    for (const lead of leads) {
      if (!byStatus[lead.status]) {
        byStatus[lead.status] = { count: 0, value: 0 };
      }
      byStatus[lead.status].count++;
    }

    const stages: PipelineStage[] = [
      { name: 'New', count: byStatus.new?.count || 0, value: 0 },
      { name: 'Contacted', count: byStatus.contacted?.count || 0, value: 0 },
      { name: 'Qualified', count: byStatus.qualified?.count || 0, value: 10000 },
      { name: 'Proposal', count: byStatus.proposal?.count || 0, value: 25000 },
      { name: 'Won', count: byStatus.won?.count || 0, value: 50000 },
    ];

    const totalQualified = stages.filter(s => s.name !== 'New' && s.name !== 'Contacted').reduce((s, s) => s.count + s.count, 0);
    const conversionRate = leads.length > 0 ? (byStatus.won?.count || 0) / leads.length * 100 : 0;

    return {
      total: leads.length,
      stages,
      conversionRate,
      avgDealSize: 2500,
      forecast: stages.reduce((sum, s) => sum + s.value, 0),
    };
  }

  private async handleGenericSales(task: Task): Promise<string> {
    const prompt = `Handle sales task: ${task.title}\n${task.description}`;
    const response = await llmService.completeWithContext(prompt, this.getContext());
    return response.content;
  }

  private getContext(): string {
    return `You are the Sales Agent for Atlas. Specialize in lead generation, outreach, pipeline management, and proposal generation.`;
  }

  protected getCapabilities(): string[] {
    return ['lead_gen', 'outreach', 'pipeline', 'proposals', 'followup'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 3,
      timeoutMs: 60000,
      retryAttempts: 2,
      autoApprove: false,
      approvalThreshold: 200,
    };
  }

  getLeads(): Lead[] {
    return Array.from(this.leads.values());
  }
}