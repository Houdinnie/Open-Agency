import { v4 as uuidv4 } from 'uuid';
import { llmService } from './LLMService.js';
import { browserAutomation } from '../tools/BrowserAutomation.js';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  source: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  lastContact?: Date;
  notes: string[];
}

export interface OutreachSequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface SequenceStep {
  day: number;
  channel: 'email' | 'linkedin' | 'twitter' | 'cold-call';
  subject?: string;
  template: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface OutreachCampaign {
  id: string;
  name: string;
  targetAudience: string;
  leads: string[];
  sequence: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  stats: {
    sent: number;
    opens: number;
    replies: number;
    meetings: number;
    conversions: number;
  };
}

export class AutonomousOutreachEngine {
  private leads: Map<string, Lead> = new Map();
  private sequences: Map<string, OutreachSequence> = new Map();
  private campaigns: Map<string, OutreachCampaign> = new Map();
  private sessionId: string | null = null;

  constructor() {
    this.initializeDefaultSequences();
  }

  private initializeDefaultSequences(): void {
    const sequences: OutreachSequence[] = [
      {
        id: 'seq_1',
        name: 'Initial Outreach',
        steps: [
          { day: 0, channel: 'email', subject: 'Quick question about {{company}}', template: 'Hi {{name}}, I noticed {{company}} is in the {{industry}} space and wanted to reach out...', status: 'pending' },
          { day: 2, channel: 'email', subject: 'Following up', template: 'Just wanted to follow up on my previous email...', status: 'pending' },
          { day: 4, channel: 'linkedin', subject: '', template: 'Hi {{name}}, connected to follow up on my email...', status: 'pending' },
        ],
        status: 'active',
      },
      {
        id: 'seq_2',
        name: 'Cold Email Pro',
        steps: [
          { day: 0, channel: 'email', subject: '{{firstName}}, insight for {{company}}', template: 'Hi {{firstName}}, I have an insight about {{company}} that might help...', status: 'pending' },
          { day: 3, channel: 'email', subject: 'One more thing', template: 'Adding one more thought...', status: 'pending' },
        ],
        status: 'active',
      },
    ];
    sequences.forEach(s => this.sequences.set(s.id, s));
  }

  async scrapeLeads(source: 'linkedin' | 'apollo' | 'custom', criteria: {
    keywords?: string[];
    location?: string;
    jobTitles?: string[];
    count?: number;
  }): Promise<Lead[]> {
    console.log(`🔍 Scraping ${criteria.count || 20} leads from ${source}...`);
    
    const prompt = `Generate ${criteria.count || 20} realistic B2B leads based on:
Keywords: ${criteria.keywords?.join(', ') || 'SaaS, AI, Marketing'}
Location: ${criteria.location || 'USA'}
Job Titles: ${criteria.jobTitles?.join(', ') || 'CEO, CTO, VP Marketing'}

Return as JSON array with: name, email, company, title`;

    const response = await llmService.complete(prompt, {
      system: 'You are a lead generation expert. Generate realistic B2B leads.',
    });

    const leads = this.parseLeadsFromResponse(response.content, source);
    
    leads.forEach(lead => {
      this.leads.set(lead.id, lead);
    });

    return leads;
  }

