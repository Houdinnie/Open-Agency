'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, PieChart, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import {
  fetchMonetizationMetrics,
  fetchRevenueStreams,
  fetchClients,
} from '@/lib/api';
import type { FinancialMetrics, RevenueStream, Client } from '@/types';

export function MonetizationDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [streams, setStreams] = useState<RevenueStream[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, streamsData, clientsData] = await Promise.all([
          fetchMonetizationMetrics(),
          fetchRevenueStreams(),
          fetchClients(),
        ]);
        setMetrics(metricsData);
        setStreams(streamsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load monetization data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metricCards = [
    { label: 'Monthly Revenue', value: metrics?.mrr || 0, icon: DollarSign, color: 'green', format: 'currency' },
    { label: 'Annual Revenue', value: metrics?.arr || 0, icon: TrendingUp, color: 'blue', format: 'currency' },
    { label: 'Net Profit', value: metrics?.netProfit || 0, icon: Activity, color: 'emerald', format: 'currency' },
    { label: 'Profit Margin', value: metrics?.profitMargin || 0, icon: PieChart, color: 'purple', format: 'percent' },
    { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, icon: Users, color: 'orange', format: 'number' },
    { label: 'Churn Rate', value: metrics?.churnRate || 0, icon: Activity, color: 'red', format: 'percent' },
  ];

  const formatValue = (value: number, format?: string) => {
    if (format === 'currency') return `$${value.toLocaleString()}`;
    if (format === 'percent') return `${value.toFixed(1)}%`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monetization</h1>
          <p className="text-slate-500">Revenue streams & financial overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <TrendingUp size={16} />
          <span>+15% growth projected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{metric.label}</p>
                <p className="text-2xl font-bold mt-1">{formatValue(metric.value, metric.format)}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${metric.color}-50`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Revenue Streams</h2>
          <div className="space-y-4">
            {streams.map((stream) => (
              <div key={stream.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{stream.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{stream.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${stream.revenue.toLocaleString()}</p>
                  <p className={`text-sm ${stream.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stream.roi >= 0 ? <ArrowUp size={14} className="inline" /> : <ArrowDown size={14} className="inline" />}
                    {Math.abs(stream.roi).toFixed(0)}% ROI
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Active Clients</h2>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-500">{client.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    client.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                    client.plan === 'professional' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {client.plan}
                  </span>
                  <p className="text-sm font-semibold mt-1">${client.monthlyValue}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Financial Health</h2>
          <span className="text-sm text-slate-500">LTV:CAC Ratio</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {metrics?.ltv && metrics?.cac ? (metrics.ltv / metrics.cac).toFixed(1) : '0'}x
            </p>
            <p className="text-sm text-slate-500">LTV:CAC</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-lg font-semibold">${metrics?.ltv?.toLocaleString() || 0}</p>
            <p className="text-sm text-slate-500">Customer LTV</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">${metrics?.cac?.toLocaleString() || 0}</p>
            <p className="text-sm text-slate-500">Customer CAC</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{metrics?.churnRate?.toFixed(1) || 0}%</p>
            <p className="text-sm text-slate-500">Churn Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}