'use client';

import { useEffect, useState } from 'react';
import { Users, Target, Mail, MessageSquare, Zap, Plus, Search, Filter } from 'lucide-react';
import { fetchLeads, scrapeLeads, fetchSequences } from '@/lib/api';
import type { Lead, OutreachSequence } from '@/types';

export function OutreachEngine() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sequences, setSequences] = useState<OutreachSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [filter, setFilter] = useState({ status: '', minScore: 0 });
  const [showScraper, setShowScraper] = useState(false);
  const [scrapeConfig, setScrapeConfig] = useState({ source: 'linkedin', keywords: '', count: 20 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [leadsData, sequencesData] = await Promise.all([
        fetchLeads(filter.status || undefined, filter.minScore || undefined),
        fetchSequences(),
      ]);
      setLeads(leadsData);
      setSequences(sequencesData);
    } catch (error) {
      console.error('Failed to load outreach data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleScrape() {
    if (!scrapeConfig.keywords) return;
    setScraping(true);
    try {
      const newLeads = await scrapeLeads(scrapeConfig.source, {
        keywords: scrapeConfig.keywords.split(',').map(k => k.trim()).filter(Boolean),
        count: scrapeConfig.count,
      });
      setLeads([...newLeads, ...leads]);
      setShowScraper(false);
      setScrapeConfig({ source: 'linkedin', keywords: '', count: 20 });
    } catch (error) {
      console.error('Failed to scrape leads:', error);
    } finally {
      setScraping(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const newLeads = leads.filter(l => l.status === 'new').length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  const avgScore = Math.round(leads.reduce((sum, l) => sum + l.score, 0) / Math.max(1, leads.length));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outreach Engine</h1>
          <p className="text-slate-500">Autonomous lead generation & outreach</p>
        </div>
        <button
          onClick={() => setShowScraper(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Zap size={18} />
          <span>Scrape Leads</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leads.length}</p>
              <p className="text-sm text-slate-500">Total Leads</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{newLeads}</p>
              <p className="text-sm text-slate-500">New</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contactedLeads}</p>
              <p className="text-sm text-slate-500">Contacted</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgScore}</p>
              <p className="text-sm text-slate-500">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {showScraper && (
        <div className="glass rounded-xl p-5 border-2 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Scrape New Leads</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select
                value={scrapeConfig.source}
                onChange={(e) => setScrapeConfig({ ...scrapeConfig, source: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="apollo">Apollo</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keywords</label>
              <input
                type="text"
                value={scrapeConfig.keywords}
                onChange={(e) => setScrapeConfig({ ...scrapeConfig, keywords: e.target.value })}
                placeholder="SaaS, AI, Marketing..."
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Count</label>
              <input
                type="number"
                value={scrapeConfig.count}
                onChange={(e) => setScrapeConfig({ ...scrapeConfig, count: parseInt(e.target.value) || 20 })}
                min={1}
                max={100}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleScrape}
              disabled={scraping || !scrapeConfig.keywords}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {scraping ? <Zap className="animate-spin" size={18} /> : <Zap size={18} />}
              <span>{scraping ? 'Scraping...' : 'Start Scraping'}</span>
            </button>
            <button
              onClick={() => setShowScraper(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Lead Database</h2>
            <div className="flex gap-2">
              <select
                value={filter.status}
                onChange={(e) => { setFilter({ ...filter, status: e.target.value }); loadData(); }}
                className="p-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No leads yet. Scrape some leads to get started!</p>
            ) : (
              leads.slice(0, 10).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      lead.score >= 80 ? 'bg-green-500' : lead.score >= 60 ? 'bg-yellow-500' : 'bg-slate-400'
                    }`}>
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.company || 'No company'} • {lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                      <p className="text-sm text-slate-500 mt-1">Score: {lead.score}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Outreach Sequences</h2>
          <div className="space-y-3">
            {sequences.map((seq) => (
              <div key={seq.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{seq.name}</p>
                    <p className="text-sm text-slate-500">{seq.steps.length} steps</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    seq.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {seq.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {seq.steps.map((step, i) => (
                    <div key={i} className={`h-1 flex-1 rounded ${step.status === 'sent' ? 'bg-green-500' : 'bg-slate-300'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}