'use client';

import { Menu, Bell, Search, Plus } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [showNewTask, setShowNewTask] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks, agents, memories..."
            className="pl-10 pr-4 py-2 w-80 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
      </div>
    </header>
  );
}