import { Router } from 'express';
import { monetizationEngine } from '../services/MonetizationEngine.js';
import { contentEngine } from '../services/AutonomousContentEngine.js';
import { outreachEngine } from '../services/AutonomousOutreachEngine.js';

export function createMonetizationRoutes(): Router {
  const router = Router();

  router.get('/metrics', (_req, res) => {
    res.json(monetizationEngine.getFinancialMetrics());
  });

  router.get('/streams', (_req, res) => {
    res.json(monetizationEngine.getRevenueStreams());
  });

  router.get('/clients', (_req, res) => {
    res.json(monetizationEngine.getClients());
  });

  router.post('/clients', (req, res) => {
    const client = monetizationEngine.addClient(req.body);
    res.status(201).json(client);
  });

  router.get('/campaigns', (_req, res) => {
    res.json(monetizationEngine.getCampaigns());
  });

  router.post('/campaigns', (req, res) => {
    const campaign = monetizationEngine.createCampaign(req.body);
    res.status(201).json(campaign);
  });

  router.get('/projection', (req, res) => {
    const months = parseInt(req.query.months as string) || 6;
    res.json(monetizationEngine.projectRevenue(months));
  });

  router.get('/content/pieces', (req, res) => {
    const filter = { type: req.query.type as string, status: req.query.status as string };
    res.json(contentEngine.getContentPieces(filter));
  });

  router.post('/content/generate', async (req, res) => {
    const piece = await contentEngine.generateContent(req.body);
    res.status(201).json(piece);
  });

  router.post('/content/campaign', async (req, res) => {
    const campaign = await contentEngine.createCampaign(req.body);
    res.status(201).json(campaign);
  });

  router.get('/content/campaigns', (_req, res) => {
    res.json(contentEngine.getCampaigns());
  });

  router.post('/content/:id/distribute', async (req, res) => {
    const result = await contentEngine.distributeContent(req.params.id);
    res.json(result);
  });

  router.get('/seo/campaigns', (_req, res) => {
    res.json(contentEngine.getSEOCampaigns());
  });

  router.post('/seo/campaign', async (req, res) => {
    const { domain, keywords } = req.body;
    const campaign = await contentEngine.executeSEOCampaign(domain, keywords);
    res.status(201).json(campaign);
  });

  router.get('/leads', (req, res) => {
    const filter = { status: req.query.status as string, minScore: parseInt(req.query.minScore as string) };
    res.json(outreachEngine.getLeads(filter));
  });

  router.post('/leads/scrape', async (req, res) => {
    const { source, criteria } = req.body;
    const leads = await outreachEngine.scrapeLeads(source, criteria);
    res.json(leads);
  });

  router.post('/leads/:id/enrich', async (req, res) => {
    const lead = await outreachEngine.enrichLead(req.params.id);
    res.json(lead);
  });

  router.post('/leads/:id/outreach', async (req, res) => {
    const { sequenceId } = req.body;
    const result = await outreachEngine.sendOutreach(req.params.id, sequenceId);
    res.json(result);
  });

  router.get('/sequences', (_req, res) => {
    res.json(outreachEngine.getSequences());
  });

  router.get('/outreach/campaigns', (_req, res) => {
    res.json(outreachEngine.getCampaigns());
  });

  router.post('/outreach/campaign', async (req, res) => {
    const campaign = await outreachEngine.createCampaign(req.body);
    res.status(201).json(campaign);
  });

  router.patch('/leads/:id/status', (req, res) => {
    const { status } = req.body;
    const success = outreachEngine.updateLeadStatus(req.params.id, status);
    res.json({ success });
  });

  return router;
}