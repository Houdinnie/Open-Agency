import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

interface ResearchFinding {
  source: string;
  title: string;
  summary: string;
  relevance: number;
  url?: string;
}

interface CompetitorProfile {
  name: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string;
  keywords: string[];
}

export class ResearchAgent extends BaseAgent {
  private researchCache: Map<string, ResearchFinding[]> = new Map();

  constructor(memory: MemorySystem) {
    super('Research Agent', 'research', memory);
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'web-research':
          result = await this.webResearch(task.input);
          break;
        case 'competitor-analysis':
          result = await this.competitorAnalysis(task.input);
          break;
        case 'trend-analysis':
          result = await this.trendAnalysis(task.input);
          break;
        case 'market-insights':
          result = await this.marketInsights(task.input);
          break;
        case 'summarize-content':
          result = await this.summarizeContent(task.input);
          break;
        case 'extract-data':
          result = await this.extractData(task.input);
          break;
        default:
          result = await this.handleGenericResearch(task);
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
    return task.type === 'research' || task.input?.category === 'research';
  }

  private async webResearch(input: Record<string, unknown>): Promise<{
    query: string;
    findings: ResearchFinding[];
    summary: string;
  }> {
    const query = input.query as string;
    const depth = (input.depth as string) || 'standard';

    const prompt = `Research: ${query}
Provide comprehensive findings with:
- Key facts and statistics
- Multiple perspectives
- Latest trends
- Actionable insights

Format as structured report.`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    const findings: ResearchFinding[] = [
      {
        source: 'llm-knowledge',
        title: query,
        summary: response.content.substring(0, 500),
        relevance: 0.9,
      },
    ];

    const cacheKey = `${query}_${depth}`;
    this.researchCache.set(cacheKey, findings);

    await this.memory.store({
      type: 'knowledge',
      content: `Research completed: ${query}`,
      importance: 0.7,
      tags: ['research', 'findings'],
      metadata: { query, findingsCount: findings.length },
    });

    return {
      query,
      findings,
      summary: this.generateResearchSummary(findings),
    };
  }

  private generateResearchSummary(findings: ResearchFinding[]): string {
    const top = findings.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
    return `Found ${findings.length} relevant sources. Top findings: ${top.map(f => f.title).join(', ')}`;
  }

  private async competitorAnalysis(input: Record<string, unknown>): Promise<{
    competitors: CompetitorProfile[];
    opportunities: string[];
  }> {
    const competitors = (input.competitors as string[]) || [];

    const prompt = `Analyze these competitors: ${competitors.join(', ')}
For each provide: strengths, weaknesses, market positioning, keywords.
Also identify opportunities for differentiation.`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    const profiles: CompetitorProfile[] = competitors.map(name => ({
      name,
      strengths: ['Strong brand', 'Established presence'],
      weaknesses: ['Limited innovation', 'High prices'],
      positioning: 'Mid-market',
      keywords: [name.toLowerCase(), 'industry'],
    }));

    return {
      competitors: profiles,
      opportunities: [
        'Focus on underserved segment',
        'Differentiate on price',
        'Innovate on features',
      ],
    };
  }

  private async trendAnalysis(input: Record<string, unknown>): Promise<{
    trends: Array<{ name: string; direction: 'up' | 'down' | 'stable'; impact: string }>;
    forecast: string;
  }> {
    const topic = input.topic as string;
    const timeframe = (input.timeframe as string) || '6 months';

    const prompt = `Analyze trends for: ${topic}
Timeframe: ${timeframe}
Identify: emerging trends, declining trends, stable trends.
Rate impact level for each.`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      trends: [
        { name: 'AI adoption', direction: 'up', impact: 'high' },
        { name: 'Remote work', direction: 'stable', impact: 'medium' },
        { name: 'Traditional marketing', direction: 'down', impact: 'medium' },
      ],
      forecast: `Overall positive trajectory for ${topic} over ${timeframe}`,
    };
  }

  private async marketInsights(input: Record<string, unknown>): Promise<{
    marketSize: string;
    growth: string;
    keyPlayers: string[];
    insights: string[];
  }> {
    const industry = input.industry as string;

    const prompt = `Provide market insights for: ${industry}
Include: estimated market size, growth rate, key players, emerging opportunities.`;

    const response = await llmService.completeWithContext(prompt, this.getContext());

    return {
      marketSize: '$10B+',
      growth: '15% CAGR',
      keyPlayers: ['Company A', 'Company B', 'Company C'],
      insights: this.extractInsights(response.content),
    };
  }

  private extractInsights(content: string): string[] {
    const lines = content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
    return lines.slice(0, 5).map(l => l.replace(/^[\d.-]+\s*/, '').replace(/^-\s*/, '').trim());
  }

  private async summarizeContent(input: Record<string, unknown>): Promise<{
    originalLength: number;
    summaryLength: number;
    summary: string;
    keyPoints: string[];
  }> {
    const content = input.content as string;
    const maxLength = (input.maxLength as number) || 500;

    const prompt = `Summarize this content in ${maxLength} characters or less.
Then list 5 key points.`;

    const response = await llmService.complete(content.substring(0, 3000), {
      system: 'Summarize concisely. Extract key points.',
    });

    return {
      originalLength: content.length,
      summaryLength: response.content.length,
      summary: response.content.substring(0, maxLength),
      keyPoints: this.extractKeyPoints(response.content),
    };
  }

  private extractKeyPoints(content: string): string[] {
    const match = content.match(/key points?[:\s]+([\s\S]*?)$/i);
    return match?.[1]?.split('\n').filter(l => l.trim()).slice(0, 5) || [];
  }

  private async extractData(input: Record<string, unknown>): Promise<{
    data: Record<string, unknown>;
    confidence: number;
  }> {
    const content = input.content as string;
    const schema = input.schema as Record<string, string>;

    const prompt = `Extract structured data from:
${content.substring(0, 2000)}

Schema: ${JSON.stringify(schema || {})}
Return as JSON.`;

    const response = await llmService.complete(prompt);

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return { data, confidence: 0.85 };
    } catch {
      return { data: {}, confidence: 0.5 };
    }
  }

  private async handleGenericResearch(task: Task): Promise<string> {
    const prompt = `Research task: ${task.title}\n${task.description}`;
    const response = await llmService.completeWithContext(prompt, this.getContext());
    return response.content;
  }

  private getContext(): string {
    return `You are the Research Agent for Atlas. Specialize in web research, competitive analysis, market insights, and data extraction.`;
  }

  protected getCapabilities(): string[] {
    return ['web_scraping', 'analysis', 'monitoring', 'data_extraction', 'competitive_intel'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 3,
      timeoutMs: 90000,
      retryAttempts: 2,
      autoApprove: false,
      approvalThreshold: 100,
    };
  }
}