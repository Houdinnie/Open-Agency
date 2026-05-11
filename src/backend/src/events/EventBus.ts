import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface HermesEvent {
  id: string;
  type: EventType;
  source: string;
  payload: Record<string, unknown>;
  priority: EventPriority;
  timestamp: Date;
  metadata: EventMetadata;
}

export type EventType = 
  | 'lead_detected'
  | 'email_received'
  | 'price_change'
  | 'metric_threshold'
  | 'task_completed'
  | 'competitor_detected'
  | 'conversion_drop'
  | 'revenue_change'
  | 'system_error'
  | 'scheduled_trigger'
  | 'slack_command'
  | 'api_webhook';

export interface EventMetadata {
  correlationId?: string;
  traceId?: string;
  tags?: string[];
  userId?: string;
  sessionId?: string;
}

export interface EventSubscription {
  id: string;
  eventType: EventType | '*';
  handler: (event: HermesEvent) => Promise<void>;
  filter?: (event: HermesEvent) => boolean;
}

export class EventBus extends EventEmitter {
  private events: Map<string, HermesEvent> = new Map();
  private subscriptions: EventSubscription[] = [];
  private eventQueue: HermesEvent[] = [];
  private isProcessing = false;
  private priorityWeights: Record<EventPriority, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };

  constructor() {
    super();
    this.startProcessing();
  }

  async publish(event: Omit<HermesEvent, 'id' | 'timestamp'>): Promise<HermesEvent> {
    const hermesEvent: HermesEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.events.set(hermesEvent.id, hermesEvent);
    this.queueEvent(hermesEvent);

    this.emit('event:published', hermesEvent);
    
    return hermesEvent;
  }

  private queueEvent(event: HermesEvent): void {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => 
      this.priorityWeights[b.priority] - this.priorityWeights[a.priority]
    );
  }

  subscribe(subscription: Omit<EventSubscription, 'id'>): string {
    const newSub: EventSubscription = {
      ...subscription,
      id: uuidv4(),
    };
    this.subscriptions.push(newSub);
    return newSub.id;
  }

  unsubscribe(subscriptionId: string): boolean {
    const index = this.subscriptions.findIndex(s => s.id === subscriptionId);
    if (index > -1) {
      this.subscriptions.splice(index, 1);
      return true;
    }
    return false;
  }

  private async startProcessing(): Promise<void> {
    setInterval(() => this.processQueue(), 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      await this.processEvent(event);
    }

    this.isProcessing = false;
  }

  private async processEvent(event: HermesEvent): Promise<void> {
    const matchingSubs = this.subscriptions.filter(sub => 
      sub.eventType === '*' || sub.eventType === event.type
    );

    for (const sub of matchingSubs) {
      try {
        if (sub.filter && !sub.filter(event)) continue;
        
        event.metadata.tags = [...(event.metadata.tags || []), `processed_by:${sub.id}`];
        await sub.handler(event);
        
        this.emit('event:handled', { event, subscription: sub.id });
      } catch (error) {
        this.emit('event:error', { event, subscription: sub.id, error });
      }
    }
  }

  getEvent(eventId: string): HermesEvent | undefined {
    return this.events.get(eventId);
  }

  getEvents(filter?: { type?: EventType; status?: EventStatus; limit?: number }): HermesEvent[] {
    let events = Array.from(this.events.values());

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type);
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  subscribeToType(type: EventType, handler: (event: HermesEvent) => Promise<void>): string {
    return this.subscribe({ eventType: type, handler });
  }

  subscribeToAll(handler: (event: HermesEvent) => Promise<void>): string {
    return this.subscribe({ eventType: '*', handler });
  }

  clearOldEvents(olderThanMs: number = 3600000): number {
    const cutoff = Date.now() - olderThanMs;
    let cleared = 0;

    for (const [id, event] of this.events) {
      if (event.timestamp.getTime() < cutoff) {
        this.events.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  getStats(): { queued: number; total: number; subscriptions: number } {
    return {
      queued: this.eventQueue.length,
      total: this.events.size,
      subscriptions: this.subscriptions.length,
    };
  }
}

export const eventBus = new EventBus();