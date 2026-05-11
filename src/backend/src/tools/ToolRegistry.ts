import { v4 as uuidv4 } from 'uuid';
import { Tool, ToolAction, ToolCategory } from '../types.js';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export abstract class BaseTool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  actions: Map<string, (input: Record<string, unknown>) => Promise<ToolResult>>;

  constructor(name: string, category: ToolCategory, description: string) {
    this.id = uuidv4();
    this.name = name;
    this.category = category;
    this.description = description;
    this.actions = new Map();
    this.registerActions();
  }

  abstract registerActions(): void;

  async execute(action: string, input: Record<string, unknown>): Promise<ToolResult> {
    const handler = this.actions.get(action);
    if (!handler) {
      return { success: false, error: `Action ${action} not found` };
    }
    return handler(input);
  }

  getToolDefinition(): Tool {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      actions: Array.from(this.actions.keys()).map(name => ({
        name,
        description: `${name} action`,
        parameters: {},
        handler: this.id,
      })),
      config: {},
    };
  }
}

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  register(tool: BaseTool): void {
    this.tools.set(tool.id, tool);
    console.log(`🔧 Registered tool: ${tool.name}`);
  }

  get(id: string): BaseTool | undefined {
    return this.tools.get(id);
  }

  getByName(name: string): BaseTool | undefined {
    for (const tool of this.tools.values()) {
      if (tool.name === name) return tool;
    }
    return undefined;
  }

  getByCategory(category: ToolCategory): BaseTool[] {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values()).map(t => t.getToolDefinition());
  }

  async execute(toolName: string, action: string, input: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.getByName(toolName);
    if (!tool) {
      return { success: false, error: `Tool ${toolName} not found` };
    }
    return tool.execute(action, input);
  }
}

export const toolRegistry = new ToolRegistry();