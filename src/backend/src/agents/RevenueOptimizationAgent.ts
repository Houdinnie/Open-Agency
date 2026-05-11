import { v4 as uuidv4 } from 'uuid';
import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual' | 'one-time';
  features: string[];
  targetSegment: string;
  conversionRate: number;
  popular: boolean;
}

export interface PricingExperiment {
  id: string;
  name: string;
  variant: 'A' | 'B' | 'C';
  originalPrice: number;
  newPrice: number;
  duration: number;
  status: 'running' | 'completed' | 'paused';
  results?: ExperimentResults;
  startedAt: Date;
}

export interface ExperimentResults {
  conversions: number;
  revenue: number;
  lift: number;
  confidence: number;
  winner: 'original' | 'variant';
}

export interface PriceRecommendation {
  id: string;
  type: 'adjust_price' | 'create_tier' | 'bundle_offers' | 'discount_strategy' | 'positioning';
  description: string;
  expectedImpact: number;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  autoExecutable: boolean;
  details: Record<string, unknown>;
}

export interface MarketPriceData {
  competitor: string;
  price: number;
  features: string[];
  positioning: string;
}

export class RevenueOptimizationAgent extends BaseAgent {
  private tiers: Map<string, PricingTier> = new Map();
  private experiments: Map<string, PricingExperiment> = new Map();
  private recommendations: PriceRecommendation[] = [];
  private maxPriceChangeWithoutApproval = 0.15;
  private maxDiscountWithoutApproval = 0.20;

  constructor(memory: MemorySystem) {
    super('Revenue Optimization Agent', 'finance', memory);
    this.initializeDefaultTiers();
  }

  private initializeDefaultTiers(): void {
    const defaultTiers: PricingTier[] = [
      {
        id: 'starter',
        name: 'Starter',
        price: 49,
        interval: 'monthly',
        features: ['Basic automation', '5 agents', 'Email support'],
        targetSegment: 'small-business',
        conversionRate: 0.12,
        popular: false,
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 149,
        interval: 'monthly',
        features: ['Full automation', 'Unlimited agents', 'Priority support', 'Advanced analytics'],
        targetSegment: 'growing-business',
        conversionRate: 0.18,
        popular: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 499,
        interval: 'monthly',
        features: ['Custom solutions', 'Dedicated manager', '24/7 support', 'SLA', 'API access'],
        targetSegment: 'enterprise',
        conversionRate: 0.08,
        popular: false,
      },
    ];
    defaultTiers.forEach(t => this.tiers.set(t.id, t));
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'analyze-pricing':
          result = await this.analyzePricing(task.input);
          break;
        case 'recommend':
          result = await this.generateRecommendations(task.input);
          break;
        case 'run-experiment':
          result = await this.runPricingExperiment(task.input);
          break;
        case 'optimize-tiers':
          result = await this.optimizeTiers(task.input);
          break;
        case 'analyze-competitors':
          result = await this.analyzeCompetitorPricing(task.input);
          break;
        case 'calculate-ltv-pricing':
          result = await this.calculateLTVBasedPricing(task.input);
          break;
        case 'assess-price-elasticity':
          result = await this.assessPriceElasticity(task.input);
          break;
        case 'approve-pricing':
          result = await this.approvePricingChange(task.input);
          break;
        default:
          result = await this.handleGenericPricing(task);
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
    return task.input?.category === 'pricing' || task.type === 'analysis';
  }

  private async analyzePricing(input: Record<string, unknown>): Promise<{
    currentRevenue: number;
    avgRevenuePerUser: number;
    conversionRate: number;
    churnImpact: number;
    recommendations: string[];
  }> {
    const tiers = Array.from(this.tiers.values());
    
    let totalRevenue = 0;
    let totalUsers = 0;
    let weightedConversion = 0;

    for (const tier of tiers) {
      const estimatedUsers = Math.floor(Math.random() * 100) + 20;
      totalRevenue += tier.price * estimatedUsers;
      totalUsers += estimatedUsers;
      weightedConversion += tier.conversionRate * estimatedUsers;
    }

    const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const overallConversion = totalUsers > 0 ? weightedConversion / totalUsers : 0;

    const recommendations = [
      'Professional tier shows highest conversion - consider featuring more prominently',
      'Enterprise tier conversion low - may need sales qualification review',
      'Starter tier good for acquisition - optimize for upgrades',
    ];

    return {
      currentRevenue: totalRevenue,
      avgRevenuePerUser,
      conversionRate: overallConversion * 100,
      churnImpact: -5.2,
      recommendations,
    };
  }

