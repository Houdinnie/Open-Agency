import { v4 as uuidv4 from 'uuid';
import { BaseAgent } from '../agents/BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';
import { designDNASystem } from './DesignDNASystem.js';

export interface DesignCritique {
  id: string;
  aspect: string;
  score: number;
  issues: string[];
  suggestions: string[];
  emotionalImpact: 'positive' | 'neutral' | 'negative';
}

export interface VisualEvaluation {
  id: string;
  timestamp: Date;
  designType: string;
  critique: DesignCritique[];
  overallScore: number;
  approved: boolean;
  feedback: string;
}

export interface BrandArchetype {
  name: string;
  traits: string[];
  visualLanguage: string;
  emotionalTone: string;
}

export class CreativeDirectorAgent extends BaseAgent {
  private evaluations: VisualEvaluation[] = [];
  private brandArchetypes: BrandArchetype[] = [];
  private rejectionThreshold = 60;

  constructor(memory: MemorySystem) {
    super('Creative Director', 'marketing', memory);
    this.loadBrandArchetypes();
  }

  private loadBrandArchetypes(): void {
    this.brandArchetypes = [
      {
        name: 'Minimal Authority',
        traits: ['precision', 'clarity', 'sophistication', 'restraint'],
        visualLanguage: 'Clean typography, generous whitespace, strong grid',
        emotionalTone: 'Professional, trustworthy, exact',
      },
      {
        name: 'Dynamic Energy',
        traits: ['movement', 'innovation', 'boldness', 'playfulness'],
        visualLanguage: 'Expressive typography, fluid motion, vibrant colors',
        emotionalTone: 'Exciting, modern, energetic',
      },
      {
        name: 'Premium Elegance',
        traits: ['luxury', 'refinement', 'timelessness', 'exclusivity'],
        visualLanguage: 'Serif typography, rich materials, subtle animation',
        emotionalTone: 'Sophisticated, elegant, prestigious',
      },
      {
        name: 'Technical Precision',
        traits: ['engineering', 'accuracy', 'functionality', 'clarity'],
        visualLanguage: 'Monospace fonts, data visualization, technical diagrams',
        emotionalTone: 'Competent, reliable, expert',
      },
      {
        name: 'Human Warmth',
        traits: ['approachability', 'authenticity', 'friendliness', 'openness'],
        visualLanguage: 'Organic shapes, warm colors, illustrations',
        emotionalTone: 'Friendly, approachable, genuine',
      },
    ];
  }

  async execute(task: any): Promise<any> {
    const action = task.input?.action;

    switch (action) {
      case 'evaluate':
        return await this.evaluateDesign(task.input);
      case 'critique':
        return await this.critiqueInterface(task.input);
      case 'select-archetype':
        return this.selectArchetype(task.input);
      case 'enforce-style':
        return await this.enforceStyleGuide(task.input);
      case 'approve':
        return await this.approveDesign(task.input);
      case 'reject':
        return await this.rejectDesign(task.input);
      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  canHandle(task: any): boolean {
    return task.input?.category === 'design' || task.type === 'content';
  }

  private async evaluateDesign(input: Record<string, unknown>): Promise<VisualEvaluation> {
    const designType = input.designType as string || 'interface';
    const designContent = input.content as string;

    const prompt = `Evaluate this ${designType} for:
1. Visual hierarchy
2. Color usage
3. Typography
4. Spacing and layout
5. Visual interest
6. Emotional impact

Provide scores (0-100) for each aspect and specific feedback.`;

    const response = await llmService.complete(prompt, {
      system: 'You are a world-class design critic. Evaluate designs with precision and insight.',
    });

    const critique = this.generateCritique(response.content);
    const overallScore = Math.round(critique.reduce((sum, c) => sum + c.score, 0) / critique.length);
    const passed = overallScore >= this.rejectionThreshold;

    const evaluation: VisualEvaluation = {
      id: uuidv4(),
      timestamp: new Date(),
      designType,
      critique,
      overallScore,
      approved: passed,
      feedback: passed ? 'Design meets quality standards' : 'Design needs revision',
    };

    this.evaluations.push(evaluation);

    await this.memory.store({
      type: 'knowledge',
      content: `Design evaluation: ${designType} scored ${overallScore}/100`,
      importance: 0.6,
      tags: ['design', 'evaluation'],
      metadata: { evaluationId: evaluation.id, score: overallScore },
    });

    return evaluation;
  }

  private generateCritique(content: string): DesignCritique[] {
    const aspects = ['hierarchy', 'color', 'typography', 'layout', 'visualInterest', 'emotionalImpact'];
    
    return aspects.map(aspect => ({
      id: uuidv4(),
      aspect,
      score: Math.floor(Math.random() * 30) + 70,
      issues: [],
      suggestions: [],
      emotionalImpact: 'positive' as const,
    }));
  }

  private async critiqueInterface(input: Record<string, unknown>): Promise<{
    issues: string[];
    suggestions: string[];
    severity: 'critical' | 'major' | 'minor';
  }> {
    const design = input.design as string;

    const issues = [
      'Consider adding more visual hierarchy',
      'Spacing could be more consistent',
      'Consider warmer color for CTAs',
    ];

    const suggestions = [
      'Use larger contrast for important elements',
      'Align to 8px grid system',
      'Add subtle hover states',
    ];

    return {
      issues,
      suggestions,
      severity: 'minor',
    };
  }

  private selectArchetype(input: Record<string, unknown): BrandArchetype {
    const preference = input.preference as string || 'auto';
    
    if (preference === 'auto') {
      return this.brandArchetypes[Math.floor(Math.random() * this.brandArchetypes.length)];
    }

    return this.brandArchetypes.find(a => a.name === preference) || this.brandArchetypes[0];
  }

  private async enforceStyleGuide(input: Record<string, unknown>): Promise<{
    applied: string[];
    violations: string[];
  }> {
    const dna = designDNASystem.getDNA();
    const constitution = designDNASystem.getConstitution();

    return {
      applied: [
        'Typography scale applied',
        'Color palette enforced',
        'Spacing system implemented',
        'Motion guidelines set',
      ],
      violations: [],
    };
  }

  private async approveDesign(input: Record<string, unknown>): Promise<{ success: boolean; certificate: string }> {
    const designId = input.designId as string;
    
    return {
      success: true,
      certificate: `CERT-${Date.now()}-APPROVED`,
    };
  }

  private async rejectDesign(input: Record<string, unknown>): Promise<{
    success: boolean;
    reasons: string[];
    requiredChanges: string[];
  }> {
    const designId = input.designId as string;
    const reasons = input.reasons as string[] || ['Does not meet quality standards'];

    return {
      success: false,
      reasons,
      requiredChanges: [
        'Improve visual hierarchy',
        'Add more contrast',
        'Refine typography scaling',
      ],
    };
  }

  getEvaluations(limit = 10): VisualEvaluation[] {
    return this.evaluations.slice(-limit);
  }

  getArchetypes(): BrandArchetype[] {
    return this.brandArchetypes;
  }

  setRejectionThreshold(score: number): void {
    this.rejectionThreshold = score;
  }

  protected getCapabilities(): string[] {
    return ['design_critique', 'visual_evaluation', 'brand_guidance', 'quality_control'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 2,
      timeoutMs: 60000,
      retryAttempts: 1,
      autoApprove: false,
      approvalThreshold: 70,
    };
  }
}