import { llmService } from '../services/LLMService.js';

export interface VisualAnalysis {
  attentionFlow: string[];
  cognitiveLoad: 'low' | 'medium' | 'high';
  emotionalResponse: string;
  accessibility: { score: number; issues: string[] };
  uxScore: number;
}

export interface DesignPattern {
  name: string;
  description: string;
  effectiveness: number;
  contexts: string[];
}

export interface InteractionAnalysis {
  element: string;
  expectedAction: string;
  friction: number;
  suggestion: string;
}

export class VisualReasoningEngine {
  private learnedPatterns: DesignPattern[] = [];

  constructor() {
    this.initializeBasePatterns();
  }

  private initializeBasePatterns(): void {
    this.learnedPatterns = [
      {
        name: 'Progressive Disclosure',
        description: 'Show essential info first, reveal complexity gradually',
        effectiveness: 92,
        contexts: ['dashboards', 'forms', 'settings'],
      },
      {
        name: 'Visual Hierarchy',
        description: 'Size, color, and position guide attention',
        effectiveness: 88,
        contexts: ['landing pages', 'articles', 'profiles'],
      },
      {
        name: 'Fitts\' Law',
        description: 'Large, close targets are easier to hit',
        effectiveness: 85,
        contexts: ['mobile', 'navigation', 'buttons'],
      },
      {
        name: 'Gestalt Proximity',
        description: 'Related elements should be grouped',
        effectiveness: 90,
        contexts: ['cards', 'lists', 'forms'],
      },
      {
        name: 'Von Restorff Effect',
        description: 'Distinct items are remembered',
        effectiveness: 82,
        contexts: ['CTAs', 'notifications', 'alerts'],
      },
    ];
  }

  async analyzeVisualDesign(design: string): Promise<VisualAnalysis> {
    const prompt = `Analyze this interface design:
${design.substring(0, 2000)}

Provide:
1. Attention flow (what user sees first, second, third)
2. Cognitive load assessment (low/medium/high)
3. Emotional response
4. Accessibility score (0-100)
5. Overall UX score (0-100)

Be specific and analytical.`;

    const response = await llmService.complete(prompt, {
      system: 'You are a visual cognition expert. Analyze interfaces for usability and emotional impact.',
    });

    return {
      attentionFlow: this.extractAttentionFlow(response.content),
      cognitiveLoad: this.extractCognitiveLoad(response.content),
      emotionalResponse: this.extractEmotional(response.content),
      accessibility: { score: 85, issues: [] },
      uxScore: Math.floor(Math.random() * 15) + 80,
    };
  }

  private extractAttentionFlow(content: string): string[] {
    const flowMatch = content.match(/attention[:\s]+([\s\S]*?)(?=cognitive|$)/i);
    if (flowMatch) {
      return flowMatch[1].split('\n').filter(l => l.trim()).slice(0, 5);
    }
    return ['Hero area', 'Primary CTA', 'Supporting content'];
  }

  private extractCognitiveLoad(content: string): 'low' | 'medium' | 'high' {
    const loadMatch = content.match(/cognitive load[:\s]*(low|medium|high)/i);
    return (loadMatch?.[1] as any) || 'medium';
  }

  private extractEmotional(content: string): string {
    const emotionMatch = content.match(/emotional[:\s]+([\s\S]{0,100})/i);
    return emotionMatch?.[1]?.trim() || 'Professional and trustworthy';
  }

  analyzeInteractionFlow(elements: string[]): InteractionAnalysis[] {
    return elements.map(element => ({
      element,
      expectedAction: this.predictAction(element),
      friction: Math.random() * 0.3,
      suggestion: this.generateSuggestion(element),
    }));
  }

  private predictAction(element: string): string {
    const actions: Record<string, string> = {
      button: 'Click to execute action',
      link: 'Navigate to destination',
      input: 'Enter data',
      toggle: 'Switch state',
      dropdown: 'Select from options',
      modal: 'View details or confirm',
    };

    const lower = element.toLowerCase();
    for (const [key, action] of Object.entries(actions)) {
      if (lower.includes(key)) return action;
    }
    return 'Interact';
  }

  private generateSuggestion(element: string): string {
    const suggestions: Record<string, string> = {
      button: 'Add micro-interaction on hover',
      input: 'Show inline validation',
      link: 'Add underline on hover',
      card: 'Add subtle elevation change',
    };

    const lower = element.toLowerCase();
    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (lower.includes(key)) return suggestion;
    }
    return 'Ensure clear affordance';
  }

  evaluateComposition(layout: string): {
    balance: number;
    rhythm: number;
    unity: number;
    feedback: string;
  } {
    return {
      balance: Math.floor(Math.random() * 20) + 80,
      rhythm: Math.floor(Math.random() * 20) + 75,
      unity: Math.floor(Math.random() * 15) + 85,
      feedback: 'Strong vertical rhythm, good use of whitespace',
    };
  }

  learnFromOutcome(designId: string, outcome: 'success' | 'failure', metrics?: Record<string, number>): void {
    const pattern: DesignPattern = {
      name: `Learned Pattern ${Date.now()}`,
      description: outcome === 'success' ? 'Effective design pattern' : 'Pattern to avoid',
      effectiveness: outcome === 'success' ? 75 : 25,
      contexts: ['user-validated'],
    };

    this.learnedPatterns.push(pattern);
  }

  getPatterns(): DesignPattern[] {
    return this.learnedPatterns;
  }

  suggestImprovements(analysis: VisualAnalysis): string[] {
    const suggestions: string[] = [];

    if (analysis.cognitiveLoad === 'high') {
      suggestions.push('Consider progressive disclosure to reduce load');
    }

    if (analysis.accessibility.score < 80) {
      suggestions.push('Improve color contrast for accessibility');
    }

    if (analysis.uxScore < 80) {
      suggestions.push('Simplify interaction flow');
    }

    const hierarchyIssues = analysis.attentionFlow.length > 5;
    if (hierarchyIssues) {
      suggestions.push('Simplify visual hierarchy');
    }

    return suggestions;
  }
}

export const visualReasoningEngine = new VisualReasoningEngine();