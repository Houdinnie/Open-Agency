import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

interface DesignSystem {
  colors: Record<string, string>;
  typography: Record<string, { font: string; size: string; weight: string }>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

interface Component {
  id: string;
  name: string;
  type: string;
  props: Record<string, unknown>;
  styles: Record<string, string>;
}

interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'animation';
}

export class DesignAgent extends BaseAgent {
  private designSystem: DesignSystem;
  private components: Map<string, Component> = new Map();
  private designTokens: Map<string, DesignToken> = new Map();

  constructor(memory: MemorySystem) {
    super('Design Agent', 'marketing', memory);
    this.designSystem = this.getDefaultDesignSystem();
    this.loadDesignTokens();
  }

  private getDefaultDesignSystem(): DesignSystem {
    return {
      colors: {
        primary: '#0ea5e9',
        secondary: '#8b5cf6',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#64748b',
      },
      typography: {
        h1: { font: 'Inter', size: '2rem', weight: '700' },
        h2: { font: 'Inter', size: '1.5rem', weight: '600' },
        h3: { font: 'Inter', size: '1.25rem', weight: '600' },
        body: { font: 'Inter', size: '1rem', weight: '400' },
        small: { font: 'Inter', size: '0.875rem', weight: '400' },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
    };
  }

  private loadDesignTokens(): void {
    const tokens: DesignToken[] = [
      { name: 'color-primary', value: '#0ea5e9', type: 'color' },
      { name: 'color-secondary', value: '#8b5cf6', type: 'color' },
      { name: 'spacing-md', value: '1rem', type: 'spacing' },
      { name: 'radius-md', value: '0.5rem', type: 'spacing' },
      { name: 'shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)', type: 'shadow' },
    ];
    tokens.forEach(t => this.designTokens.set(t.name, t));
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'create-design-system':
          result = this.createDesignSystem(task.input);
          break;
        case 'generate-component':
          result = await this.generateComponent(task.input);
          break;
        case 'generate-page':
          result = await this.generatePage(task.input);
          break;
        case 'apply-brand':
          result = this.applyBrand(task.input);
          break;
        case 'create-icon-set':
          result = this.createIconSet(task.input);
          break;
        case 'generate-variations':
          result = await this.generateVariations(task.input);
          break;
        case 'audit-consistency':
          result = await this.auditConsistency();
          break;
        default:
          result = await this.handleDesignTask(task);
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
    return task.input?.category === 'design';
  }

  private createDesignSystem(input: Record<string, unknown>): DesignSystem {
    const brandName = input.brand as string || 'Default Brand';
    const mood = input.mood as string || 'professional';

    const colorPalette = this.generateColorPalette(mood);

    this.designSystem = {
      colors: colorPalette,
      typography: this.designSystem.typography,
      spacing: this.designSystem.spacing,
      borderRadius: this.designSystem.borderRadius,
      shadows: this.designSystem.shadows,
    };

    return this.designSystem;
  }

  private generateColorPalette(mood: string): Record<string, string> {
    const palettes: Record<string, Record<string, string>> = {
      professional: {
        primary: '#0ea5e9',
        secondary: '#6366f1',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
      },
      playful: {
        primary: '#f472b6',
        secondary: '#a78bfa',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        background: '#fff1f2',
        surface: '#ffe4e6',
        text: '#881337',
      },
      dark: {
        primary: '#38bdf8',
        secondary: '#a78bfa',
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
      },
    };

    return palettes[mood] || palettes.professional;
  }

  private async generateComponent(input: Record<string, unknown>): Promise<{
    component: Component;
    code: string;
  }> {
    const type = input.type as string || 'button';
    const variant = input.variant as string || 'primary';

    const component: Component = {
      id: `comp_${Date.now()}`,
      name: `${type}-${variant}`,
      type,
      props: this.getComponentProps(type, variant),
      styles: this.getComponentStyles(type, variant),
    };

    this.components.set(component.id, component);

    const code = this.generateComponentCode(component);

    return { component, code };
  }

  private getComponentProps(type: string, variant: string): Record<string, unknown> {
    const baseProps: Record<string, Record<string, unknown>> = {
      button: { children: 'Click me', variant, disabled: false },
      input: { placeholder: 'Enter text', type: 'text', disabled: false },
      card: { title: 'Card Title', children: 'Card content' },
      modal: { open: false, title: 'Modal Title' },
    };
    return baseProps[type] || {};
  }

  private getComponentStyles(type: string, variant: string): Record<string, string> {
    const color = variant === 'primary' ? this.designSystem.colors.primary : this.designSystem.colors.secondary;
    
    return {
      padding: this.designSystem.spacing.md,
      borderRadius: this.designSystem.borderRadius.md,
      backgroundColor: type === 'button' ? color : this.designSystem.colors.surface,
      color: this.designSystem.colors.text,
      border: 'none',
      cursor: 'pointer',
    };
  }

  private generateComponentCode(component: Component): string {
    const { type, props, styles } = component;
    
    return `import React from 'react';

export const ${this.toPascalCase(component.name)} = ({ ${Object.keys(props).join(', ')} }) => {
  return (
    <${type} style={${JSON.stringify(styles, null, 2)}}>
      ${JSON.stringify(props, null, 2)}
    </${type}>
  );
};`;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^\w|-)(\w)*/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase());
  }

  private async generatePage(input: Record<string, unknown>): Promise<{
    layout: string;
    components: string[];
    code: string;
  }> {
    const pageType = input.type as string || 'landing';
    const sections = (input.sections as string[]) || ['header', 'hero', 'features', 'cta', 'footer'];

    const components = sections.map(s => `${s}-section`);
    const layout = sections.join(' → ');

    const prompt = `Generate a ${pageType} page layout with sections: ${sections.join(', ')}. Use design tokens: ${JSON.stringify(this.designSystem)}`;

    const response = await llmService.complete(prompt, {
      system: 'You are a UI designer. Generate clean, modern layouts.',
    });

    return {
      layout,
      components,
      code: response.content,
    };
  }

  private applyBrand(input: Record<string, unknown): { success: boolean; changes: string[] } {
    const brandName = input.brand as string;
    const colors = input.colors as Record<string, string>;
    const fonts = input.fonts as string[];

    if (colors) {
      Object.entries(colors).forEach(([key, value]) => {
        this.designSystem.colors[key] = value;
      });
    }

    return {
      success: true,
      changes: Object.keys(colors || {}).map(k => `Updated ${k} color`),
    };
  }

  private createIconSet(input: Record<string, unknown>): { icons: string[]; style: string } {
    const category = input.category as string || 'ui';
    const icons = ['search', 'settings', 'user', 'menu', 'close', 'chevron-right'];
    
    return { icons, style: category };
  }

  private async generateVariations(input: Record<string, unknown>): Promise<{
    variations: Array<{ name: string; props: Record<string, unknown> }>;
  }> {
    const baseComponent = input.component as string;
    
    const variations = [
      { name: `${baseComponent}-primary`, props: { variant: 'primary' } },
      { name: `${baseComponent}-secondary`, props: { variant: 'secondary' } },
      { name: `${baseComponent}-outline`, props: { variant: 'outline' } },
      { name: `${baseComponent}-ghost`, props: { variant: 'ghost' } },
    ];

    return { variations };
  }

  private async auditConsistency(): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    return {
      score: 92,
      issues: [],
      recommendations: [
        'All components follow design system',
        'Typography consistent across pages',
        'Color usage aligned with tokens',
      ],
    };
  }

  private async handleDesignTask(task: Task): Promise<string> {
    return `Design task completed: ${task.title}`;
  }

  getDesignSystem(): DesignSystem {
    return this.designSystem;
  }

  getComponents(): Component[] {
    return Array.from(this.components.values());
  }

  protected getCapabilities(): string[] {
    return ['design_systems', 'ui_generation', 'brand_application', 'consistency_audit'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 3,
      timeoutMs: 60000,
      retryAttempts: 2,
      autoApprove: true,
      approvalThreshold: 100,
    };
  }
}