'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  DollarSign,
  PenTool,
  Megaphone,
} from 'lucide-react';

type View = 'overview' | 'monetization' | 'content' | 'outreach' | 'agents' | 'tasks' | 'memory' | 'settings';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', id: 'overview' as View },
  { icon: DollarSign, label: 'Monetization', id: 'monetization' as View },
  { icon: PenTool, label: 'Content Engine', id: 'content' as View },
  { icon: Megaphone, label: 'Outreach', id: 'outreach' as View },
  { icon: Users, label: 'Agents', id: 'agents' as View },
  { icon: ListTodo, label: 'Tasks', id: 'tasks' as View },
  { icon: Brain, label: 'Memory', id: 'memory' as View },
  { icon: BarChart3, label: 'Insights', id: 'insights' as View },
  { icon: Settings, label: 'Settings', id: 'settings' as View },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ isOpen, onToggle, currentView, onViewChange }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Atlas</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors ${
              currentView === item.id ? 'bg-slate-800 border-l-2 border-blue-500' : ''
            }`}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {isOpen && (
        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">System Status</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">All systems operational</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}