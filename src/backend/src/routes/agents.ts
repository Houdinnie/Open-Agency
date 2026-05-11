import { Router } from 'express';
import { AgentRegistry } from '../agents/AgentRegistry.js';

export function createAgentRoutes(registry: AgentRegistry): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(registry.getAll());
  });

  router.get('/:id', (req, res) => {
    const agent = registry.getMetadata(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  });

  router.post('/:id/start', async (req, res) => {
    const agent = registry.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    await agent.initialize();
    res.json({ success: true });
  });

  router.post('/:id/stop', (req, res) => {
    const agent = registry.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    agent.setStatus('idle');
    res.json({ success: true });
  });

  router.get('/stats', (_req, res) => {
    res.json(registry.getStats());
  });

  return router;
}