'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, ListTodo, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { fetchStats, fetchAgents, fetchTasks } from '@/lib/api';
import type { Stats, Agent, Task } from '@/types';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, agentsData, tasksData] = await Promise.all([
          fetchStats(),
          fetchAgents(),
          fetchTasks(),
        ]);
        setStats(statsData);
        setAgents(agentsData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: ListTodo, color: 'blue' },
    { label: 'Running', value: stats?.running || 0, icon: Activity, color: 'green' },
    { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle, color: 'emerald' },
    { label: 'Failed', value: stats?.failed || 0, icon: XCircle, color: 'red' },
  ];

  const agentCards = agents.map((agent) => ({
    ...agent,
    statusColor:
      agent.status === 'active'
        ? 'bg-green-500'
        : agent.status === 'busy'
        ? 'bg-yellow-500'
        : agent.status === 'error'
        ? 'bg-red-500'
        : 'bg-slate-400',
  }));

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of your AI workforce</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock size={16} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Agent Status</h2>
            <span className="text-sm text-slate-500">
              {stats?.agentStats.active || 0} active
            </span>
          </div>
          <div className="space-y-3">
            {agentCards.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${agent.statusColor}`} />
                  <div>
                    <p className="font-medium text-slate-900">{agent.name}</p>
                    <p className="text-sm text-slate-500 capitalize">{agent.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{agent.metrics.tasksCompleted} tasks</p>
                  <p className="text-xs text-slate-500">
                    {agent.metrics.successRate.toFixed(0)}% success
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Tasks</h2>
            <span className="text-sm text-slate-500">{tasks.length} total</span>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500 capitalize">{task.type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'running'
                        ? 'bg-blue-100 text-blue-700'
                        : task.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}