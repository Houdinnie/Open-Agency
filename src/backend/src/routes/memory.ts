import { Router } from 'express';
import { MemorySystem } from '../memory/MemorySystem.js';

export function createMemoryRoutes(memory: MemorySystem): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { type, content, importance, tags, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const entry = await memory.store({
      type: type || 'knowledge',
      content,
      importance: importance || 0.5,
      tags: tags || [],
      metadata: metadata || {},
    });

    res.status(201).json(entry);
  });

  router.get('/', async (req, res) => {
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const entries = await memory.getRecent(type as any, limit);
    res.json(entries);
  });

  router.get('/search', async (req, res) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await memory.search(query, limit);
    res.json(results);
  });

  router.get('/:id', async (req, res) => {
    const entry = await memory.getById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Memory entry not found' });
    }
    res.json(entry);
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await memory.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Memory entry not found' });
    }
    res.json({ success: true });
  });

  router.get('/stats', (_req, res) => {
    res.json(memory.getStats());
  });

  return router;
}