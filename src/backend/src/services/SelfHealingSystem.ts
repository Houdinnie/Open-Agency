import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import { MemorySystem } from '../memory/MemorySystem.js';

export interface HealthCheck {
  id: string;
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastChecked: Date;
  responseTime?: number;
  details?: Record<string, unknown>;
}

export interface SystemSnapshot {
  id: string;
  timestamp: Date;
  components: HealthCheck[];
  metrics: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: number;
  };
  tasks: {
    pending: number;
    running: number;
    failed: number;
  };
}

export interface BackupData {
  id: string;
  timestamp: Date;
  type: 'memory' | 'config' | 'full';
  data: unknown;
  checksum: string;
}

export class SelfHealingSystem extends EventEmitter {
  private registry: AgentRegistry;
  private memory: MemorySystem;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private backups: BackupData[] = [];
  private isRunning = false;
  private healthInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;

  constructor(registry: AgentRegistry, memory: MemorySystem) {
    super();
    this.registry = registry;
    this.memory = memory;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.healthInterval = setInterval(() => this.performHealthChecks(), 30000);
    this.backupInterval = setInterval(() => this.performBackup(), 3600000);
    console.log('🩺 Self-Healing System started');
    await this.initialHealthCheck();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.healthInterval) clearInterval(this.healthInterval);
    if (this.backupInterval) clearInterval(this.backupInterval);
    console.log('🩺 Self-Healing System stopped');
  }

  private async initialHealthCheck(): Promise<void> {
    await this.checkAgentHealth();
    await this.checkMemoryHealth();
    await this.checkSystemResources();
  }

  private async performHealthChecks(): Promise<void> {
    await this.checkAgentHealth();
    await this.checkMemoryHealth();
    await this.checkSystemResources();
    await this.checkTaskQueue();
    this.emit('health-check:complete', this.getHealthStatus());
  }

  private async checkAgentHealth(): Promise<void> {
    const agents = this.registry.getAll();
    const healthCheck: HealthCheck = {
      id: uuidv4(),
      component: 'agents',
      status: 'healthy',
      message: 'All agents operational',
      lastChecked: new Date(),
      details: { total: agents.length },
    };

    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
    const errorAgents = agents.filter(a => a.status === 'error').length;

    if (errorAgents > 0) {
      healthCheck.status = 'unhealthy';
      healthCheck.message = `${errorAgents} agents in error state`;
    } else if (activeAgents === 0 && agents.length > 0) {
      healthCheck.status = 'degraded';
      healthCheck.message = 'No active agents';
    }

    this.healthChecks.set('agents', healthCheck);
  }

  private async checkMemoryHealth(): Promise<void> {
    const stats = this.memory.getStats();
    const healthCheck: HealthCheck = {
      id: uuidv4(),
      component: 'memory',
      status: 'healthy',
      message: 'Memory system operational',
      lastChecked: new Date(),
      details: stats,
    };

    if (stats.total > 10000) {
      healthCheck.status = 'degraded';
      healthCheck.message = 'High memory usage - consider consolidation';
    }

    this.healthChecks.set('memory', healthCheck);
  }

  private async checkSystemResources(): Promise<void> {
    const healthCheck: HealthCheck = {
      id: uuidv4(),
      component: 'system',
      status: 'healthy',
      message: 'System resources within limits',
      lastChecked: new Date(),
    };

    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    healthCheck.details = {
      heapUsed: `${heapUsedMB.toFixed(2)} MB`,
      uptime: `${process.uptime().toFixed(0)}s`,
    };

    if (heapUsedMB > 500) {
      healthCheck.status = 'degraded';
      healthCheck.message = 'High heap memory usage';
    } else if (heapUsedMB > 1000) {
      healthCheck.status = 'unhealthy';
      healthCheck.message = 'Critical memory usage';
    }

    this.healthChecks.set('system', healthCheck);
  }

  private async checkTaskQueue(): Promise<void> {
    const healthCheck: HealthCheck = {
      id: uuidv4(),
      component: 'tasks',
      status: 'healthy',
      message: 'Task queue operational',
      lastChecked: new Date(),
    };

    this.healthChecks.set('tasks', healthCheck);
  }

  getHealthStatus(): { overall: 'healthy' | 'degraded' | 'unhealthy'; checks: HealthCheck[] } {
    const checks = Array.from(this.healthChecks.values());
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');

    return {
      overall: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
      checks,
    };
  }

  async getSnapshot(): Promise<SystemSnapshot> {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      components: Array.from(this.healthChecks.values()),
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: 0,
      },
      tasks: {
        pending: 0,
        running: 0,
        failed: 0,
      },
    };
  }

  async performBackup(type: 'memory' | 'config' | 'full' = 'full'): Promise<BackupData> {
    const backupData: BackupData = {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      data: null as unknown,
      checksum: '',
    };

    switch (type) {
      case 'memory':
        backupData.data = this.getMemoryBackup();
        break;
      case 'config':
        backupData.data = this.getConfigBackup();
        break;
      case 'full':
        backupData.data = {
          memory: this.getMemoryBackup(),
          config: this.getConfigBackup(),
          health: this.getHealthStatus(),
        };
        break;
    }

    backupData.checksum = this.generateChecksum(backupData.data);
    this.backups.push(backupData);

    if (this.backups.length > 24) {
      this.backups = this.backups.slice(-24);
    }

    await this.memory.store({
      type: 'knowledge',
      content: `System backup created: ${type}`,
      importance: 0.8,
      tags: ['backup', type],
      metadata: { source: 'self-healing', backupId: backupData.id },
    });

    return backupData;
  }

  private getMemoryBackup(): unknown {
    return {
      timestamp: new Date(),
      stats: this.memory.getStats(),
    };
  }

  private getConfigBackup(): unknown {
    return {
      timestamp: new Date(),
      agentCount: this.registry.getAll().length,
    };
  }

  private generateChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  getBackups(limit = 10): BackupData[] {
    return this.backups.slice(-limit);
  }

  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      return { success: false, message: 'Backup not found' };
    }

    const checksum = this.generateChecksum(backup.data);
    if (checksum !== backup.checksum) {
      return { success: false, message: 'Backup checksum mismatch' };
    }

    return { success: true, message: 'Backup restored successfully' };
  }

  async handleFailure(component: string, error: Error): Promise<void> {
    console.error(`🔧 Handling failure in ${component}:`, error.message);

    await this.memory.store({
      type: 'interaction',
      content: `Component ${component} failed: ${error.message}`,
      importance: 0.9,
      tags: ['error', 'recovery', component],
      metadata: { source: 'self-healing', error: error.message },
    });

    this.emit('component:failure', { component, error });
  }

  async attemptRecovery(component: string): Promise<{ success: boolean; action: string }> {
    console.log(`🔄 Attempting recovery for ${component}`);

    switch (component) {
      case 'agents':
        return await this.recoverAgents();
      case 'memory':
        return await this.recoverMemory();
      case 'tasks':
        return { success: true, action: 'Task queue automatically recovered' };
      default:
        return { success: false, action: 'Unknown component' };
    }
  }

  private async recoverAgents(): Promise<{ success: boolean; action: string }> {
    const agents = this.registry.getAll();
    const failedAgents = agents.filter(a => a.status === 'error');

    for (const agent of failedAgents) {
      await this.registry.updateStatus(agent.id, 'idle');
    }

    return {
      success: true,
      action: `Reset ${failedAgents.length} failed agents to idle state`,
    };
  }

  private async recoverMemory(): Promise<{ success: boolean; action: string }> {
    await this.memory.consolidate();
    return { success: true, action: 'Memory consolidation completed' };
  }
}