  private async generateRecommendations(input: Record<string, unknown>): Promise<{
    recommendations: PriceRecommendation[];
    priority: 'immediate' | 'short-term' | 'long-term';
  }> {
    const recommendations: PriceRecommendation[] = [];

    const tierAnalysis = await this.analyzePricing({});
    
    if (tierAnalysis.conversionRate < 15) {
      recommendations.push({
        id: uuidv4(),
        type: 'adjust_price',
        description: 'Lower starter tier price to improve acquisition funnel',
        expectedImpact: 12,
        risk: 'medium',
        requiresApproval: false,
        autoExecutable: true,
        details: { currentPrice: 49, suggestedPrice: 39 },
      });
    }

    const enterpriseConv = this.tiers.get('enterprise')?.conversionRate || 0;
    if (enterpriseConv < 0.10) {
      recommendations.push({
        id: uuidv4(),
        type: 'create_tier',
        description: 'Create mid-tier between Professional and Enterprise to capture more value',
        expectedImpact: 25,
        risk: 'medium',
        requiresApproval: true,
        autoExecutable: false,
        details: { suggestedPrice: 299, features: ['Higher limits', 'Custom integrations'] },
      });
    }

    recommendations.push({
      id: uuidv4(),
      type: 'bundle_offers',
      description: 'Bundle annual pricing with 2 months free - increases cash flow',
      expectedImpact: 18,
      risk: 'low',
      requiresApproval: false,
      autoExecutable: true,
      details: { discount: '17%', target: 'annual' },
    });

    this.recommendations = recommendations;

    return { recommendations, priority: 'immediate' };
  }

  private async runPricingExperiment(input: Record<string, unknown>): Promise<PricingExperiment> {
    const tierId = input.tierId as string;
    const variant = (input.variant as 'A' | 'B' | 'C') || 'B';
    const priceChange = (input.priceChange as number) || 0.15;

    const tier = this.tiers.get(tierId);
    if (!tier) {
      throw new Error(`Tier ${tierId} not found`);
    }

    const experiment: PricingExperiment = {
      id: `exp_${Date.now()}`,
      name: `Price test for ${tier.name}`,
      variant,
      originalPrice: tier.price,
      newPrice: Math.round(tier.price * (1 + priceChange)),
      duration: 14,
      status: 'running',
      startedAt: new Date(),
    };

    this.experiments.set(experiment.id, experiment);

    await this.memory.store({
      type: 'knowledge',
      content: `Started pricing experiment: ${experiment.name} - ${tier.price} → ${experiment.newPrice}`,
      importance: 0.7,
      tags: ['pricing', 'experiment'],
      metadata: { experimentId: experiment.id },
    });

    return experiment;
  }

  private async optimizeTiers(input: Record<string, unknown>): Promise<{
    optimized: PricingTier[];
    expectedLift: number;
  }> {
    const tiers = Array.from(this.tiers.values());
    const optimized: PricingTier[] = [];

    for (const tier of tiers) {
      const optimizedTier = { ...tier };
      
      if (tier.conversionRate > 0.15 && tier.price < 500) {
        const priceIncrease = Math.min(tier.price * 0.10, 50);
        optimizedTier.price = Math.round(tier.price + priceIncrease);
      }

      if (tier.id === 'professional' && tier.popular) {
        optimizedTier.features.push('AI-powered insights');
      }

      optimized.push(optimizedTier);
      this.tiers.set(tier.id, optimizedTier);
    }

    return { optimized, expectedLift: 12.5 };
  }

