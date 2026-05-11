import { v4 as uuidv4 } from 'uuid';
import { MemoryEntry, MemoryType, MemoryMetadata } from '../types.js';

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
}

export class MemorySystem {
  private shortTerm: Map<string, MemoryEntry> = new Map();
  private longTerm: Map<string, MemoryEntry> = new Map();
  private userProfile: Map<string, unknown> = new Map();

  async initialize(): Promise<void> {
    console.log('📚 Memory System initialized');
  }

  async store(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessedAt'>): Promise<MemoryEntry> {
    const memoryEntry: MemoryEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date(),
      accessedAt: new Date(),
    };

    if (entry.importance > 0.7 || entry.type === 'preference') {
      this.longTerm.set(memoryEntry.id, memoryEntry);
    } else {
      this.shortTerm.set(memoryEntry.id, memoryEntry);
    }

    return memoryEntry;
  }

  async search(query: string, limit = 10): Promise<MemorySearchResult[]> {
    const allEntries = [...this.shortTerm.values(), ...this.longTerm.values()];
    const results: MemorySearchResult[] = [];

    const queryLower = query.toLowerCase();

    for (const entry of allEntries) {
      const contentLower = entry.content.toLowerCase();
      let score = 0;

      if (contentLower.includes(queryLower)) {
        score = 1;
        if (entry.tags.some(t => queryLower.includes(t.toLowerCase()))) {
          score += 0.5;
        }
      }

      if (score > 0) {
        results.push({ entry, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getById(id: string): Promise<MemoryEntry | null> {
    return (
      this.shortTerm.get(id) ||
      this.longTerm.get(id) ||
      null
    );
  }

  async getRecent(type?: MemoryType, limit = 50): Promise<MemoryEntry[]> {
    const allEntries = [...this.shortTerm.values(), ...this.longTerm.values()];
    let filtered = allEntries;

    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }

    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    const entry =
      this.shortTerm.get(id) ||
      this.longTerm.get(id);

    if (!entry) return null;

    const updated = { ...entry, ...updates, accessedAt: new Date() };

    if (this.shortTerm.has(id)) {
      this.shortTerm.set(id, updated);
    } else {
      this.longTerm.set(id, updated);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (this.shortTerm.has(id)) {
      this.shortTerm.delete(id);
      return true;
    }
    if (this.longTerm.has(id)) {
      this.longTerm.delete(id);
      return true;
    }
    return false;
  }

  async consolidate(): Promise<void> {
    const toPromote: MemoryEntry[] = [];
    const toDemote: MemoryEntry[] = [];

    for (const [id, entry] of this.shortTerm) {
      if (entry.accessedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
        toPromote.push(entry);
      }
    }

    for (const [id, entry] of this.longTerm) {
      if (entry.accessedAt.getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000) {
        toDemote.push(entry);
      }
    }

    for (const entry of toPromote) {
      this.shortTerm.delete(entry.id);
      this.longTerm.set(entry.id, { ...entry, importance: Math.min(1, entry.importance + 0.1) });
    }

    for (const entry of toDemote) {
      this.longTerm.delete(entry.id);
    }
  }

  getStats() {
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTerm.size,
      total: this.shortTerm.size + this.longTerm.size,
    };
  }

  setUserProfile(key: string, value: unknown): void {
    this.userProfile.set(key, value);
  }

  getUserProfile(key: string): unknown {
    return this.userProfile.get(key);
  }
}