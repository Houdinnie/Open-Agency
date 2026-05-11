import { eventBus, HermesEvent, EventType } from './EventBus.js';

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  runCount: number;
  failureCount: number;
}

export interface ContinuousLoopConfig {
  agentId: string;
  loopName: string;
  intervalMs: number;
  handler: () => Promise<LoopResult>;
  onSuccess?: (result: LoopResult) => void;
  onFailure?: (error: Error) => void;
}

export interface LoopResult {
  success: boolean;
  actions: string[];
  insights: string[];
  blockers?: string[];
  needsApproval?: boolean;
  metrics?: Record<string, number>;
}

export class AutonomousScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private loops: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeDefaultJobs();
    this.initializeAgentLoops();
  }

  private initializeDefaultJobs(): void {
    this.scheduleJob({
      id: 'system_health_check',
      name: 'System Health Check',
      cronExpression: '*/5 * * * *',
      handler: async () => {
        await eventBus.publish({
          type: 'scheduled_trigger',
          source: 'scheduler',
          payload: { job: 'health_check' },
          priority: 'low',
          metadata: { tags: ['system', 'monitoring'] },
        });
      },
      enabled: true,
    });

    this.scheduleJob({
      id: 'market_analysis',
      name: 'Market Analysis',
      cronExpression: '0 */6 * * *',
      handler: async () => {
        await eventBus.publish({
          type: 'scheduled_trigger',
          source: 'scheduler',
          payload: { job: 'market_analysis' },
          priority: 'medium',
          metadata: { tags: ['research', 'market'] },
        });
      },
      enabled: true,
    });

    this.scheduleJob({
      id: 'pricing_optimization',
      name: 'Pricing Optimization',
      cronExpression: '0 */4 * * *',
      handler: async () => {
        await eventBus.publish({
          type: 'scheduled_trigger',
          source: 'scheduler',
          payload: { job: 'pricing_optimization' },
          priority: 'high',
          metadata: { tags: ['pricing', 'optimization'] },
        });
      },
      enabled: true,
    });

    this.scheduleJob({
      id: 'lead_outreach',
      name: 'Lead Outreach Cycle',
      cronExpression: '*/15 * * * *',
      handler: async () => {
        await eventBus.publish({
          type: 'scheduled_trigger',
          source: 'scheduler',
          payload: { job: 'lead_outreach' },
          priority: 'high',
          metadata: { tags: ['outreach', 'growth'] },
        });
      },
      enabled: true,
    });

    this.scheduleJob({
      id: 'content_generation',
      name: 'Content Generation',
      cronExpression: '0 */3 * * *',
      handler: async () => {
        await eventBus.publish({
          type: 'scheduled_trigger',
          source: 'scheduler',
          payload: { job: 'content_generation' },
          priority: 'medium',
          metadata: { tags: ['content', 'marketing'] },
        });
      },
      enabled: true,
    });
  }

  private initializeAgentLoops(): void {
    eventBus.subscribeToType('scheduled_trigger', async (event) => {
      console.log(`📋 Scheduled trigger: ${event.payload.job}`);
    });
  }

  start(): void {
    this.isRunning = true;
    
    for (const [id, job] of this.jobs) {
      if (job.enabled) {
        this.startJob(id);
      }
    }

    console.log('⏰ Autonomous Scheduler started');
  }

  stop(): void {
    this.isRunning = false;
    
    for (const [id, timeout] of this.loops) {
      clearInterval(timeout);
    }
    this.loops.clear();

    console.log('⏰ Autonomous Scheduler stopped');
  }

  scheduleJob(job: Omit<ScheduledJob, 'id' | 'lastRun' | 'nextRun' | 'runCount' | 'failureCount'>): string {
    const newJob: ScheduledJob = {
      ...job,
      id: job.id || `job_${Date.now()}`,
      lastRun: undefined,
      nextRun: this.calculateNextRun(job.cronExpression),
      runCount: 0,
      failureCount: 0,
    };

    this.jobs.set(newJob.id, newJob);

    if (this.isRunning && newJob.enabled) {
      this.startJob(newJob.id);
    }

    return newJob.id;
  }

  private startJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const runJob = async () => {
      try {
        await job.handler();
        job.lastRun = new Date();
        job.nextRun = this.calculateNextRun(job.cronExpression);
        job.runCount++;
        
        console.log(`✅ Job completed: ${job.name}`);
      } catch (error) {
        job.failureCount++;
        console.error(`❌ Job failed: ${job.name}`, error);
      }
    };

    const delay = job.nextRun.getTime() - Date.now();
    setTimeout(() => {
      runJob();
      const interval = this.cronToMs(job.cronExpression);
      this.loops.set(jobId, setInterval(runJob, interval));
    }, Math.max(0, delay));
  }

  registerContinuousLoop(config: ContinuousLoopConfig): string {
    const loopId = `loop_${config.agentId}_${config.loopName}`;

    const runLoop = async () => {
      console.log(`🔄 Running continuous loop: ${config.loopName}`);
      
      try {
        const result = await config.handler();
        
        if (result.success) {
          config.onSuccess?.(result);
          
          if (result.needsApproval) {
            await eventBus.publish({
              type: 'scheduled_trigger',
              source: 'continuous_loop',
              payload: {
                loop: config.loopName,
                agentId: config.agentId,
                result,
                action: 'approval_required',
              },
              priority: 'high',
              metadata: { tags: ['approval', config.agentId] },
            });
          }
        } else {
          config.onFailure?.(new Error('Loop execution failed'));
        }
      } catch (error) {
        config.onFailure?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const interval = setInterval(runLoop, config.intervalMs);
    this.loops.set(loopId, interval);

    runLoop();

    return loopId;
  }

  stopLoop(loopId: string): boolean {
    const interval = this.loops.get(loopId);
    if (interval) {
      clearInterval(interval);
      this.loops.delete(loopId);
      return true;
    }
    return false;
  }

  private calculateNextRun(cronExpression: string): Date {
    const [minute, hour, day, month, weekDay] = cronExpression.split(' ');
    const now = new Date();
    const next = new Date(now);

    if (minute.includes('*')) {
      next.setMinutes(0, 0, 0);
      next.setMinutes(next.getMinutes() + parseInt(minute) || 5);
    } else {
      next.setMinutes(parseInt(minute), 0, 0);
    }

    if (hour !== '*') next.setHours(parseInt(hour));
    if (day !== '*') next.setDate(parseInt(day));
    if (month !== '*') next.setMonth(parseInt(month) - 1);

    if (next <= now) {
      next.setHours(next.getHours() + 1);
    }

    return next;
  }

  private cronToMs(cron: string): number {
    const [minute] = cron.split(' ');
    if (minute.includes('*/')) {
      return parseInt(minute.replace('*/', '')) * 60000;
    }
    return 300000;
  }

  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  getLoops(): string[] {
    return Array.from(this.loops.keys());
  }
}

export const scheduler = new AutonomousScheduler();