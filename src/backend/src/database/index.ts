import { db, DatabaseConnection } from './connection';

export * from './connection';

export async function initDatabase(): Promise<void> {
  if (!db.isConnected()) {
    console.log('[DB] Warning: Database not connected. Run db.connect() first.');
  }
}

export async function closeDatabase(): Promise<void> {
  await db.disconnect();
}