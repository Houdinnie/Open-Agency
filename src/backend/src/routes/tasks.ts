import { Router } from 'express';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator.js';

export function createTaskRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { title, description, type, priority, input } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const task = await orchestrator.createTask(
      title,
      description || '',
      type,
      priority || 'medium',
      input || {}
    );

    res.status(201).json(task);
  });

  router.get('/', (req, res) => {
    const status = req.query.status as string;
    const tasks = orchestrator.getTasks(status as any);
    res.json(tasks);
  });

  router.get('/:id', async (req, res) => {
    const task = await orchestrator.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  });

  router.delete('/:id', async (req, res) => {
    const cancelled = await orchestrator.cancelTask(req.params.id);
    if (!cancelled) {
      return res.status(400).json({ error: 'Cannot cancel task' });
    }
    res.json({ success: true });
  });

  router.get('/stats', async (_req, res) => {
    const stats = await orchestrator.getStats();
    res.json(stats);
  });

  return router;
}