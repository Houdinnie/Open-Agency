# Atlas - Personal Autonomous Business AI Agent

Eternal Employee - Your Personal Autonomous Business AI Agent (Codename: "Atlas")

## Project Structure

```
atlas/
├── docker/
│   └── docker-compose.yml      # Local/VPS deployment
├── src/
│   ├── backend/                # Node.js/TypeScript backend
│   │   ├── src/
│   │   │   ├── agents/          # Agent system
│   │   │   │   ├── AgentRegistry.ts
│   │   │   │   ├── BaseAgent.ts
│   │   │   │   └── CostMonitorAgent.ts
│   │   │   ├── db/             # Database schemas
│   │   │   ├── memory/         # Memory & Learning
│   │   │   │   ├── MemorySystem.ts
│   │   │   │   └── ReflectionLoop.ts
│   │   │   ├── orchestrator/   # Task routing & orchestration
│   │   │   ├── routes/         # REST API routes
│   │   │   ├── services/       # Core services
│   │   │   │   ├── SelfHealingSystem.ts
│   │   │   │   ├── ResourceAllocator.ts
│   │   │   │   └── WebSocketHandler.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── frontend/               # Next.js React frontend
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── types/
│       └── package.json
├── docker/
├── package.json
└── .env.example
```

## Quick Start

```bash
cd atlas
npm install
cp .env.example .env
npm run docker:up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features Implemented

### Core Systems
- ✅ Agent orchestration framework
- ✅ Memory system (short-term + long-term)
- ✅ Task routing & execution
- ✅ Agent registry with 6 default agents

### Sustainability Features (PRD Addendum)
- ✅ **CostMonitorAgent**: Real-time cost tracking, budgets, optimizations
- ✅ **SelfHealingSystem**: Health checks, auto-recovery, backups
- ✅ **ReflectionLoop**: Task reviews, skill creation, self-improvement
- ✅ **ResourceAllocator**: ROI-based task prioritization, low-cost mode

### API Endpoints
- `GET/POST /api/agents` - Agent management
- `GET/POST /api/tasks` - Task operations
- `GET/POST /api/memory` - Memory storage
- `GET /api/system/health` - System health status
- `GET /api/system/cost/metrics` - Cost tracking
- `GET /api/system/reflection` - Learning history
- `GET /api/system/resources` - Resource utilization

## Next Steps

- Implement specific agent implementations
- Add LLM integration (OpenAI, Anthropic, Grok)
- Connect to Chroma for vector similarity
- Build out dashboard with visualizations

## Tech Stack

- **Backend:** Node.js, TypeScript, Express, Socket.io
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Database:** PostgreSQL + pgvector, Chroma, Neo4j
- **Deployment:** Docker Compose