import pg from 'pg';
import { Pool, PoolClient, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool: PGPool } = pg;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface EventRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  source?: string;
  timestamp: Date;
  priority: number;
  processed: boolean;
  agent_id?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  agent_id?: string;
  linear_id?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface MemoryRecord {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  memory_type: string;
  importance: number;
  created_at: Date;
}

export interface LeadRecord {
  id: string;
  email?: string;
  company?: string;
  source?: string;
  status: string;
  score: number;
  enrichment_data: Record<string, unknown>;
  created_at: Date;
  converted_at?: Date;
}

export class DatabaseConnection {
  private pool: Pool | null = null;
  private connected: boolean = false;

  async connect(config: DatabaseConfig): Promise<void> {
    this.pool = new PGPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
      console.log('[DB] Connected to PostgreSQL');
    } catch (error) {
      console.error('[DB] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      console.log('[DB] Disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private getPool(): Pool {
    if (!this.pool) throw new Error('Database not connected');
    return this.pool;
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await this.getPool().query<T>(text, params);
    console.log('[DB] Query executed in', Date.now() - start, 'ms');
    return result;
  }

  // Events
  async insertEvent(event: {
    type: string;
    payload: Record<string, unknown>;
    source?: string;
    priority?: number;
    agent_id?: string;
  }): Promise<string> {
    const id = uuidv4();
    await this.query(
      `INSERT INTO events (id, type, payload, source, priority, agent_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, event.type, JSON.stringify(event.payload), event.source, event.priority || 0, event.agent_id]
    );
    return id;
  }

  async getEvents(limit: number = 100, type?: string): Promise<EventRecord[]> {
    const text = type
      ? `SELECT * FROM events WHERE type = $1 ORDER BY timestamp DESC LIMIT $2`
      : `SELECT * FROM events ORDER BY timestamp DESC LIMIT $1`;
    const params = type ? [type, limit] : [limit];
    const result = await this.query<EventRecord>(text, params);
    return result.rows;
  }

  async markEventProcessed(id: string): Promise<void> {
    await this.query(`UPDATE events SET processed = TRUE WHERE id = $1`, [id]);
  }

  // Tasks
  async createTask(task: {
    title: string;
    description?: string;
    priority?: number;
    agent_id?: string;
    linear_id?: string;
  }): Promise<string> {
    const id = uuidv4();
    await this.query(
      `INSERT INTO tasks (id, title, description, priority, agent_id, linear_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, task.title, task.description, task.priority || 0, task.agent_id, task.linear_id]
    );
    return id;
  }

  async getTasks(status?: string, limit: number = 100): Promise<TaskRecord[]> {
    const text = status
      ? `SELECT * FROM tasks WHERE status = $1 ORDER BY priority DESC, created_at DESC LIMIT $2`
      : `SELECT * FROM tasks ORDER BY priority DESC, created_at DESC LIMIT $1`;
    const params = status ? [status, limit] : [limit];
    const result = await this.query<TaskRecord>(text, params);
    return result.rows;
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    const completedAt = status === 'completed' ? 'NOW()' : 'NULL';
    await this.query(
      `UPDATE tasks SET status = $1, updated_at = NOW(), completed_at = ${status === 'completed' ? 'NOW()' : 'NULL'} WHERE id = $2`,
      [status, id]
    );
  }

  // Memory with vectors
  async storeMemory(memory: {
    content: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
    memory_type?: string;
    importance?: number;
  }): Promise<string> {
    const id = uuidv4();
    await this.query(
      `INSERT INTO memory (id, content, embedding, metadata, memory_type, importance) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        memory.content,
        memory.embedding,
        JSON.stringify(memory.metadata || {}),
        memory.memory_type || 'general',
        memory.importance || 5,
      ]
    );
    return id;
  }

  async searchMemories(
    embedding: number[],
    matchCount: number = 5,
    memoryType?: string
  ): Promise<MemoryRecord[]> {
    const result = await this.query<MemoryRecord>(
      `SELECT * FROM find_similar_memories($1, $2, $3)`,
      [embedding, matchCount, memoryType || null]
    );
    return result.rows;
  }

  async getMemories(limit: number = 50, memoryType?: string): Promise<MemoryRecord[]> {
    const text = memoryType
      ? `SELECT * FROM memory WHERE memory_type = $1 ORDER BY importance DESC, created_at DESC LIMIT $2`
      : `SELECT * FROM memory ORDER BY importance DESC, created_at DESC LIMIT $1`;
    const params = memoryType ? [memoryType, limit] : [limit];
    const result = await this.query<MemoryRecord>(text, params);
    return result.rows;
  }

  // Agents
  async upsertAgent(agent: {
    id: string;
    name: string;
    role?: string;
    status?: string;
    capabilities?: string[];
    metrics?: Record<string, unknown>;
  }): Promise<void> {
    await this.query(
      `INSERT INTO agents (id, name, role, status, capabilities, metrics, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         capabilities = EXCLUDED.capabilities,
         metrics = EXCLUDED.metrics,
         last_active = NOW()`,
      [
        agent.id,
        agent.name,
        agent.role || 'general',
        agent.status || 'idle',
        JSON.stringify(agent.capabilities || []),
        JSON.stringify(agent.metrics || {}),
      ]
    );
  }

  async getAgents(): Promise<Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    last_active: Date;
  }>> {
    const result = await this.query(`SELECT id, name, role, status, last_active FROM agents`);
    return result.rows;
  }

  // Leads
  async createLead(lead: {
    email?: string;
    company?: string;
    source?: string;
    score?: number;
    enrichment_data?: Record<string, unknown>;
  }): Promise<string> {
    const id = uuidv4();
    await this.query(
      `INSERT INTO leads (id, email, company, source, score, enrichment_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        lead.email,
        lead.company,
        lead.source,
        lead.score || 0,
        JSON.stringify(lead.enrichment_data || {}),
      ]
    );
    return id;
  }

  async getLeads(status?: string, limit: number = 100): Promise<LeadRecord[]> {
    const text = status
      ? `SELECT * FROM leads WHERE status = $1 ORDER BY score DESC, created_at DESC LIMIT $2`
      : `SELECT * FROM leads ORDER BY score DESC, created_at DESC LIMIT $1`;
    const params = status ? [status, limit] : [limit];
    const result = await this.query<LeadRecord>(text, params);
    return result.rows;
  }

  async updateLeadStatus(id: string, status: string): Promise<void> {
    const convertedAt = status === 'converted' ? 'NOW()' : 'NULL';
    await this.query(
      `UPDATE leads SET status = $1, converted_at = ${status === 'converted' ? 'NOW()' : 'NULL'} WHERE id = $2`,
      [status, id]
    );
  }

  // Metrics
  async recordMetric(metric: {
    name: string;
    value: number;
    tags?: Record<string, unknown>;
  }): Promise<void> {
    await this.query(
      `INSERT INTO system_metrics (metric_name, metric_value, tags) VALUES ($1, $2, $3)`,
      [metric.name, metric.value, JSON.stringify(metric.tags || {})]
    );
  }

  async getMetrics(name: string, since: Date): Promise<Array<{
    metric_value: number;
    recorded_at: Date;
  }>> {
    const result = await this.query(
      `SELECT metric_value, recorded_at FROM system_metrics 
       WHERE metric_name = $1 AND recorded_at >= $2 
       ORDER BY recorded_at ASC`,
      [name, since]
    );
    return result.rows;
  }
}

export const db = new DatabaseConnection();