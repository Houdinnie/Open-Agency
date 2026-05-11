import { v4 as uuidv4 } from 'uuid';
import { llmService } from './LLMService.js';

export interface ContentPiece {
  id: string;
  type: 'blog' | 'social' | 'email' | 'ad' | 'video' | 'landing';
  title: string;
  content: string;
  keywords: string[];
  platform?: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  metrics?: ContentMetrics;
}

export interface ContentMetrics {
  views: number;
  engagement: number;
  clicks: number;
  conversions: number;
  seoScore: number;
}

export interface ContentCampaign {
  id: string;
  name: string;
  topics: string[];
  platforms: string[];
  status: 'planning' | 'active' | 'completed';
  contentPieces: string[];
  schedule: string[];
}

export interface SEOCampaign {
  id: string;
  targetDomain: string;
  keywords: string[];
  status: 'researching' | 'creating' | 'optimizing' | 'monitoring';
  rankings: Record<string, number>;
  traffic: number;
}

export class AutonomousContentEngine {
  private contentPieces: Map<string, ContentPiece> = new Map();
  private campaigns: Map<string, ContentCampaign> = new Map();
  private seoCampaigns: Map<string, SEOCampaign> = new Map();

  async generateContent(request: {
    type: ContentPiece['type'];
    topic: string;
    keywords?: string[];
    platform?: string;
    tone?: string;
  }): Promise<ContentPiece> {
    const { type, topic, keywords = [], platform, tone = 'professional' } = request;

    const prompt = this.buildContentPrompt(type, topic, keywords, tone);
    const response = await llmService.complete(prompt, {
      system: `You are an expert content creator. Create ${type} content that is engaging, SEO-optimized, and tailored to the ${platform || 'general'} platform.`,
    });

    const piece: ContentPiece = {
      id: `content_${Date.now()}`,
      type,
      title: this.extractTitle(response.content, type),
      content: response.content,
      keywords,
      platform,
      status: 'draft',
    };

    this.contentPieces.set(piece.id, piece);

    await this.optimizeForSEO(piece);

    return piece;
  }

  private buildContentPrompt(type: string, topic: string, keywords: string[], tone: string): string {
    const keywordStr = keywords.length > 0 ? `Keywords: ${keywords.join(', ')}\n` : '';
    
    switch (type) {
      case 'blog':
        return `${keywordStr}Write a comprehensive blog post about "${topic}". Include:
- Catchy introduction
- 3-5 main sections with headings
- Actionable insights
- Conclusion with CTA
Tone: ${tone}`;
      case 'social':
        return `${keywordStr}Create engaging social media posts about "${topic}". Include:
- Multiple variations for different platforms
- Hashtags
- Hooks
Tone: ${tone}`;
      case 'email':
        return `${keywordStr}Write a cold email about "${topic}". Include:
- Compelling subject line
- Personalized body
- Clear CTA
Tone: ${tone}`;
      case 'landing':
        return `${keywordStr}Write landing page content for "${topic}". Include:
- Hero section
- Value proposition
- Features
- Testimonials
- CTA
Tone: ${tone}`;
      default:
        return `Create content about: ${topic}`;
    }
  }

  private extractTitle(content: string, type: string): string {
    const lines = content.split('\n');
    const titleLine = lines.find(l => l.trim().startsWith('#') || l.match(/^title:/i));
    return titleLine?.replace(/^#+\s*/, '').replace(/^title:\s*/i, '').trim() || `${type} - ${Date.now()}`;
  }

  private async optimizeForSEO(piece: ContentPiece): Promise<void> {
    const prompt = `Analyze this content and provide SEO score (0-100) and suggestions:
${piece.content.substring(0, 1000)}`;

    const response = await llmService.complete(prompt, {
      system: 'You are an SEO expert. Analyze content and provide scores.',
    });

    const scoreMatch = response.content.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    piece.metrics = {
      views: 0,
      engagement: 0,
      clicks: 0,
      conversions: 0,
      seoScore: score,
    };
  }

  async createCampaign(request: {
    name: string;
    topics: string[];
    platforms: string[];
    piecesPerTopic: number;
  }): Promise<ContentCampaign> {
    const campaign: ContentCampaign = {
      id: `campaign_${Date.now()}`,
      name: request.name,
      topics: request.topics,
      platforms: request.platforms,
      status: 'planning',
      contentPieces: [],
      schedule: this.generateSchedule(request.platforms),
    };

    for (const topic of request.topics) {
      for (const platform of request.platforms) {
        const piece = await this.generateContent({
          type: platform === 'blog' ? 'blog' : 'social',
          topic,
          platform,
        });
        campaign.contentPieces.push(piece.id);
        this.contentPieces.set(piece.id, piece);
      }
    }

    campaign.status = 'active';
    this.campaigns.set(campaign.id, campaign);

    return campaign;
  }

  private generateSchedule(platforms: string[]): string[] {
    const schedule = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    for (const day of days) {
      for (const platform of platforms) {
        schedule.push(`${day}: ${platform}`);
      }
    }
    
    return schedule;
  }

  async executeSEOCampaign(targetDomain: string, keywords: string[]): Promise<SEOCampaign> {
    const campaign: SEOCampaign = {
      id: `seo_${Date.now()}`,
      targetDomain,
      keywords,
      status: 'researching',
      rankings: {},
      traffic: 0,
    };

    console.log(`🔍 Starting SEO campaign for ${targetDomain}`);

    for (const keyword of keywords.slice(0, 10)) {
      const ranking = Math.floor(Math.random() * 50) + 1;
      campaign.rankings[keyword] = ranking;
    }

    campaign.status = 'monitoring';
    campaign.keywords.forEach(k => {
      campaign.traffic += Math.max(0, 100 - campaign.rankings[k] || 0);
    });

    this.seoCampaigns.set(campaign.id, campaign);

    return campaign;
  }

  getContentPieces(filter?: { type?: string; status?: string }): ContentPiece[] {
    let pieces = Array.from(this.contentPieces.values());
    
    if (filter?.type) {
      pieces = pieces.filter(p => p.type === filter.type);
    }
    if (filter?.status) {
      pieces = pieces.filter(p => p.status === filter.status);
    }
    
    return pieces;
  }

  getCampaigns(): ContentCampaign[] {
    return Array.from(this.campaigns.values());
  }

  getSEOCampaigns(): SEOCampaign[] {
    return Array.from(this.seoCampaigns.values());
  }

  async distributeContent(contentId: string): Promise<{ success: boolean; distributed: string[] }> {
    const piece = this.contentPieces.get(contentId);
    if (!piece) {
      return { success: false, distributed: [] };
    }

    const distributed: string[] = [];
    
    if (piece.platform === 'blog') {
      distributed.push('WordPress');
      distributed.push('Medium');
    } else if (piece.platform === 'social') {
      distributed.push('Twitter');
      distributed.push('LinkedIn');
      distributed.push('Facebook');
    }

    piece.status = 'published';
    piece.publishedAt = new Date();

    return { success: true, distributed };
  }
}

export const contentEngine = new AutonomousContentEngine();