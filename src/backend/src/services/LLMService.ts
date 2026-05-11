import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface LLMRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
  usage: { input: number; output: number; total: number };
  model: string;
}

export interface LLMProvider {
  name: string;
  models: string[];
  complete(request: LLMRequest): Promise<LLMResponse>;
}

class OpenAIProvider implements LLMProvider {
  name = 'openai';
  models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      tools: request.tools as any,
    });

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls?.map(tc => ({
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments),
    }));

    return {
      content: message.content || '',
      toolCalls,
      usage: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      model: response.model,
    };
  }
}

class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  models = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const systemMessage = request.messages.find(m => m.role === 'system');
    const userMessages = request.messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: request.model,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      tools: request.tools as any,
    });

    const toolCalls = response.content
      .filter(c => c.type === 'tool_use')
      .map(c => ({
        name: c.name,
        input: c.input,
      }));

    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => (c as any).text)
      .join('');

    return {
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }
}

class GrokProvider implements LLMProvider {
  name = 'grok';
  models = ['grok-beta', 'grok-vision-beta'];
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROK_API_KEY || '';
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        tools: request.tools,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    return {
      content: message.content || '',
      toolCalls: message.tool_calls?.map((tc: any) => ({
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
      })),
      usage: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
      model: data.model,
    };
  }
}

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  private defaultModel: string;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider());
    }
    if (process.env.GROK_API_KEY) {
      this.providers.set('grok', new GrokProvider());
    }

    this.defaultProvider = process.env.LLM_PROVIDER || 'openai';
    this.defaultModel = process.env.LLM_MODEL || 'gpt-4-turbo-preview';

    console.log(`🤖 LLM Service initialized with providers: ${[...this.providers.keys()].join(', ')}`);
  }

  async complete(prompt: string, options?: {
    system?: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: ToolDefinition[];
  }): Promise<LLMResponse> {
    const providerName = options?.provider || this.defaultProvider;
    const model = options?.model || this.defaultModel;

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not available`);
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    if (options?.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: prompt });

    return provider.complete({
      model,
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      tools: options?.tools,
    });
  }

  async completeWithContext(prompt: string, context: string, tools?: ToolDefinition[]): Promise<LLMResponse> {
    return this.complete(prompt, {
      system: `You are Atlas, a persistent AI employee. Context: ${context}`,
      tools,
    });
  }

  getProviders(): string[] {
    return [...this.providers.keys()];
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }
}

export const llmService = new LLMService();