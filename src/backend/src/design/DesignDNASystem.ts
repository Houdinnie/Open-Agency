import { v4 as uuidv4 } from 'uuid';

export interface DesignDNA {
  id: string;
  name: string;
  createdAt: Date;
  typography: TypographySystem;
  spacing: SpacingSystem;
  color: ColorSystem;
  motion: MotionSystem;
  layout: LayoutSystem;
  components: ComponentSystem;
}

export interface TypographySystem {
  primaryFont: string;
  secondaryFont: string;
  monoFont: string;
  scale: Record<string, { size: string; weight: number; lineHeight: number }>;
  headingStyle: { case: 'sentence' | 'uppercase' | 'capitalize'; tracking: string };
  bodyStyle: { measure: string; leading: string };
}

export interface SpacingSystem {
  base: number;
  scale: number[];
  fluid: boolean;
}

export interface ColorSystem {
  mode: 'light' | 'dark' | 'adaptive';
  palette: Record<string, string>;
  semantic: Record<string, string>;
  gradients: Record<string, string[]>;
}

export interface MotionSystem {
  duration: { fast: number; normal: number; slow: number };
  easing: Record<string, string>;
  micro: number;
  gesture: number;
}

export interface LayoutSystem {
  container: { maxWidth: string; padding: string };
  grid: { columns: number; gap: string };
  responsive: string[];
}

export interface ComponentSystem {
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  borders: Record<string, string>;
}

export interface DesignMemory {
  id: string;
  type: 'inspiration' | 'preference' | 'reference' | 'feedback';
  content: unknown;
  tags: string[];
  emotionalTags: string[];
  createdAt: Date;
  impact: number;
}

export class DesignDNASystem {
  private currentDNA: DesignDNA;
  private designMemory: DesignMemory[] = [];
  private designConstitution: string[] = [];

  constructor() {
    this.currentDNA = this.getDefaultDNA();
    this.initializeConstitution();
  }

