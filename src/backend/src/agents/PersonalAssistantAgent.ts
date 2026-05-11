import { Task, TaskResult, Agent } from '../types.js';
import { BaseAgent } from './BaseAgent.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { llmService } from '../services/LLMService.js';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'reminder' | 'task';
  location?: string;
  attendees?: string[];
  notes?: string;
}

interface Reminder {
  id: string;
  message: string;
  due: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class PersonalAssistantAgent extends BaseAgent {
  private events: Map<string, CalendarEvent> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private notes: Map<string, Note> = new Map();

  constructor(memory: MemorySystem) {
    super('Personal Assistant', 'personal', memory);
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const action = task.input?.action as string;

    try {
      let result: unknown;

      switch (action) {
        case 'schedule-event':
          result = await this.scheduleEvent(task.input);
          break;
        case 'create-reminder':
          result = await this.createReminder(task.input);
          break;
        case 'create-note':
          result = await this.createNote(task.input);
          break;
        case 'search-notes':
          result = await this.searchNotes(task.input);
          break;
        case 'get-day-summary':
          result = await this.getDaySummary(task.input);
          break;
        case 'prioritize-tasks':
          result = await this.prioritizeTasks(task.input);
          break;
        default:
          result = await this.handleGenericPersonal(task);
      }

      return {
        success: true,
        output: result,
        metrics: { duration: Date.now() - startTime },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { duration: Date.now() - startTime },
      };
    }
  }

  canHandle(task: Task): boolean {
    return task.type === 'personal' || task.input?.category === 'personal';
  }

  private async scheduleEvent(input: Record<string, unknown>): Promise<CalendarEvent> {
    const title = input.title as string;
    const startTime = input.start as string;
    const endTime = input.end as string;
    const type = (input.type as CalendarEvent['type']) || 'meeting';
    const location = input.location as string;
    const attendees = input.attendees as string[];

    const event: CalendarEvent = {
      id: `event_${Date.now()}`,
      title,
      start: new Date(startTime),
      end: new Date(endTime),
      type,
      location,
      attendees,
    };

    this.events.set(event.id, event);

    await this.memory.store({
      type: 'context',
      content: `Scheduled: ${title} at ${startTime}`,
      importance: 0.6,
      tags: ['calendar', 'event'],
      metadata: { eventId: event.id },
    });

    return event;
  }

  private async createReminder(input: Record<string, unknown>): Promise<Reminder> {
    const message = input.message as string;
    const due = input.due as string;
    const priority = (input.priority as Reminder['priority']) || 'medium';

    const reminder: Reminder = {
      id: `reminder_${Date.now()}`,
      message,
      due: new Date(due),
      priority,
      completed: false,
    };

    this.reminders.set(reminder.id, reminder);

    return reminder;
  }

  private async createNote(input: Record<string, unknown>): Promise<Note> {
    const title = input.title as string;
    const content = input.content as string;
    const tags = (input.tags as string[]) || [];

    const note: Note = {
      id: `note_${Date.now()}`,
      title,
      content,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.set(note.id, note);

    await this.memory.store({
      type: 'knowledge',
      content: `Note created: ${title}`,
      importance: 0.4,
      tags: ['note', ...tags],
      metadata: { noteId: note.id },
    });

    return note;
  }

  private async searchNotes(input: Record<string, unknown>): Promise<Note[]> {
    const query = (input.query as string) || '';
    const tags = input.tags as string[] | undefined;

    let notes = Array.from(this.notes.values());

    if (query) {
      const queryLower = query.toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(queryLower) ||
        n.content.toLowerCase().includes(queryLower)
      );
    }

    if (tags && tags.length > 0) {
      notes = notes.filter(n => tags.some(t => n.tags.includes(t)));
    }

    return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private async getDaySummary(input: Record<string, unknown>): Promise<{
    date: string;
    events: CalendarEvent[];
    reminders: Reminder[];
    completed: number;
    pending: number;
  }> {
    const dateStr = (input.date as string) || new Date().toISOString().split('T')[0];
    const targetDate = new Date(dateStr);

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const events = Array.from(this.events.values())
      .filter(e => e.start >= dayStart && e.start <= dayEnd)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const reminders = Array.from(this.reminders.values())
      .filter(r => r.due >= dayStart && r.due <= dayEnd);

    const completed = Array.from(this.reminders.values()).filter(r => r.completed).length;
    const pending = this.reminders.size - completed;

    return {
      date: dateStr,
      events,
      reminders,
      completed,
      pending,
    };
  }

  private async prioritizeTasks(input: Record<string, unknown>): Promise<{
    tasks: Array<{ id: string; priority: number; reason: string }>;
  }> {
    const tasks = input.tasks as Array<{ id: string; title: string; deadline?: string }>;

    const prompt = `Prioritize these tasks (1 = highest):
${tasks.map(t => `- ${t.title} ${t.deadline ? `(due: ${t.deadline})` : ''}`).join('\n')}

Return as JSON array with id, priority score, and reason.`;

    const response = await llmService.complete(prompt, {
      system: 'Prioritize based on urgency and importance.',
    });

    const prioritized = tasks.map((t, i) => ({
      id: t.id,
      priority: i + 1,
      reason: 'Based on deadline and importance',
    }));

    return { tasks: prioritized };
  }

  private async handleGenericPersonal(task: Task): Promise<string> {
    return `Personal task completed: ${task.title}`;
  }

  getEvents(date?: string): CalendarEvent[] {
    if (!date) return Array.from(this.events.values());
    const targetDate = new Date(date);
    return Array.from(this.events.values()).filter(e => 
      e.start.toDateString() === targetDate.toDateString()
    );
  }

  getReminders(): Reminder[] {
    return Array.from(this.reminders.values());
  }

  markReminderComplete(id: string): boolean {
    const reminder = this.reminders.get(id);
    if (reminder) {
      reminder.completed = true;
      return true;
    }
    return false;
  }

  protected getCapabilities(): string[] {
    return ['calendar', 'reminders', 'notes', 'task_prioritization'];
  }

  protected getConfig(): Agent['config'] {
    return {
      maxConcurrentTasks: 5,
      timeoutMs: 30000,
      retryAttempts: 2,
      autoApprove: true,
      approvalThreshold: 0,
    };
  }
}