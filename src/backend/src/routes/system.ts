import { Router } from 'express';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator.js';
import { CostMonitorAgent } from '../agents/CostMonitorAgent.js';
import { SelfHealingSystem } from '../services/SelfHealingSystem.js';
import { ReflectionLoop } from '../memory/ReflectionLoop.js';
import { ResourceAllocator } from '../services/ResourceAllocator.js';

interface SystemServices {
  costMonitor: CostMonitorAgent;
  selfHealing: SelfHealingSystem;
  reflectionLoop: ReflectionLoop;
  resourceAllocator: ResourceAllocator;
  orchestrator: AgentOrchestrator;
}

export function createSystemRoutes(services: SystemServices): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json(services.selfHealing.getHealthStatus());
  });

  router.get('/snapshot', async (_req, res) => {
    const snapshot = await services.selfHealing.getSnapshot();
    res.json(snapshot);
  });

  router.post('/backup', async (req, res) => {
    const type = req.body.type as 'memory' | 'config' | 'full' || 'full';
    const backup = await services.selfHealing.performBackup(type);
    res.json(backup);
  });

  router.get('/backups', (_req, res) => {
    res.json(services.selfHealing.getBackups());
  });

  router.post('/restore/:id', async (req, res) => {
    const result = await services.selfHealing.restoreBackup(req.params.id);
    res.json(result);
  });

  router.post('/recover/:component', async (req, res) => {
    const result = await services.selfHealing.attemptRecovery(req.params.component);
    res.json(result);
  });

  router.get('/cost/metrics', (_req, res) => {
    res.json(services.costMonitor.getMetrics());
  });

  router.get('/cost/budget', (_req, res) => {
    res.json(services.costMonitor.checkBudget());
  });

  router.post('/cost/budget', (req, res) => {
    const result = services.costMonitor.setBudget(req.body);
    res.json(result);
  });

  router.get('/cost/optimize', (_req, res) => {
    res.json(services.costMonitor.suggestOptimizations());
  });

  router.get('/cost/report', (_req, res) => {
    res.json(services.costMonitor.generateReport());
  });

  router.post('/cost/track', async (req, res) => {
    const result = await services.costMonitor.trackCost(req.body);
    res.json(result);
  });

  router.get('/reflection', (_req, res) => {
    res.json(services.reflectionLoop.getReflectionHistory());
  });

  router.post('/reflection/trigger', async (req, res) => {
    const type = req.body.type as 'task_review' | 'periodic' | 'skill_creation' | 'optimization';
    const reflection = await services.reflectionLoop.performReflection(type || 'periodic');
    res.json(reflection);
  });

  router.get('/reflection/skills', async (_req, res) => {
    const skills = await services.reflectionLoop.getSkills();
    res.json(skills);
  });

  router.get('/resources', (_req, res) => {
    res.json(services.resourceAllocator.getResourceUtilization());
  });

  router.get('/resources/optimize', (_req, res) => {
    res.json(services.resourceAllocator.optimizeResourceAllocation());
  });

  router.post('/resources/low-cost', (req, res) => {
    const enabled = req.body.enabled as boolean;
    services.resourceAllocator.enableLowCostMode(enabled);
    res.json({ success: true, lowCostMode: enabled });
  });

  router.post('/resources/cap', (req, res) => {
    const { cpu, memory } = req.body;
    if (typeof cpu === 'number' && typeof memory === 'number') {
      services.resourceAllocator.setResourceCap(cpu, memory);
    }
    res.json({ success: true });
  });

  return router;
}