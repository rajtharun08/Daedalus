import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Users,
  ShieldCheck,
  Code2,
} from 'lucide-react';

interface Props {
  onStartOnboarding: () => void;
}

export const ClimaxCTA: React.FC<Props> = ({ onStartOnboarding }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl mx-auto my-14 relative">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="rounded-2xl p-8 sm:p-12 lg:p-16 border border-white/10 bg-space-950 text-center relative overflow-hidden space-y-8">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-space-900 border border-white/10 text-slate-300 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Built for Hackathons & Sprints</span>
        </div>

        {/* Headline */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-sans text-white leading-tight">
            Stop arguing about setup.{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-400 bg-clip-text text-transparent">
              Start building your demo.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed max-w-2xl mx-auto">
            Draft your squad, compile an acyclic task graph, and stream your runnable starter repository in under 60 seconds.
          </p>
        </div>

        {/* Action Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onStartOnboarding}
            className="px-8 sm:px-10 py-4 rounded-xl bg-white text-space-950 font-sans text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2.5 cursor-pointer hover:bg-slate-200 transition-all shadow-sm"
          >
            <Users className="w-4 h-4 text-space-950" />
            <span>Open Squad Deck</span>
            <ArrowRight className="w-4 h-4 text-space-950" />
          </button>
        </div>

        {/* Trust Badges Footer */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs font-mono text-slate-400 border-t border-white/5">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Isolated Branch Workflows
          </span>
          <span className="text-slate-600">/</span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Zap className="w-4 h-4" /> In-Memory Scaffolding
          </span>
          <span className="text-slate-600">/</span>
          <span className="flex items-center gap-1.5 text-purple-300">
            <Code2 className="w-4 h-4" /> Open Source & Local-First
          </span>
        </div>

      </div>
    </div>
  );
};