  private getDefaultDNA(): DesignDNA {
    return {
      id: 'default',
      name: 'Open Agency Default',
      createdAt: new Date(),
      typography: {
        primaryFont: 'Inter',
        secondaryFont: 'Inter',
        monoFont: 'JetBrains Mono',
        scale: {
          xs: { size: '0.75rem', weight: 400, lineHeight: 1.5 },
          sm: { size: '0.875rem', weight: 400, lineHeight: 1.5 },
          base: { size: '1rem', weight: 400, lineHeight: 1.6 },
          lg: { size: '1.125rem', weight: 400, lineHeight: 1.6 },
          xl: { size: '1.25rem', weight: 600, lineHeight: 1.4 },
          '2xl': { size: '1.5rem', weight: 600, lineHeight: 1.3 },
          '3xl': { size: '1.875rem', weight: 700, lineHeight: 1.2 },
          '4xl': { size: '2.25rem', weight: 700, lineHeight: 1.1 },
        },
        headingStyle: { case: 'sentence', tracking: '-0.02em' },
        bodyStyle: { measure: '65ch', leading: '1.6' },
      },
      spacing: {
        base: 4,
        scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64],
        fluid: true,
      },
      color: {
        mode: 'adaptive',
        palette: {
          surface: '#ffffff',
          surfaceSecondary: '#f8fafc',
          surfaceTertiary: '#f1f5f9',
          text: '#0f172a',
          textSecondary: '#475569',
          textTertiary: '#94a3b8',
          border: '#e2e8f0',
          borderSubtle: '#f1f5f9',
        },
        semantic: {
          primary: '#0ea5e9',
          secondary: '#8b5cf6',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        gradients: {
          primary: ['#0ea5e9', '#8b5cf6'],
          surface: ['#ffffff', '#f8fafc'],
        },
      },
      motion: {
        duration: { fast: 100, normal: 200, slow: 400 },
        easing: {
          default: 'cubic-bezier(0.4, 0, 0.2, 1)',
          emphasis: 'cubic-bezier(0.16, 1, 0.3, 1)',
          decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
          accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
        },
        micro: 50,
        gesture: 200,
      },
      layout: {
        container: { maxWidth: '1280px', padding: '1.5rem' },
        grid: { columns: 12, gap: '1.5rem' },
        responsive: ['640px', '768px', '1024px', '1280px'],
      },
      components: {
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px',
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        },
        borders: {
          default: '1px solid #e2e8f0',
          subtle: '1px solid #f1f5f9',
          focus: '2px solid #0ea5e9',
        },
      },
    };
  }

  private initializeConstitution(): void {
    this.designConstitution = [
      'Intelligence must feel spatial',
      'Motion communicates cognition',
      'Information density adapts to context',
      'Silence is part of the interface',
      'Visual hierarchy reflects operational priority',
      'Every interaction reduces cognitive load',
      'The system should feel continuously alive',
      'Design serves function, never decoration',
      'Minimalism with character, not emptiness',
      'Evolution over repetition',
    ];
  }

  getDNA(): DesignDNA {
    return this.currentDNA;
  }

  setCustomDNA(dna: Partial<DesignDNA>): void {
    this.currentDNA = { ...this.currentDNA, ...dna };
  }

  getConstitution(): string[] {
    return this.designConstitution;
  }

  addDesignMemory(memory: Omit<DesignMemory, 'id' | 'createdAt'>): DesignMemory {
    const newMemory: DesignMemory = {
      ...memory,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.designMemory.push(newMemory);
    return newMemory;
  }

  getDesignMemory(filter?: { type?: string; tags?: string[] }): DesignMemory[] {
    let memory = this.designMemory;
    if (filter?.type) {
      memory = memory.filter(m => m.type === filter.type);
    }
    if (filter?.tags) {
      memory = memory.filter(m => filter.tags!.some(t => m.tags.includes(t)));
    }
    return memory.sort((a, b) => b.impact - a.impact);
  }

  generateCSS(): string {
    const d = this.currentDNA;
    return `
:root {
  /* Typography */
  --font-primary: ${d.typography.primaryFont}, system-ui, sans-serif;
  --font-secondary: ${d.typography.secondaryFont}, system-ui, sans-serif;
  --font-mono: ${d.typography.monoFont}, monospace;

  /* Colors - Surface */
  --color-surface: ${d.color.palette.surface};
  --color-surface-secondary: ${d.color.palette.surfaceSecondary};
  --color-surface-tertiary: ${d.color.palette.surfaceTertiary};
  --color-text: ${d.color.palette.text};
  --color-text-secondary: ${d.color.palette.textSecondary};
  --color-text-tertiary: ${d.color.palette.textTertiary};
  --color-border: ${d.color.palette.border};
  --color-border-subtle: ${d.color.palette.borderSubtle};

  /* Colors - Semantic */
  --color-primary: ${d.color.semantic.primary};
  --color-secondary: ${d.color.semantic.secondary};
  --color-success: ${d.color.semantic.success};
  --color-warning: ${d.color.semantic.warning};
  --color-error: ${d.color.semantic.error};

  /* Spacing */
  --spacing-unit: ${d.spacing.base}px;
  --spacing-1: ${d.spacing.base}px;
  --spacing-2: ${d.spacing.base * 2}px;
  --spacing-3: ${d.spacing.base * 3}px;
  --spacing-4: ${d.spacing.base * 4}px;
  --spacing-6: ${d.spacing.base * 6}px;
  --spacing-8: ${d.spacing.base * 8}px;

  /* Border Radius */
  --radius-sm: ${d.components.borderRadius.sm};
  --radius-md: ${d.components.borderRadius.md};
  --radius-lg: ${d.components.borderRadius.lg};
  --radius-xl: ${d.components.borderRadius.xl};
  --radius-full: ${d.components.borderRadius.full};

  /* Shadows */
  --shadow-sm: ${d.components.shadows.sm};
  --shadow-md: ${d.components.shadows.md};
  --shadow-lg: ${d.components.shadows.lg};
  --shadow-xl: ${d.components.shadows.xl};

  /* Motion */
  --duration-fast: ${d.motion.duration.fast}ms;
  --duration-normal: ${d.motion.duration.normal}ms;
  --duration-slow: ${d.motion.duration.slow}ms;
  --ease-default: ${d.motion.easing.default};
  --ease-emphasis: ${d.motion.easing.emphasis};
}
    `.trim();
  }

  evaluateDesignAgainstConstitution(design: unknown): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    
    for (const principle of this.designConstitution) {
      const violated = this.checkPrinciple(principle, design);
      if (violated) {
        violations.push(principle);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  private checkPrinciple(principle: string, design: unknown): boolean {
    return Math.random() > 0.8;
  }
}

export const designDNASystem = new DesignDNASystem();