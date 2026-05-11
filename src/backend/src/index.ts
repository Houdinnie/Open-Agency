import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AgentOrchestrator } from './orchestrator/AgentOrchestrator.js';
import { MemorySystem } from './memory/MemorySystem.js';
import { TaskRouter } from './orchestrator/TaskRouter.js';
import { AgentRegistry } from './agents/AgentRegistry.js';
import { CostMonitorAgent } from './agents/CostMonitorAgent.js';
import { SelfHealingSystem } from './services/SelfHealingSystem.js';
import { ReflectionLoop } from './memory/ReflectionLoop.js';
import { ResourceAllocator } from './services/ResourceAllocator.js';
import { createAgentRoutes } from './routes/agents.js';
import { createTaskRoutes } from './routes/tasks.js';
import { createMemoryRoutes } from './routes/memory.js';
import { createSystemRoutes } from './routes/system.js';
import { createMonetizationRoutes } from './routes/monetization.js';
import { createPricingRoutes } from './routes/pricing.js';
import { WebSocketHandler } from './services/WebSocketHandler.js';
import { browserAutomation } from './tools/BrowserAutomation.js';
import { monetizationEngine } from './services/MonetizationEngine.js';
import { contentEngine } from './services/AutonomousContentEngine.js';
import { outreachEngine } from './services/AutonomousOutreachEngine.js';
import { RevenueOptimizationAgent } from './agents/RevenueOptimizationAgent.js';
import { EventBus, eventBus } from './events/EventBus.js';
import { AutonomousScheduler, scheduler } from './events/AutonomousScheduler.js';
import { EventDispatcher } from './events/EventDispatcher.js';
import { SlackGateway } from './integrations/SlackGateway.js';
import { SentryIntegration, sentryIntegration } from './integrations/SentryIntegration.js';
import { LinearIntegration, linearIntegration } from './integrations/LinearIntegration.js';
import { GitHubIntegration, githubIntegration } from './integrations/GitHubIntegration.js';
import { TriageAgent } from './agents/TriageAgent.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

const memorySystem = new MemorySystem();
const agentRegistry = new AgentRegistry(memorySystem);
const taskRouter = new TaskRouter(agentRegistry);
const orchestrator = new AgentOrchestrator(memorySystem, agentRegistry, taskRouter);
const costMonitor = new CostMonitorAgent(memorySystem);
const selfHealing = new SelfHealingSystem(agentRegistry, memorySystem);
const reflectionLoop = new ReflectionLoop(memorySystem);
const resourceAllocator = new ResourceAllocator(agentRegistry);
const revenueOptimizer = new RevenueOptimizationAgent(memorySystem);
const dispatcher = new EventDispatcher(agentRegistry, memorySystem);
const slackGateway = new SlackGateway(agentRegistry);
const triageAgent = new TriageAgent(memorySystem, linearIntegration, githubIntegration);
const wsHandler = new WebSocketHandler(io, orchestrator);

app.use('/api/agents', createAgentRoutes(agentRegistry));
app.use('/api/tasks', createTaskRoutes(orchestrator));
app.use('/api/memory', createMemoryRoutes(memorySystem));
app.use('/api/system', createSystemRoutes({
  costMonitor,
  selfHealing,
  reflectionLoop,
  resourceAllocator,
  orchestrator,
}));

app.use('/api/monetization', createMonetizationRoutes());
app.use('/api/pricing', createPricingRoutes(revenueOptimizer));

app.get('/health', async (_req, res) => {
  const health = selfHealing.getHealthStatus();
  res.json({
    status: health.overall,
    uptime: process.uptime(),
    components: health.checks.length,
  });
});

app.get('/api/status', async (_req, res) => {
  const stats = await orchestrator.getStats();
  const health = selfHealing.getHealthStatus();
  const costMetrics = costMonitor.getMetrics();
  const reflectionStatus = reflectionLoop.getReflectionHistory();

  res.json({
    ...stats,
    health: health.overall,
    cost: costMetrics,
    reflection: reflectionStatus,
  });
});

const PORT = process.env.PORT || 3001;

async function startup() {
  console.log('🚀 Starting Open Agency...');
  console.log('💰 Monetization Engine loaded');
  console.log('📝 Content Engine loaded');
  console.log('📣 Outreach Engine loaded');
  console.log('💎 Revenue Optimization Agent loaded');
  console.log('📡 Event Bus initialized');
  console.log('⏰ Autonomous Scheduler loaded');
  console.log('🔀 Event Dispatcher configured');
  console.log('🔍 Sentry Integration loaded');
  console.log('📋 Linear Integration loaded');
  console.log('🐙 GitHub Integration loaded');
  console.log('🎯 Triage Agent loaded');

  await memorySystem.initialize();
  agentRegistry.initialize(memorySystem);
  await costMonitor.initialize();
  await orchestrator.start();
  await selfHealing.start();
  await reflectionLoop.start();
  await browserAutomation.initialize();

  scheduler.start();
  slackGateway.connect();
  sentryIntegration.connect();
  linearIntegration.connect();
  githubIntegration.connect();

  console.log('✅ All systems initialized');
  console.log('🔄 Autonomous loops running');
  console.log('🔄 Self-healing loop active');
  console.log('🤖 Open Agency is now operating continuously');
}

httpServer.listen(PORT, () => {
  console.log(`🤖 Atlas backend running on port ${PORT}`);
  startup().catch(console.error);
});

export {
  app,
  orchestrator,
  memorySystem,
  agentRegistry,
  costMonitor,
  selfHealing,
  reflectionLoop,
  resourceAllocator,
  eventBus,
  scheduler,
  dispatcher,
  slackGateway,
  io,
};