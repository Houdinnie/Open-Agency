import { Router } from 'express';

interface RevenueAgent {
  getTiers: () => any[];
  getExperiments: () => any[];
  getRecommendations: () => any[];
  analyzePricing: (input: any) => any;
  generateRecommendations: (input: any) => any;
  runPricingExperiment: (input: any) => any;
  optimizeTiers: (input: any) => any;
  analyzeCompetitorPricing: (input: any) => any;
  calculateLTVBasedPricing: (input: any) => any;
  setApprovalThreshold: (type: string, value: number) => void;
}

export function createPricingRoutes(revenueAgent: RevenueAgent): Router {
  const router = Router();

  router.get('/tiers', (_req, res) => {
    res.json(revenueAgent.getTiers());
  });

  router.get('/experiments', (_req, res) => {
    res.json(revenueAgent.getExperiments());
  });

  router.get('/recommendations', (_req, res) => {
    res.json(revenueAgent.getRecommendations());
  });

  router.get('/analysis', async (_req, res) => {
    const analysis = await revenueAgent.analyzePricing({});
    res.json(analysis);
  });

  router.post('/recommendations/generate', async (req, res) => {
    const recommendations = await revenueAgent.generateRecommendations(req.body);
    res.json(recommendations);
  });

  router.post('/experiment', async (req, res) => {
    const experiment = await revenueAgent.runPricingExperiment(req.body);
    res.status(201).json(experiment);
  });

  router.post('/tiers/optimize', async (_req, res) => {
    const result = await revenueAgent.optimizeTiers({});
    res.json(result);
  });

  router.get('/competitors', async (_req, res) => {
    const analysis = await revenueAgent.analyzeCompetitorPricing({});
    res.json(analysis);
  });

  router.post('/ltv-pricing', async (req, res) => {
    const pricing = await revenueAgent.calculateLTVBasedPricing(req.body);
    res.json(pricing);
  });

  router.post('/approval-threshold', (req, res) => {
    const { type, value } = req.body;
    revenueAgent.setApprovalThreshold(type, value);
    res.json({ success: true });
  });

  router.get('/elasticity/:tierId', async (req, res) => {
    const elasticity = await revenueAgent.assessPriceElasticity({ tierId: req.params.tierId });
    res.json(elasticity);
  });

  return router;
}