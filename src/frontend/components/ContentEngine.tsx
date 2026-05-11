'use client';

import { useEffect, useState } from 'react';
import { FileText, Pen, BarChart3, Send, Plus, Search, Sparkles } from 'lucide-react';
import { fetchContentPieces, generateContent, fetchSEOCampaigns } from '@/lib/api';
import type { ContentPiece, SEOCampaign } from '@/types';

export function ContentEngine() {
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [seoCampaigns, setSeoCampaigns] = useState<SEOCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [newContent, setNewContent] = useState({ type: 'blog', topic: '', keywords: '', platform: 'blog' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [piecesData, seoData] = await Promise.all([
        fetchContentPieces(),
        fetchSEOCampaigns(),
      ]);
      setPieces(piecesData);
      setSeoCampaigns(seoData);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!newContent.topic) return;
    setGenerating(true);
    try {
      const piece = await generateContent({
        type: newContent.type,
        topic: newContent.topic,
        keywords: newContent.keywords.split(',').map(k => k.trim()).filter(Boolean),
        platform: newContent.platform,
      });
      setPieces([piece, ...pieces]);
      setShowGenerator(false);
      setNewContent({ type: 'blog', topic: '', keywords: '', platform: 'blog' });
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const draftCount = pieces.filter(p => p.status === 'draft').length;
  const publishedCount = pieces.filter(p => p.status === 'published').length;
  const avgSeoScore = Math.round(
    pieces.reduce((sum, p) => sum + (p.metrics?.seoScore || 70), 0) / Math.max(1, pieces.length)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Engine</h1>
          <p className="text-slate-500">Autonomous content generation & distribution</p>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Sparkles size={18} />
          <span>Generate Content</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Pen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pieces.length}</p>
              <p className="text-sm text-slate-500">Total Pieces</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-sm text-slate-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-sm text-slate-500">Published</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgSeoScore}</p>
              <p className="text-sm text-slate-500">Avg SEO Score</p>
            </div>
          </div>
        </div>
      </div>

      {showGenerator && (
        <div className="glass rounded-xl p-5 border-2 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Generate New Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content Type</label>
              <select
                value={newContent.type}
                onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              >
                <option value="blog">Blog Post</option>
                <option value="social">Social Media</option>
                <option value="email">Email</option>
                <option value="landing">Landing Page</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
              <select
                value={newContent.platform}
                onChange={(e) => setNewContent({ ...newContent, platform: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              >
                <option value="blog">Blog</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                value={newContent.topic}
                onChange={(e) => setNewContent({ ...newContent, topic: e.target.value })}
                placeholder="Enter topic or subject..."
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={newContent.keywords}
                onChange={(e) => setNewContent({ ...newContent, keywords: e.target.value })}
                placeholder="ai, marketing, automation..."
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !newContent.topic}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span>{generating ? 'Generating...' : 'Generate'}</span>
            </button>
            <button
              onClick={() => setShowGenerator(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Content</h2>
          <div className="space-y-3">
            {pieces.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No content yet. Generate your first piece!</p>
            ) : (
              pieces.slice(0, 8).map((piece) => (
                <div key={piece.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{piece.title}</p>
                      <p className="text-sm text-slate-500 capitalize">{piece.type} • {piece.platform || 'general'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      piece.status === 'published' ? 'bg-green-100 text-green-700' :
                      piece.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {piece.status}
                    </span>
                  </div>
                  {piece.keywords.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {piece.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-200 rounded text-xs">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">SEO Campaigns</h2>
          <div className="space-y-3">
            {seoCampaigns.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No SEO campaigns running</p>
            ) : (
              seoCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{campaign.targetDomain}</p>
                      <p className="text-sm text-slate-500">{campaign.keywords.length} keywords</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      campaign.status === 'monitoring' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'creating' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <BarChart3 size={14} />
                    <span>{campaign.traffic} monthly visits</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}