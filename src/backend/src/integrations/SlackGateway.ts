import { eventBus, HermesEvent, EventType } from '../events/EventBus.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  threadTs?: string;
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: unknown[];
  accessory?: unknown;
}

interface SlackCommand {
  command: string;
  text: string;
  userId: string;
  channelId: string;
  responseUrl: string;
}

export class SlackGateway {
  private registry: AgentRegistry;
  private channelAgents: Map<string, string> = new Map();
  private isConnected = false;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
    this.initializeMappings();
    this.setupEventHandlers();
  }

  private initializeMappings(): void {
    this.channelAgents.set('#hermes-ceo', 'orchestrator');
    this.channelAgents.set('#hermes-growth', 'marketing');
    this.channelAgents.set('#hermes-sales', 'sales');
    this.channelAgents.set('#hermes-ops', 'operations');
    this.channelAgents.set('#hermes-research', 'research');
    this.channelAgents.set('#hermes-pricing', 'finance');
    this.channelAgents.set('#hermes-alerts', 'operations');
  }

  private setupEventHandlers(): void {
    eventBus.subscribeToAll(async (event) => {
      if (this.isConnected) {
        await this.handleSystemEvent(event);
      }
    });
  }

  connect(): void {
    this.isConnected = true;
    console.log('🔗 Slack Gateway connected');
  }

  disconnect(): void {
    this.isConnected = false;
    console.log('🔗 Slack Gateway disconnected');
  }

  async handleCommand(command: SlackCommand): Promise<SlackMessage> {
    const parts = command.text.trim().split(' ');
    const action = parts[0];
    const args = parts.slice(1).join(' ');

    switch (action) {
      case 'status':
        return this.formatStatus();
      
      case 'agents':
        return this.formatAgents();
      
      case 'leads':
        return { channel: command.channelId, text: 'Fetching leads...' };
      
      case 'run':
        return await this.handleRunCommand(args, command);
      
      case 'pause':
        return this.handlePauseCommand(args);
      
      case 'approve':
        return this.handleApproveCommand(args);
      
      case 'help':
        return this.formatHelp();
      
      default:
        return {
          channel: command.channelId,
          text: `Unknown command: ${action}. Type /hermes help for available commands.`,
        };
    }
  }

  private async handleRunCommand(args: string, command: SlackCommand): Promise<SlackMessage> {
    const [agentName, ...rest] = args.split(' ');
    const task = rest.join(' ');

    const agentType = this.resolveAgentType(agentName);
    if (!agentType) {
      return { channel: command.channelId, text: `Unknown agent: ${agentName}` };
    }

    const agent = this.registry.getAgentByType(agentType as any);
    if (!agent) {
      return { channel: command.channelId, text: `Agent ${agentName} not available` };
    }

    await eventBus.publish({
      type: 'slack_command',
      source: 'slack',
      payload: { agent: agentName, task, userId: command.userId },
      priority: 'high',
      metadata: { userId: command.userId, channelId: command.channelId },
    });

    return {
      channel: command.channelId,
      text: `🚀 Initiated ${agentName}: ${task}`,
    };
  }

  private handlePauseCommand(agentName: string): SlackMessage {
    return {
      channel: '',
      text: `⏸️ Paused ${agentName || 'all agents'}`,
    };
  }

  private handleApproveCommand(taskId: string): SlackMessage {
    return {
      channel: '',
      text: `✅ Approved task ${taskId}`,
    };
  }

  private formatStatus(): SlackMessage {
    const agents = this.registry.getAll();
    const active = agents.filter(a => a.status === 'active' || a.status === 'busy');
    const stats = this.registry.getStats();

    return {
      channel: '',
      text: '',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🤖 Open Agency Status*\n\n' +
              `• Active Agents: ${stats.active}\n` +
              `• Total Tasks: ${stats.total}\n` +
              `• System: Operational\n` +
              `• Uptime: ${Math.floor(process.uptime() / 60)}m`,
          },
        },
      ],
    };
  }

  private formatAgents(): SlackMessage {
    const agents = this.registry.getAll();
    
    return {
      channel: '',
      text: '',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Agents:*\n' +
              agents.map(a => `• ${a.name} (${a.status})`).join('\n'),
          },
        },
      ],
    };
  }

  private formatHelp(): SlackMessage {
    return {
      channel: '',
      text: '',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Commands:*\n\n' +
              '• `/hermes status` - System status\n' +
              '• `/hermes agents` - List agents\n' +
              '• `/hermes run <agent> <task>` - Run task\n' +
              '• `/hermes pause <agent>` - Pause agent\n' +
              '• `/hermes approve <task>` - Approve task\n\n' +
              '*Examples:*\n' +
              '• `/hermes run growth find leads in fintech`\n' +
              '• `/hermes run pricing optimize enterprise`',
          },
        },
      ],
    };
  }

  private resolveAgentType(name: string): string | null {
    const mapping: Record<string, string> = {
      growth: 'marketing',
      marketing: 'marketing',
      sales: 'sales',
      ops: 'operations',
      operations: 'operations',
      research: 'research',
      pricing: 'finance',
      finance: 'finance',
      ceo: 'orchestrator',
      evolution: 'orchestrator',
    };
    return mapping[name.toLowerCase()] || null;
  }

  private async handleSystemEvent(event: HermesEvent): Promise<void> {
    const alerts = ['conversion_drop', 'revenue_change', 'competitor_detected', 'system_error'];
    
    if (alerts.includes(event.type)) {
      console.log(`📢 Sending alert for ${event.type}`);
    }
  }

  async sendMessage(message: SlackMessage): Promise<void> {
    if (this.isConnected) {
      console.log(`📤 Slack message: ${message.text.substring(0, 50)}...`);
    }
  }

  async sendToChannel(channel: string, text: string, blocks?: SlackBlock[]): Promise<void> {
    await this.sendMessage({ channel, text, blocks });
  }

  async sendToThread(channel: string, threadTs: string, text: string): Promise<void> {
    await this.sendMessage({ channel, text, threadTs });
  }

  async sendAgentUpdate(agentName: string, update: string): Promise<void> {
    const channel = this.channelAgents.get(`#hermes-${agentName}`) || '#hermes-alerts';
    await this.sendToChannel(channel, update);
  }
}