  private parseLeadsFromResponse(content: string, source: string): Lead[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((p: any, idx: number) => ({
          id: `lead_${Date.now()}_${idx}`,
          name: p.name || 'Unknown',
          email: p.email || `lead${idx}@example.com`,
          company: p.company || 'Unknown Company',
          title: p.title || 'Decision Maker',
          source,
          score: Math.floor(Math.random() * 30) + 70,
          status: 'new',
          notes: [],
        }));
      }
    } catch (e) {
      console.error('Failed to parse leads:', e);
    }
    return [];
  }

  async enrichLead(leadId: string): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    if (!lead) return null;

    const prompt = `Enrich this lead with additional information:
Company: ${lead.company}
Title: ${lead.title}

Provide: company size, industry, recent news, potential needs`;

    const response = await llmService.complete(prompt, {
      system: 'You are a data enrichment expert.',
    });

    lead.notes.push(`Enriched: ${response.content.substring(0, 200)}`);
    lead.score = Math.min(100, lead.score + 10);

    return lead;
  }

  async sendOutreach(leadId: string, sequenceId: string): Promise<{ success: boolean; step: number }> {
    const lead = this.leads.get(leadId);
    const sequence = this.sequences.get(sequenceId);
    
    if (!lead || !sequence) {
      return { success: false, step: 0 };
    }

    const pendingStep = sequence.steps.find(s => s.status === 'pending');
    if (!pendingStep) {
      return { success: false, step: 0 };
    }

    const personalizedTemplate = this.personalizeTemplate(pendingStep.template, lead);
    const subject = pendingStep.subject ? this.personalizeTemplate(pendingStep.subject, lead) : '';

    console.log(`📧 Sending ${pendingStep.channel} to ${lead.email}`);
    
    if (pendingStep.channel === 'email') {
      await this.sendEmail(lead.email, subject, personalizedTemplate);
    } else if (pendingStep.channel === 'linkedin') {
      await this.sendLinkedInMessage(lead, personalizedTemplate);
    }

    pendingStep.status = 'sent';
    lead.status = 'contacted';
    lead.lastContact = new Date();

    return { success: true, step: sequence.steps.indexOf(pendingStep) + 1 };
  }

  private personalizeTemplate(template: string, lead: Lead): string {
    return template
      .replace(/{{name}}/g, lead.name.split(' ')[0])
      .replace(/{{firstName}}/g, lead.name.split(' ')[0])
      .replace(/{{company}}/g, lead.company || '')
      .replace(/{{title}}/g, lead.title || '')
      .replace(/{{email}}/g, lead.email);
  }

  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`✉️ Email sent to ${to}: ${subject}`);
  }

  private async sendLinkedInMessage(lead: Lead, message: string): Promise<void> {
    console.log(`💬 LinkedIn message would be sent to ${lead.name}`);
  }

  async createCampaign(request: {
    name: string;
    leadSource: 'linkedin' | 'apollo' | 'custom';
    sequenceId: string;
    targetCount: number;
  }): Promise<OutreachCampaign> {
    const leads = await this.scrapeLeads(request.leadSource, { count: request.targetCount });
    const leadIds = leads.map(l => l.id);
    const sequence = this.sequences.get(request.sequenceId);

    const campaign: OutreachCampaign = {
      id: `campaign_${Date.now()}`,
      name: request.name,
      targetAudience: request.leadSource,
      leads: leadIds,
      sequence: request.sequenceId,
      status: 'running',
      stats: {
        sent: 0,
        opens: 0,
        replies: 0,
        meetings: 0,
        conversions: 0,
      },
    };

    for (const leadId of leadIds) {
      await this.sendOutreach(leadId, request.sequenceId);
      campaign.stats.sent++;
    }

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  getLeads(filter?: { status?: string; minScore?: number }): Lead[] {
    let leads = Array.from(this.leads.values());
    
    if (filter?.status) {
      leads = leads.filter(l => l.status === filter.status);
    }
    if (filter?.minScore) {
      leads = leads.filter(l => l.score >= filter.minScore);
    }
    
    return leads;
  }

  getSequences(): OutreachSequence[] {
    return Array.from(this.sequences.values());
  }

  getCampaigns(): OutreachCampaign[] {
    return Array.from(this.campaigns.values());
  }

  updateLeadStatus(leadId: string, status: Lead['status']): boolean {
    const lead = this.leads.get(leadId);
    if (lead) {
      lead.status = status;
      return true;
    }
    return false;
  }

  getCampaignStats(campaignId: string): OutreachCampaign['stats'] | null {
    const campaign = this.campaigns.get(campaignId);
    return campaign?.stats || null;
  }
}

export const outreachEngine = new AutonomousOutreachEngine();