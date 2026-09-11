import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitMerge,
  Flame,
  Zap,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Award,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

export const HackathonComparison: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'with' | 'without'>('with');

  const withoutStages = [
    {
      time: '00:00 - 02:00',
      title: 'Debating Tech Stacks & Roles',
      desc: 'Bikeshedding state managers, arguing over databases, and asking who knows how to set up auth. Zero code written.',
      icon: Flame,
      status: '2 Hours Lost',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      time: '02:00 - 06:00',
      title: 'Frontend Blocked on Backend Specs',
      desc: 'Frontend developer sits idle waiting for backend API endpoints and schema models to be drafted. Complete blocker.',
      icon: Clock,
      status: '4 Hours Blocked',
      statusColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
    {
      time: '06:00 - 18:00',
      title: 'Divergent Repos & Type Mismatch',
      desc: 'Each teammate writes code in silos with mismatched endpoints, missing environment variables, and uncoordinated dependencies.',
      icon: AlertTriangle,
      status: 'Silent Drift',
      statusColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
    {
      time: '18:00 - 24:00',
      title: 'Late Merge Conflicts & Scramble',
      desc: 'Divergent branches collide on git push. Schema mismatches break integration, leaving developers scrambling to patch endpoints before submission.',
      icon: XCircle,
      status: 'Integration Bottleneck',
      statusColor: 'text-red-500 bg-red-500/20 border-red-500/30',
    },
  ];

  const withStages = [
    {
      time: '00:00 - 00:05',
      title: 'Instant Squad Drafting & DAG Compile',
      desc: 'Connect GitHub handles. Daedalus parses commit history, matches developers to epics, and compiles an acyclic task graph in 5 seconds.',
      icon: Zap,
      status: '5-Minute Setup',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      time: '00:05 - 00:06',
      title: 'Starter Repo with Live Mocks',
      desc: 'Download instant runnable starter repo with pre-configured mock endpoints. Frontend builds real views while backend builds DB in parallel.',
      icon: CheckCircle2,
      status: 'Zero Blockers',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      time: '00:06 - 20:00',
      title: 'Continuous Git-Driven Progress',
      desc: 'Code in isolated branches. GitHub Actions CI tests auto-mark tasks as Done on green checks. Zero manual board dragging.',
      icon: ShieldCheck,
      status: 'Automated CI Sync',
      statusColor: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    },
    {
      time: '20:00 - 24:00',
      title: 'Polished Demo & Submission',
      desc: 'Clean main branch with verified contracts. Finished early with dedicated time to record a crisp demo video and submit.',
      icon: Award,
      status: 'Sprint Complete',
      statusColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
    },
  ];

  const activeStages = activeMode === 'with' ? withStages : withoutStages;

  return (
    <section className="w-full max-w-6xl mx-auto space-y-8" id="reality-check">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-space-950 border border-white/10 text-slate-300 text-xs font-mono">
          <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
          <span>Workflow Comparison</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
          How Hackathons Are Won:{' '}
          <span className={activeMode === 'with' ? 'text-cyan-400' : 'text-red-400'}>
            {activeMode === 'with' ? 'Parallel Sprint Execution' : 'The Integration Bottleneck'}
          </span>
        </h2>
        <p className="text-xs sm:text-sm font-sans text-slate-400 max-w-xl mx-auto">
          Compare standard hackathon friction against a Daedalus-accelerated sprint to see how 16 hours of lost coordination time are reclaimed.
        </p>
      </div>

      {/* Interactive Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setActiveMode('with')}
          className={`px-6 py-3 rounded-xl font-sans text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
            activeMode === 'with'
              ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-sm'
              : 'bg-space-950 border border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Parallel Sprint (With Daedalus)</span>
        </button>

        <button
          onClick={() => setActiveMode('without')}
          className={`px-6 py-3 rounded-xl font-sans text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
            activeMode === 'without'
              ? 'bg-red-500/20 border border-red-500/60 text-red-300 shadow-sm'
              : 'bg-space-950 border border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Conventional Sprint (Without Daedalus)</span>
        </button>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeMode === 'with' ? (
          <>
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">0 Hours</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Blocked Waiting Time</div>
            </div>
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">Isolated</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Branch Workflows</div>
            </div>
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300">5 Seconds</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Full Repo Scaffolding</div>
            </div>
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">100%</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Demo Ready Confidence</div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-space-950 border border-red-500/20 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400">7.5 Hours</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Blocked Waiting Time</div>
            </div>
            <div className="p-4 rounded-xl bg-space-950 border border-red-500/20 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400">14+ Conflicts</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Git Merge Collisions</div>
            </div>
            <div className="p-4 rounded-xl bg-space-950 border border-red-500/20 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">2 Hours</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Boilerplate & Config Debates</div>
            </div>
            <div className="p-4 rounded-xl bg-space-950 border border-red-500/20 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400">Manual</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Unplanned Integration</div>
            </div>
          </>
        )}
      </div>

      {/* 4-Stage Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeStages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <GlassCard
              key={stage.title}
              className={`p-5 border flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
                activeMode === 'with'
                  ? 'border-white/10 hover:border-cyan-400/40 bg-space-900/60'
                  : 'border-red-500/20 hover:border-red-500/40 bg-red-950/10'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-slate-400">
                    {stage.time}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activeMode === 'with'
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stage.statusColor}`}>
                    {stage.status}
                  </span>
                  <h4 className="text-sm font-bold text-white font-sans pt-1">
                    {stage.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 font-mono text-[10px] text-slate-500 flex justify-between">
                <span>Phase 0{idx + 1}</span>
                <span>{activeMode === 'with' ? 'Optimized' : 'High Risk'}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};