  private async analyzeCompetitorPricing(input: Record<string, unknown>): Promise<{
    competitors: MarketPriceData[];
    ourPosition: string;
    opportunities: string[];
  }> {
    const competitors: MarketPriceData[] = [
      { competitor: 'Competitor A', price: 199, features: ['Automation', 'Analytics'], positioning: 'mid-market' },
      { competitor: 'Competitor B', price: 299, features: ['Full suite', 'Priority'], positioning: 'enterprise' },
      { competitor: 'Competitor C', price: 79, features: ['Basic'], positioning: 'budget' },
    ];

    const ourProfessional = this.tiers.get('professional');
    const opportunities = [
      'Competitor A lacks AI features - position on intelligence',
      'Competitor B expensive - offer better value at lower price',
      'Competitor C cheap but limited - capture their upgraders',
    ];

    return {
      competitors,
      ourPosition: 'Value leader in mid-market',
      opportunities,
    };
  }

  private async calculateLTVBasedPricing(input: Record<string, unknown>): Promise<{
    customerSegment: string;
    ltv: number;
    suggestedPrice: number;
    rationale: string;
  }> {
    const segments = [
      { segment: 'starter', ltv: 588, cac: 150, margin: 0.7 },
      { segment: 'professional', ltv: 2142, cac: 300, margin: 0.75 },
      { segment: 'enterprise', ltv: 11976, cac: 1200, margin: 0.8 },
    ];

    const segment = segments.find(s => s.segment === (input.segment as string)) || segments[1];
    const targetLTV = segment.ltv * 0.3;
    const suggestedPrice = Math.round((segment.cac + targetLTV * segment.margin) / 12);

    return {
      customerSegment: segment.segment,
      ltv: segment.ltv,
      suggestedPrice,
      rationale: `Based on ${segment.ltv} LTV, ${segment.margin * 100}% margin target, and CAC of ${segment.cac}`,
    };
  }

  private async assessPriceElasticity(input: Record<string, unknown>): Promise<{
    elasticity: number;
    optimalPriceRange: { min: number; max: number };
    recommendation: string;
  }> {
    const elasticity = Math.random() * 0.8 + 0.5;
    
    const tierId = input.tierId as string;
    const currentPrice = this.tiers.get(tierId)?.price || 100;
    
    const priceRange = {
      min: Math.round(currentPrice * (1 - elasticity * 0.2)),
      max: Math.round(currentPrice * (1 + elasticity * 0.15)),
    };

    return {
      elasticity,
      optimalPriceRange: priceRange,
      recommendation: elasticity > 1 
        ? 'Price sensitive - small changes significantly impact volume'
        : 'Inelastic - can increase prices without volume loss',
    };
  }

  private async approvePricingChange(input: Record<string, unknown>): Promise<{
    approved: boolean;
    approvedBy: string;
    changesApplied: string[];
  }> {
    const changeAmount = input.changeAmount as number;
    const isDiscount = input.isDiscount as boolean;
    
    const threshold = isDiscount 
      ? this.maxDiscountWithoutApproval 
      : this.maxPriceChangeWithoutApproval;

    const approved = Math.abs(changeAmount) <= threshold;

    return {
      approved,
      approvedBy: 'Revenue Optimization Agent',
      changesApplied: approved ? ['Price updated in system'] : ['Requires manual approval'],
    };
  }

  private async handleGenericPricing(task: Task): Promise<string> {
    return `Pricing task completed: ${task.title}`;
  }

  getTiers(): PricingTier[] {
    return Array.from(this.tiers.values());
  }

  getExperiments(): PricingExperiment[] {
    return Array.from(this.experiments.values());
  }

  getRecommendations(): PriceRecommendation[] {
    return this.recommendations;
  }

  setApprovalThreshold(type: 'price_increase' | 'discount', value: number): void {
    if (type === 'price_increase') {
      this.maxPriceChangeWithoutApproval = value;
    } else {
      this.maxDiscountWithoutApproval = value;
    }
  }

  protected getCapabilities(): string[] {
    return ['pricing_analysis', 'price_optimization', 'competitor_tracking', 'experiment_management', 'ltv_calculations'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 2,
      timeoutMs: 60000,
      retryAttempts: 1,
      autoApprove: false,
      approvalThreshold: 500,
    };
  }
}