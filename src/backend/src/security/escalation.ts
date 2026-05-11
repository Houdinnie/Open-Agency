import { EscalationEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

type EscalationCallback = (event: EscalationEvent) => void;

export class EscalationManager {
  private pendingEscalations: Map<string, EscalationEvent> = new Map();
  private listeners: EscalationCallback[] = [];
  private resolvedHistory: EscalationEvent[] = [];
  private readonly MAX_HISTORY = 1000;

  createEscalation(params: {
    agentId: string;
    action: string;
    reason: string;
    requestedBy: string;
    metadata?: Record<string, unknown>;
  }): EscalationEvent {
    const event: EscalationEvent = {
      id: uuidv4(),
      agentId: params.agentId,
      action: params.action,
      reason: params.reason,
      requestedBy: params.requestedBy,
      createdAt: new Date(),
      status: 'pending',
      response: undefined,
    };

    this.pendingEscalations.set(event.id, event);
    
    console.log(`[Escalation] Created pending escalation ${event.id}: ${params.action}`);
    
    this.notifyListeners(event);
    
    return event;
  }

  approveEscalation(escalationId: string, note?: string, respondedBy?: string): boolean {
    const event = this.pendingEscalations.get(escalationId);
    if (!event) {
      console.log(`[Escalation] Escalation not found: ${escalationId}`);
      return false;
    }

    event.status = 'approved';
    event.response = {
      decision: 'approved',
      note,
      respondedBy: respondedBy || 'human',
      respondedAt: new Date(),
    };

    this.moveToHistory(event);
    this.notifyListeners(event);
    
    console.log(`[Escalation] Approved: ${escalationId}`);
    return true;
  }

  modifyEscalation(escalationId: string, note: string, respondedBy?: string): boolean {
    const event = this.pendingEscalations.get(escalationId);
    if (!event) return false;

    event.status = 'modified';
    event.response = {
      decision: 'modified',
      note,
      respondedBy: respondedBy || 'human',
      respondedAt: new Date(),
    };

    this.moveToHistory(event);
    this.notifyListeners(event);
    
    console.log(`[Escalation] Modified: ${escalationId}`);
    return true;
  }

  rejectEscalation(escalationId: string, note?: string, respondedBy?: string): boolean {
    const event = this.pendingEscalations.get(escalationId);
    if (!event) return false;

    event.status = 'rejected';
    event.response = {
      decision: 'rejected',
      note,
      respondedBy: respondedBy || 'human',
      respondedAt: new Date(),
    };

    this.moveToHistory(event);
    this.notifyListeners(event);
    
    console.log(`[Escalation] Rejected: ${escalationId}`);
    return true;
  }

  getPendingEscalations(): EscalationEvent[] {
    return Array.from(this.pendingEscalations.values());
  }

  getEscalation(id: string): EscalationEvent | undefined {
    return this.pendingEscalations.get(id) || this.resolvedHistory.find(e => e.id === id);
  }

  getEscalationHistory(limit: number = 100): EscalationEvent[] {
    return this.resolvedHistory.slice(-limit);
  }

  onEscalation(callback: EscalationCallback): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners(event: EscalationEvent): void {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('[Escalation] Listener error:', err);
      }
    });
  }

  private moveToHistory(event: EscalationEvent): void {
    this.pendingEscalations.delete(event.id);
    this.resolvedHistory.push(event);
    if (this.resolvedHistory.length > this.MAX_HISTORY) {
      this.resolvedHistory.shift();
    }
  }

  autoTimeout(ms: number = 300000): void {
    const timeout = setTimeout(() => {
      const now = new Date();
      for (const [id, event] of this.pendingEscalations) {
        if (now.getTime() - event.createdAt.getTime() > ms) {
          this.rejectEscalation(id, 'Auto-timeout: no response received', 'system');
        }
      }
    }, ms);
  }
}

export const escalationManager = new EscalationManager();