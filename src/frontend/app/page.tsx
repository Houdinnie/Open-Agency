'use client';

import { useEffect, useState } from 'react';
import { 
  Zap, 
  Brain, 
  Target, 
  TrendingUp, 
  Shield, 
  Infinity,
  ChevronRight,
  Check,
  BarChart3,
  Users,
  Globe,
  Code,
  MessageSquare,
  ArrowRight,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'Autonomous Swarm',
      description: '9 specialized AI agents operate continuously. Each handles their domain - marketing, sales, operations, pricing.',
    },
    {
      icon: Zap,
      title: 'Self-Healing Loop',
      description: 'Detects issues → creates fixes → generates PRs → validates → deploys. Without human intervention.',
    },
    {
      icon: TrendingUp,
      title: 'Revenue Intelligence',
      description: 'Dynamic pricing, conversion optimization, and automated monetization. The system learns what works.',
    },
    {
      icon: Target,
      title: 'Growth Engine',
      description: 'Autonomous lead generation, outreach, and content creation. Runs 24/7 while you focus on strategy.',
    },
    {
      icon: Shield,
      title: 'Bounded Autonomy',
      description: 'Human-in-the-loop for high-impact decisions. Safety thresholds prevent runaway actions.',
    },
    {
      icon: Infinity,
      title: 'Continuous Learning',
      description: 'Every action improves the system. Reflection loops, pattern recognition, and evolutionary optimization.',
    },
  ];

  const agents = [
    { name: 'CEO Agent', role: 'Strategic planning & decision making' },
    { name: 'Growth Agent', role: 'Marketing, SEO & content generation' },
    { name: 'Sales Agent', role: 'Lead generation & outreach automation' },
    { name: 'Pricing Agent', role: 'Dynamic pricing & revenue optimization' },
    { name: 'Research Agent', role: 'Market intelligence & competitor analysis' },
    { name: 'Operations Agent', role: 'Task automation & workflow orchestration' },
    { name: 'Triage Agent', role: 'Issue classification & self-healing' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Open Agency</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</a>
            <a href="#agents" className="text-slate-400 hover:text-white transition-colors text-sm">Agents</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</a>
            <a href="/dashboard" className="px-5 py-2 bg-white text-slate-900 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors">
              Launch Console
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(2,6,28)_70%)]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-8">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Autonomous Operations System
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Autonomous
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Operational Intelligence
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Not a chatbot. Not an automation tool. A living digital organization that runs your business continuously—self-detecting, self-fixing, self-optimizing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/dashboard" className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
              <span>Enter Mission Control</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="flex items-center gap-3 px-8 py-4 border border-slate-700 rounded-xl font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-all">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 pt-10 border-t border-slate-800/50">
            <div>
              <p className="text-4xl font-bold text-white">99.9%</p>
              <p className="text-slate-500 text-sm mt-1">Uptime</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">12K+</p>
              <p className="text-slate-500 text-sm mt-1">Tasks Automated</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">85%</p>
              <p className="text-slate-500 text-sm mt-1">Self-Healing Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">The System</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A single continuous intelligence system with multiple limbs. Not tools connected together—operational infrastructure that runs itself.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section id="agents" className="py-32 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Agent Swarm</h2>
              <p className="text-xl text-slate-400 mb-8">
                A living team of AI agents that work continuously—each specializing in their domain. They coordinate, learn, and evolve.
              </p>
              
              <div className="space-y-4">
                {agents.slice(0, 4).map((agent, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-slate-500">{agent.role}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 blur-3xl rounded-full" />
              <div className="relative p-8 rounded-2xl bg-slate-900 border border-slate-800/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-500 text-sm ml-2">hermes-ops</span>
                </div>
                
                <div className="font-mono text-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-violet-400">hermes@main</span>
                    <span className="text-slate-500">$</span>
                    <span className="text-slate-300">./run growth-campaign --target=fintech</span>
                  </div>
                  <div className="text-slate-500">→ Initiating Growth Agent...</div>
                  <div className="text-slate-500">→ Found 87 leads in SaaS space</div>
                  <div className="text-slate-500">→ Enriching contact data...</div>
                  <div className="text-slate-500">→ Generating personalized outreach...</div>
                  <div className="text-green-400">→ Campaign deployed. 12% conversion projected.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Healing Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Self-Healing Loop</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              The system detects issues, creates fixes, validates, and deploys—continuously. Without waiting for humans.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { icon: Code, label: 'Sentry Detection', active: true },
              { icon: Brain, label: 'Triage Classification', active: true },
              { icon: Target, label: 'Fix Generation', active: true },
              { icon: Check, label: 'PR Creation', active: true },
              { icon: BarChart3, label: 'CI Validation', active: true },
              { icon: Zap, label: 'Auto Deploy', active: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  step.active 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30' 
                    : 'bg-slate-900 border border-slate-800'
                }`}>
                  <step.icon className={`w-7 h-7 ${step.active ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
                {i < 5 && (
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 max-w-2xl mx-auto">
            <p className="text-sm text-slate-500 mb-2">Latest self-healing event</p>
            <div className="flex items-center gap-3">
              <span className="text-red-400">●</span>
              <span className="font-mono text-sm text-slate-300">
                Error detected in API handler (line 42) → Auto-fix generated → PR #127 created → CI passing → Ready to merge
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Run Your Operations</h2>
            <p className="text-slate-400">Start with autonomous operations. Scale with the system.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-slate-500 text-sm mb-6">For solopreneurs</p>
              <p className="text-4xl font-bold mb-6">$49<span className="text-lg font-normal text-slate-500">/mo</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> 3 AI Agents
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Basic automation
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> 1,000 tasks/mo
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Email support
                </li>
              </ul>
              <a href="/dashboard" className="block text-center py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white transition-colors">
                Get Started
              </a>
            </div>

            {/* Professional - Featured */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-cyan-900/20 to-violet-900/20 border border-cyan-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full text-xs font-medium">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <p className="text-slate-500 text-sm mb-6">For growing businesses</p>
              <p className="text-4xl font-bold mb-6">$149<span className="text-lg font-normal text-slate-500">/mo</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> All 9 AI Agents
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Self-healing loop
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Unlimited tasks
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Linear & GitHub integration
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Priority support
                </li>
              </ul>
              <a href="/dashboard" className="block text-center py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Get Started
              </a>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <p className="text-slate-500 text-sm mb-6">For organizations</p>
              <p className="text-4xl font-bold mb-6">$499<span className="text-lg font-normal text-slate-500">/mo</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Custom agents
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Dedicated infrastructure
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> Custom integrations
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> SLA guarantee
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400" /> 24/7 support
                </li>
              </ul>
              <a href="/dashboard" className="block text-center py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white transition-colors">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Open Agency</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 Open Agency. Autonomous operational intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}