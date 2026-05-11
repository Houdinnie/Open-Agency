import { Task, TaskResult, AgentType } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

interface ContentPiece {
  title: string;
  body: string;
  type: 'blog' | 'social' | 'email' | 'ad';
  keywords: string[];
  cta?: string;
}

interface SEOMetrics {
  score: number;
  suggestions: string[];
}

export class MarketingAgent extends BaseAgent {
  private defaultTone = 'professional';
  private contentTemplates: Map<string, string> = new Map();

  constructor(memory: MemorySystem) {
    super('Marketing Agent', 'marketing', memory);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.contentTemplates.set('blog-intro', 'Write an engaging intro for: {{topic}}');
    this.contentTemplates.set('social-post', 'Create a catchy social post about: {{topic}}');
    this.contentTemplates.set('email-subject', 'Generate email subject lines for: {{topic}}');
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'create-content':
          result = await this.createContent(task.input);
          break;
        case 'generate-campaign':
          result = await this.generateCampaign(task.input);
          break;
        case 'analyze-seo':
          result = await this.analyzeSEO(task.input);
          break;
        case 'generate-hashtags':
          result = await this.generateHashtags(task.input);
          break;
        case 'write-ad':
          result = await this.writeAd(task.input);
          break;
        case 'create-report':
          result = await this.createMarketingReport(task.input);
          break;
        default:
          result = await this.handleGenericMarketing(task);
      }

      const duration = Date.now() - startTime;
      await this.trackCost('llm', { input: 500, output: 1000 }, 'marketing-task');

      return {
        success: true,
        output: result,
        metrics: { duration, toolCalls: 1 },
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
    return task.type === 'content' || task.input?.category === 'marketing';
  }

