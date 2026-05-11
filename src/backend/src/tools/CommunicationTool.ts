import { BaseTool, ToolResult } from './ToolRegistry.js';

export class EmailTool extends BaseTool {
  constructor() {
    super('email', 'communication', 'Email management and sending');
  }

  registerActions(): void {
    this.actions.set('send', this.send.bind(this));
    this.actions.set('read', this.read.bind(this));
    this.actions.set('search', this.search.bind(this));
    this.actions.set('draft', this.draft.bind(this));
  }

  private async send(input: Record<string, unknown>): Promise<ToolResult> {
    const to = input.to as string;
    const subject = input.subject as string;
    const body = input.body as string;
    
    if (!to || !subject) {
      return { success: false, error: 'To and subject required' };
    }
    
    console.log(`📧 Sending email to: ${to}`);
    return {
      success: true,
      data: { messageId: `msg_${Date.now()}`, to, subject, sentAt: new Date() },
    };
  }

  private async read(input: Record<string, unknown>): Promise<ToolResult> {
    const messageId = input.messageId as string;
    return {
      success: true,
      data: {
        id: messageId,
        from: 'sender@example.com',
        subject: 'Email Subject',
        body: 'Email body...',
        receivedAt: new Date(),
      },
    };
  }

  private async search(input: Record<string, unknown>): Promise<ToolResult> {
    const query = input.query as string;
    return {
      success: true,
      data: {
        results: [
          { id: '1', subject: 'Result 1', from: 'a@b.com' },
          { id: '2', subject: 'Result 2', from: 'c@d.com' },
        ],
        count: 2,
      },
    };
  }

  private async draft(input: Record<string, unknown>): Promise<ToolResult> {
    const to = input.to as string;
    const topic = input.topic as string;
    const tone = input.tone as string || 'professional';
    
    return {
      success: true,
      data: {
        draftId: `draft_${Date.now()}`,
        to,
        subject: `Re: ${topic}`,
        body: `Dear ${to},\n\n[Tone: ${tone}]\n\nBest regards`,
        createdAt: new Date(),
      },
    };
  }
}

export class SlackTool extends BaseTool {
  constructor() {
    super('slack', 'communication', 'Slack messaging and integration');
  }

  registerActions(): void {
    this.actions.set('sendMessage', this.sendMessage.bind(this));
    this.actions.set('createChannel', this.createChannel.bind(this));
    this.actions.set('search', this.search.bind(this));
  }

  private async sendMessage(input: Record<string, unknown>): Promise<ToolResult> {
    const channel = input.channel as string;
    const message = input.message as string;
    
    console.log(`💬 Sending to Slack #${channel}: ${message?.substring(0, 50)}...`);
    return { success: true, data: { ts: Date.now(), channel } };
  }

  private async createChannel(input: Record<string, unknown>): Promise<ToolResult> {
    const name = input.name as string;
    return { success: true, data: { id: `C${Date.now()}`, name } };
  }

  private async search(input: Record<string, unknown>): Promise<ToolResult> {
    return { success: true, data: { results: [], count: 0 } };
  }
}

import { toolRegistry } from './ToolRegistry.js';
toolRegistry.register(new EmailTool());
toolRegistry.register(new SlackTool());