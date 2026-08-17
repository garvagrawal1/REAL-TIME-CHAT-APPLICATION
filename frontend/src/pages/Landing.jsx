import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import {
  Sparkles,
  Zap,
  Bot,
  Shield,
  Languages,
  Search,
  MessageSquare,
  Users,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Database,
} from 'lucide-react';

export const Landing = () => {
  const features = [
    {
      icon: Zap,
      title: 'Real-Time WebSocket Engine',
      description:
        'Instant message delivery and bidirectional multi-tab presence using Socket.io with zero polling overhead.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Bot,
      title: 'Intelligent AI Assistant',
      description:
        'Dedicated assistant capable of explaining code, solving complex debugging issues, and drafting messages.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Sparkles,
      title: 'AI Room Summarization',
      description:
        'Generate structured executive summaries, discussion highlights, and follow-up action items in one click.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Languages,
      title: 'Multi-Language Translation',
      description:
        'Translate conversations instantly across English, Hindi, Hinglish, Spanish, French, and German.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Search,
      title: 'Semantic Chat Search',
      description:
        'Natural language search identifying relevant messages and discussions without needing exact keywords.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security & JWT',
      description:
        'Bcrypt salted hashing, JWT session protection, CORS boundaries, and secure backend-only AI credential proxying.',
      color: 'from-rose-500 to-red-500',
    },
  ];

  const techStack = [
    { name: 'React 18 + Vite', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Socket.io', category: 'WebSockets' },
    { name: 'Node.js & Express', category: 'Backend' },
    { name: 'MongoDB Atlas', category: 'Database' },
    { name: 'Google Gemini AI', category: 'AI Intelligence' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Navigation Bar */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent">
            ChatFlow AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
              Get Started Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 pt-16 pb-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Generation Real-Time AI Chat Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-[1.15]">
          Real-time messaging supercharged with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Intelligent AI
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Experience ultra-low latency WebSocket communication, multi-user presence, instant room summarization, smart replies, and context-aware AI assistants built for high-performing teams.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register">
            <Button variant="ai" size="lg" icon={ArrowRight} iconPosition="right" className="shadow-2xl shadow-indigo-500/30">
              Start Chatting Now
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Explore Live Demo
            </Button>
          </Link>
        </div>

        {/* Live Interface Preview Mockup */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl p-4 sm:p-6 backdrop-blur-xl relative overflow-hidden text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-2 text-xs font-mono text-slate-400">#technology • ChatFlow AI</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>12 Members Online</span>
            </div>
          </div>

          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                AK
              </div>
              <div className="bg-slate-800 p-3 rounded-2xl text-xs text-slate-200 max-w-md">
                <p className="font-semibold text-slate-300 mb-1">Alex Kumar</p>
                Anyone having trouble with WebSocket reconnects on Render deployment?
              </div>
            </div>

            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                GA
              </div>
              <div className="bg-indigo-600 p-3 rounded-2xl text-xs text-white max-w-md">
                <p className="font-semibold text-indigo-200 mb-1">Garv Agarwal (You)</p>
                Make sure you configure CORS with `origin: '*'` and enable both websocket and polling transports in your Socket.io client! 🚀
              </div>
            </div>

            {/* Smart Reply Pill Bar Mock */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Smart Replies:
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                "Thanks, that solved it!"
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                "Checking Render logs now."
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 lg:px-16 py-20 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Production Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Engineered for speed, reliability, and intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 space-y-3 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="px-6 lg:px-16 py-16 max-w-7xl mx-auto text-center w-full">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          Powered By Modern Full-Stack Technology
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {techStack.map((tech, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-100">{tech.name}</span>
              <span className="text-[10px] text-slate-500 uppercase font-mono">({tech.category})</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="px-6 lg:px-16 py-16 bg-gradient-to-b from-slate-950 to-indigo-950/40 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            Ready to experience next-generation real-time chat?
          </h2>
          <p className="text-sm text-slate-400">
            Create your account in seconds and start collaborating in real-time with instant AI superpowers.
          </p>
          <Link to="/register">
            <Button variant="ai" size="lg" icon={ArrowRight} iconPosition="right">
              Get Started Now — It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 ChatFlow AI. Built with React, Node.js, Express, Socket.io, and MongoDB Atlas.</p>
      </footer>
    </div>
  );
};
