import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Tag, GitCommit, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Release {
  version: string;
  date: string;
  tag: string;
  tagColor: string;
  summary: string;
  changes: {
    type: 'FEATURE' | 'PERF' | 'FIX' | 'SECURITY';
    text: string;
  }[];
}

const RELEASES: Release[] = [
  {
    version: 'v2.4.0',
    date: 'September 2026',
    tag: 'Latest Sprint Release',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    summary: 'Autonomous DAG cycle resolution, live telemetry stream, and sub-5s in-memory scaffolding engine.',
    changes: [
      { type: 'FEATURE', text: 'Interactive Hackathon Cockpit: Multi-engine live simulation directly in the landing experience.' },
      { type: 'FEATURE', text: 'DAG Cycle Elimination: Guaranteed linear topological ordering for complex epics.' },
      { type: 'PERF', text: 'Zero-Disk Zip Packaging: Scaffolding engine synthesizes 42 files in memory under 4.8 seconds.' },
      { type: 'SECURITY', text: 'HMAC-SHA256 GitHub Webhook Gatekeeper: Automated task transitions on CI check runs.' },
    ],
  },
  {
    version: 'v2.3.0',
    date: 'August 2026',
    tag: 'Sprint Core',
    tagColor: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
    summary: 'Commit AST analyzer and zero-survey squad competency mapping.',
    changes: [
      { type: 'FEATURE', text: 'GitHub Handle Ingestion: Parses commit languages and specializations in 380ms.' },
      { type: 'FEATURE', text: '5-Domain Competency Radar: Dynamic SVG pentagram with live stack simulation.' },
      { type: 'PERF', text: 'Preloader persistent cache: Zero-annoyance SVG micro-animation stored in localStorage.' },
    ],
  },
  {
    version: 'v2.0.0',
    date: 'July 2026',
    tag: 'Major Architecture',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    summary: 'Dual-Mode Database Architecture with resilient in-memory SQLite fallback for 8GB RAM machines.',
    changes: [
      { type: 'FEATURE', text: 'Resilient Offline Engine: Boots without prerequisite Docker or local PostgreSQL.' },
      { type: 'FEATURE', text: 'SprintGrid Kanban: Linear-inspired board with live WebSockets task progression.' },
      { type: 'FIX', text: 'Eliminated circular dependency race conditions during concurrent epic builds.' },
    ],
  },
];

export const ChangelogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-space-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-space-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-space-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-sans text-white">Changelog & Release Notes</h2>
                <p className="text-[11px] font-mono text-purple-300">Platform updates, optimizations and security fixes</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
            {RELEASES.map((rel) => (
              <div key={rel.version} className="space-y-3 relative pl-6 border-l border-white/10">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-space-950 border-2 border-cyan-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold font-mono text-white">{rel.version}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${rel.tagColor}`}>
                    {rel.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {rel.date}
                  </span>
                </div>

                <p className="text-xs font-sans text-slate-300">{rel.summary}</p>

                <div className="space-y-1.5 pt-1">
                  {rel.changes.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-sans text-slate-300">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold mt-0.5 shrink-0 ${
                          c.type === 'FEATURE'
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : c.type === 'PERF'
                            ? 'text-purple-300 bg-purple-500/10'
                            : c.type === 'SECURITY'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-300 bg-amber-500/10'
                        }`}
                      >
                        {c.type}
                      </span>
                      <span>{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
