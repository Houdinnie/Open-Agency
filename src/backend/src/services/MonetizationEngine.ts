import { v4 as uuidv4 } from 'uuid';

export interface RevenueStream {
  id: string;
  name: string;
  type: 'seo' | 'outreach' | 'ads' | 'affiliate' | 'services';
  status: 'active' | 'paused' | 'testing';
  revenue: number;
  costs: number;
  roi: number;
  metrics: Record<string, number>;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'churned' | 'trial';
  monthlyValue: number;
  startDate: Date;
  services: string[];
}

export interface Campaign {
  id: string;
  name: string;
  type: 'seo' | 'outreach' | 'ads' | 'content';
  status: 'draft' | 'running' | 'paused' | 'completed';
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
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

export class MonetizationEngine {
  private revenueStreams: Map<string, RevenueStream> = new Map();
  private clients: Map<string, Client> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private totalRevenue = 0;
  private totalCosts = 0;

  constructor() {
    this.initializeRevenueStreams();
    this.initializeDemoClients();
  }

  private initializeRevenueStreams(): void {
    const streams: RevenueStream[] = [
      { id: 'seo', name: 'SEO Services', type: 'seo', status: 'active', revenue: 0, costs: 0, roi: 0, metrics: { visits: 0, leads: 0, conversions: 0 } },
      { id: 'outreach', name: 'Outreach Agency', type: 'outreach', status: 'active', revenue: 0, costs: 0, roi: 0, metrics: { emails: 0, responses: 0, meetings: 0 } },
      { id: 'ads', name: 'Ad Management', type: 'ads', status: 'active', revenue: 0, costs: 0, roi: 0, metrics: { spend: 0, clicks: 0, conversions: 0 } },
      { id: 'affiliate', name: 'Affiliate Revenue', type: 'affiliate', status: 'active', revenue: 0, costs: 0, roi: 0, metrics: { clicks: 0, sales: 0, commission: 0 } },
    ];
    streams.forEach(s => this.revenueStreams.set(s.id, s));
  }

  private initializeDemoClients(): void {
    const demoClients: Client[] = [
      { id: 'c1', name: 'TechStart Inc', email: 'contact@techstart.io', plan: 'professional', status: 'active', monthlyValue: 1500, startDate: new Date('2025-01-15'), services: ['seo', 'outreach'] },
      { id: 'c2', name: 'GrowthLabs', email: 'hello@growthlabs.co', plan: 'enterprise', status: 'active', monthlyValue: 5000, startDate: new Date('2024-11-01'), services: ['seo', 'ads', 'outreach'] },
      { id: 'c3', name: 'SmallBiz Co', email: 'owner@smallbiz.com', plan: 'starter', status: 'trial', monthlyValue: 0, startDate: new Date('2026-05-01'), services: ['seo'] },
    ];
    demoClients.forEach(c => this.clients.set(c.id, c));
  }

  trackRevenue(streamId: string, amount: number): void {
    const stream = this.revenueStreams.get(streamId);
    if (stream) {
      stream.revenue += amount;
      stream.roi = stream.revenue > 0 && stream.costs > 0 ? ((stream.revenue - stream.costs) / stream.costs) * 100 : 0;
    }
    this.totalRevenue += amount;
  }

  trackCost(streamId: string, amount: number): void {
    const stream = this.revenueStreams.get(streamId);
    if (stream) {
      stream.costs += amount;
      stream.roi = stream.revenue > 0 && stream.costs > 0 ? ((stream.revenue - stream.costs) / stream.costs) * 100 : 0;
    }
    this.totalCosts += amount;
  }

  getFinancialMetrics(): FinancialMetrics {
    const activeClients = Array.from(this.clients.values()).filter(c => c.status === 'active');
    const mrr = activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
    const arr = mrr * 12;
    const churnedClients = Array.from(this.clients.values()).filter(c => c.status === 'churned').length;
    const churnRate = this.clients.size > 0 ? (churnedClients / this.clients.size) * 100 : 0;
    
    const avgLTV = activeClients.reduce((sum, c) => sum + c.monthlyValue * 12, 0) / Math.max(1, activeClients.length);
    const cac = this.totalCosts / Math.max(1, activeClients.length);

    return {
      totalRevenue: this.totalRevenue,
      totalCosts: this.totalCosts,
      netProfit: this.totalRevenue - this.totalCosts,
      profitMargin: this.totalRevenue > 0 ? ((this.totalRevenue - this.totalCosts) / this.totalRevenue) * 100 : 0,
      mrr,
      arr,
      churnRate,
      ltv: avgLTV,
      cac,
    };
  }

  getRevenueStreams(): RevenueStream[] {
    return Array.from(this.revenueStreams.values());
  }

  getClients(): Client[] {
    return Array.from(this.clients.values());
  }

  addClient(client: Omit<Client, 'id'>): Client {
    const newClient: Client = { ...client, id: `client_${Date.now()}` };
    this.clients.set(newClient.id, newClient);
    return newClient;
  }

  createCampaign(campaign: Omit<Campaign, 'id'>): Campaign {
    const newCampaign: Campaign = { ...campaign, id: `camp_${Date.now()}` };
    this.campaigns.set(newCampaign.id, newCampaign);
    return newCampaign;
  }

  getCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  updateCampaignMetrics(campaignId: string, metrics: Partial<Campaign>): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      Object.assign(campaign, metrics);
    }
  }

  projectRevenue(months: number = 6): { month: string; projected: number }[] {
    const currentMRR = this.getFinancialMetrics().mrr;
    const growthRate = 0.15;
    const projections = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const projected = Math.round(currentMRR * Math.pow(1 + growthRate, i));
      projections.push({
        month: date.toISOString().slice(0, 7),
        projected,
      });
    }

    return projections;
  }
}

export const monetizationEngine = new MonetizationEngine();