  private async createContent(input: Record<string, unknown>): Promise<ContentPiece> {
    const type = input.type as string || 'blog';
    const topic = input.topic as string;
    const keywords = (input.keywords as string[]) || [];
    const tone = (input.tone as string) || this.defaultTone;

    const prompt = `Create a ${type} piece about "${topic}". 
Keywords to include: ${keywords.join(', ')}.
Tone: ${tone}.
${type === 'blog' ? 'Include an intro, 3-4 sections, and a conclusion.' : ''}
${type === 'social' ? 'Keep it under 280 characters, add hashtags.' : ''}`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      title: this.extractTitle(response.content, type),
      body: response.content,
      type: type as ContentPiece['type'],
      keywords,
    };
  }

  private extractTitle(content: string, type: string): string {
    const lines = content.split('\n');
    const titleLine = lines.find(l => l.toLowerCase().startsWith('title:') || l.length > 0);
    return titleLine?.replace(/^#+\s*/, '').trim() || `${type} - ${Date.now()}`;
  }

  private async generateCampaign(input: Record<string, unknown>): Promise<{
    name: string;
    channels: string[];
    content: Record<string, string>;
    schedule: string[];
  }> {
    const goal = input.goal as string;
    const targetAudience = input.audience as string;

    const prompt = `Create a marketing campaign for: ${goal}
Target audience: ${targetAudience}
Include: campaign name, 3-5 channels, content for each channel, and suggested schedule`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      name: `${goal} Campaign`,
      channels: ['email', 'social', 'blog'],
      content: { 
        email: this.extractSection(response.content, 'email'),
        social: this.extractSection(response.content, 'social'),
        blog: this.extractSection(response.content, 'blog'),
      },
      schedule: ['Day 1: Launch', 'Day 3: Follow-up', 'Day 7: Reminder'],
    };
  }

  private extractSection(content: string, section: string): string {
    const regex = new RegExp(`${section}[:\\s]+([\\s\\S]*?)(?=\\n\\w|$)`, 'i');
    const match = content.match(regex);
    return match?.[1]?.trim() || '';
  }

  private async analyzeSEO(input: Record<string, unknown>): Promise<SEOMetrics> {
    const content = input.content as string;
    const targetKeyword = input.keyword as string;

    const prompt = `Analyze this content for SEO optimization for keyword "${targetKeyword}":
${content.substring(0, 2000)}

Provide:
1. Score (0-100)
2. 3-5 specific improvement suggestions`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      score: this.extractScore(response.content),
      suggestions: this.extractSuggestions(response.content),
    };
  }

  private extractScore(content: string): number {
    const match = content.match(/score[:\s]*(\d+)/i);
    return match ? parseInt(match[1]) : 70;
  }

  private extractSuggestions(content: string): string[] {
    const lines = content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
    return lines.slice(0, 5).map(l => l.replace(/^[\d.-]+\s*/, '').replace(/^-\s*/, ''));
  }

  private async generateHashtags(input: Record<string, unknown>): Promise<string[]> {
    const topic = input.topic as string;
    const count = (input.count as number) || 10;

    const prompt = `Generate ${count} relevant hashtags for: ${topic}
Return only hashtags, one per line, no explanation.`;

    const response = await llmService.complete(prompt);
    return response.content
      .split('\n')
      .map(h => h.trim())
      .filter(h => h.startsWith('#'))
      .slice(0, count);
  }

  private async writeAd(input: Record<string, unknown>): Promise<{
    headline: string;
    body: string;
    cta: string;
  }> {
    const product = input.product as string;
    const platform = (input.platform as string) || 'general';
    const charLimit = platform === 'google' ? 30 : platform === 'facebook' ? 125 : 280;

    const prompt = `Write ${platform} ad for: ${product}
Headline max ${charLimit} chars.
Include compelling copy and clear CTA.
Format: Headline, Body, CTA`;

    const response = await llmService.completeWithContext(prompt, this.getContext());
    const lines = response.content.split('\n').filter(l => l.trim());

    return {
      headline: lines[0]?.substring(0, charLimit) || '',
      body: lines[1] || '',
      cta: lines[2] || 'Learn More',
    };
  }

  private async createMarketingReport(input: Record<string, unknown>): Promise<{
    period: string;
    metrics: Record<string, number>;
    insights: string[];
    recommendations: string[];
  }> {
    const period = input.period as string || 'weekly';

    const prompt = `Generate a ${period} marketing performance report.
Include metrics for: reach, engagement, conversions, ROI.
Add key insights and recommendations.`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      period,
      metrics: { reach: 0, engagement: 0, conversions: 0, roi: 0 },
      insights: this.extractInsights(response.content),
      recommendations: this.extractRecommendations(response.content),
    };
  }

  private extractInsights(content: string): string[] {
    const match = content.match(/insights?[:\s]+([\s\S]*?)(?=recommendations|$)/i);
    return match?.[1]?.split('\n').filter(l => l.trim()).slice(0, 5) || [];
  }

  private extractRecommendations(content: string): string[] {
    const match = content.match(/recommendations?[:\s]+([\s\S]*?)$/i);
    return match?.[1]?.split('\n').filter(l => l.trim()).slice(0, 5) || [];
  }

  private async handleGenericMarketing(task: Task): Promise<string> {
    const prompt = `Handle marketing task: ${task.title}\n${task.description}`;
    const response = await llmService.completeWithContext(prompt, this.getContext());
    return response.content;
  }

  private getContext(): string {
    return `You are the Marketing Agent for Atlas. Specialize in content creation, SEO, campaigns, and marketing analytics.`;
  }

  private async trackCost(category: string, tokens: { input: number; output: number }, description: string): Promise<void> {
    await this.memory.store({
      type: 'knowledge',
      content: `Marketing task cost tracked: ${description}`,
      importance: 0.2,
      tags: ['cost', category],
      metadata: { source: this.id },
    });
  }

  protected getCapabilities(): string[] {
    return ['content', 'seo', 'campaigns', 'analytics', 'social_media', 'email_marketing'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 3,
      timeoutMs: 60000,
      retryAttempts: 2,
      autoApprove: false,
      approvalThreshold: 100,
    };
  }
}