const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchAgents() {
  const res = await fetch(`${API_URL}/api/agents`);
  return res.json();
}

export async function fetchTasks() {
  const res = await fetch(`${API_URL}/api/tasks`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/api/status`);
  return res.json();
}

export async function createTask(data: {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  input?: Record<string, unknown>;
}) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function cancelTask(id: string) {
  const res = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function fetchMonetizationMetrics() {
  const res = await fetch(`${API_URL}/api/monetization/metrics`);
  return res.json();
}

export async function fetchRevenueStreams() {
  const res = await fetch(`${API_URL}/api/monetization/streams`);
  return res.json();
}

export async function fetchClients() {
  const res = await fetch(`${API_URL}/api/monetization/clients`);
  return res.json();
}

export async function fetchContentPieces(type?: string, status?: string) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  const res = await fetch(`${API_URL}/api/monetization/content/pieces?${params}`);
  return res.json();
}

export async function generateContent(data: {
  type: string;
  topic: string;
  keywords?: string[];
  platform?: string;
  tone?: string;
}) {
  const res = await fetch(`${API_URL}/api/monetization/content/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createContentCampaign(data: {
  name: string;
  topics: string[];
  platforms: string[];
  piecesPerTopic: number;
}) {
  const res = await fetch(`${API_URL}/api/monetization/content/campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchLeads(status?: string, minScore?: number) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (minScore) params.set('minScore', minScore.toString());
  const res = await fetch(`${API_URL}/api/monetization/leads?${params}`);
  return res.json();
}

export async function scrapeLeads(source: string, criteria: {
  keywords?: string[];
  count?: number;
}) {
  const res = await fetch(`${API_URL}/api/monetization/leads/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, criteria }),
  });
  return res.json();
}

export async function fetchSequences() {
  const res = await fetch(`${API_URL}/api/monetization/sequences`);
  return res.json();
}

export async function sendOutreach(leadId: string, sequenceId: string) {
  const res = await fetch(`${API_URL}/api/monetization/leads/${leadId}/outreach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequenceId }),
  });
  return res.json();
}

export async function fetchSEOCampaigns() {
  const res = await fetch(`${API_URL}/api/monetization/seo/campaigns`);
  return res.json();
}

export async function createSEOCampaign(domain: string, keywords: string[]) {
  const res = await fetch(`${API_URL}/api/monetization/seo/campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, keywords }),
  });
  return res.json();
}