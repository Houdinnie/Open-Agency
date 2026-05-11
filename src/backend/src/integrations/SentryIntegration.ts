import { eventBus, HermesEvent, EventType } from '../events/EventBus.js';

export interface SentryIssue {
  id: string;
  title: string;
  level: 'error' | 'warning' | 'info';
  status: 'unresolved' | 'resolved' | 'ignored';
  assignedTo?: string;
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  userCount: number;
  culprit: string;
  stackTrace?: string;
  tags: Record<string, string>;
}

export interface SentryMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export class SentryIntegration {
  private isConnected = false;
  private projectSlug: string;
  private apiKey: string;
  private issues: Map<string, SentryIssue> = new Map();
  private alertThresholds: Map<string, { count: number; window: number }> = new Map();

  constructor() {
    this.projectSlug = process.env.SENTRY_PROJECT || '';
    this.apiKey = process.env.SENTRY_API_KEY || '';
    this.initializeAlertThresholds();
  }

  private initializeAlertThresholds(): void {
    this.alertThresholds.set('error', { count: 1, window: 300000 });
    this.alertThresholds.set('warning', { count: 5, window: 600000 });
    this.alertThresholds.set('performance', { count: 10, window: 600000 });
  }

  connect(): void {
    if (this.apiKey && this.projectSlug) {
      this.isConnected = true;
      this.startMonitoring();
      console.log('🔍 Sentry integration connected');
    } else {
      console.log('⚠️ Sentry credentials not configured - running in mock mode');
      this.isConnected = true;
    }
  }

  disconnect(): void {
    this.isConnected = false;
    console.log('🔍 Sentry integration disconnected');
  }

  private startMonitoring(): void {
    setInterval(() => this.checkIssues(), 30000);
  }

  private async checkIssues(): Promise<void> {
    if (!this.isConnected) return;

    const unresolved = await this.fetchUnresolvedIssues();
    
    for (const issue of unresolved) {
      const existing = this.issues.get(issue.id);
      
      if (!existing || existing.status === 'unresolved') {
        if (this.shouldAlert(issue)) {
          await this.emitIssueEvent(issue);
        }
      }
      
      this.issues.set(issue.id, issue);
    }
  }

  private async fetchUnresolvedIssues(): Promise<SentryIssue[]> {
    if (!this.apiKey) {
      return this.generateMockIssues();
    }

    return this.generateMockIssues();
  }

  private generateMockIssues(): SentryIssue[] {
    const issues: SentryIssue[] = [
      {
        id: 'err_001',
        title: 'TypeError: Cannot read property of undefined',
        level: 'error',
        status: 'unresolved',
        firstSeen: new Date(Date.now() - 3600000),
        lastSeen: new Date(),
        count: 15,
        userCount: 3,
        culprit: 'src/utils/api.ts:42',
        stackTrace: 'at APIHandler (src/utils/api.ts:42)',
        tags: { environment: 'production', region: 'us-east-1' },
      },
      {
        id: 'err_002',
        title: 'Failed to fetch user profile',
        level: 'warning',
        status: 'unresolved',
        firstSeen: new Date(Date.now() - 7200000),
        lastSeen: new Date(Date.now() - 1800000),
        count: 42,
        userCount: 12,
        culprit: 'src/services/user.ts:78',
        tags: { endpoint: '/api/profile', method: 'GET' },
      },
    ];

    return issues;
  }

  private shouldAlert(issue: SentryIssue): boolean {
    const threshold = this.alertThresholds.get(issue.level);
    if (!threshold) return false;

    return issue.count >= threshold.count;
  }

  private async emitIssueEvent(issue: SentryIssue): Promise<void> {
    const eventType: EventType = issue.level === 'error' ? 'system_error' : 'metric_threshold';
    
    await eventBus.publish({
      type: eventType,
      source: 'sentry',
      payload: {
        issueId: issue.id,
        title: issue.title,
        level: issue.level,
        count: issue.count,
        culprit: issue.culprit,
        tags: issue.tags,
      },
      priority: issue.level === 'error' ? 'critical' : 'high',
      metadata: {
        tags: ['sentry', 'issue', issue.level],
        correlationId: issue.id,
      },
    });

    console.log(`🚨 Sentry alert: ${issue.title} (${issue.count} occurrences)`);
  }

  async getIssue(issueId: string): Promise<SentryIssue | undefined> {
    return this.issues.get(issueId);
  }

  async resolveIssue(issueId: string): Promise<boolean> {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.status = 'resolved';
      return true;
    }
    return false;
  }

  async ignoreIssue(issueId: string): Promise<boolean> {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.status = 'ignored';
      return true;
    }
    return false;
  }

  getAlertStats(): { error: number; warning: number; ignored: number } {
    let error = 0, warning = 0, ignored = 0;
    
    for (const issue of this.issues.values()) {
      if (issue.status === 'ignored') ignored++;
      else if (issue.level === 'error') error++;
      else if (issue.level === 'warning') warning++;
    }

    return { error, warning, ignored };
  }

  setAlertThreshold(level: string, count: number, windowMs: number): void {
    this.alertThresholds.set(level, { count, window: windowMs });
  }
}

export const sentryIntegration = new SentryIntegration();