'use client';

import { useState, useEffect } from 'react';
import { MissionControl } from '@/components/MissionControl';
import { Dashboard } from '@/components/Dashboard';
import { MonetizationDashboard } from '@/components/MonetizationDashboard';
import { ContentEngine } from '@/components/ContentEngine';
import { OutreachEngine } from '@/components/OutreachEngine';
import { 
  LayoutDashboard, 
  DollarSign, 
  PenTool, 
  Megaphone, 
  Users, 
  ListTodo, 
  Brain, 
  Settings,
  Menu,
  X
} from 'lucide-react';

type View = 'mission' | 'monetization' | 'content' | 'outreach' | 'agents' | 'tasks' | 'memory' | 'settings';

const navItems = [
  { icon: LayoutDashboard, label: 'Mission Control', id: 'mission' as View },
  { icon: DollarSign, label: 'Monetization', id: 'monetization' as View },
  { icon: PenTool, label: 'Content Engine', id: 'content' as View },
  { icon: Megaphone, label: 'Outreach', id: 'outreach' as View },
  { icon: Users, label: 'Agents', id: 'agents' as View },
  { icon: ListTodo, label: 'Tasks', id: 'tasks' as View },
  { icon: Brain, label: 'Memory', id: 'memory' as View },
  { icon: Settings, label: 'Settings', id: 'settings' as View },
];

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('mission');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'mission':
        return <MissionControl />;
      case 'monetization':
        return <MonetizationDashboard />;
      case 'content':
        return <ContentEngine />;
      case 'outreach':
        return <OutreachEngine />;
      case 'tasks':
      case 'agents':
      case 'memory':
      case 'settings':
      default:
        return <MissionControl />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <span className="text-lg font-bold">OA</span>
              </div>
              <div>
                <h1 className="font-bold text-white">Open Agency</h1>
                <p className="text-xs text-slate-500">Autonomous Ops</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentView === item.id 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Status */}
          <div className="p-4 border-t border-slate-800">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-400">Systems Operational</span>
              </div>
              <p className="text-xs text-slate-500">9 agents active • 99.9% uptime</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="text-white font-bold">Open Agency</span>
          <div className="w-8" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}