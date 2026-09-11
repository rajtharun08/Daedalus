import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Terminal,
  Layers,
  Users,
  BookOpen,
  Tag,
  Activity,
  Github,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onOpenDocs: () => void;
  onOpenChangelog: () => void;
  onOpenStatus: () => void;
}

export const MasterpieceFooter: React.FC<Props> = ({
  onOpenDocs,
  onOpenChangelog,
  onOpenStatus,
}) => {
  const navigate = useNavigate();

  return (
    <footer className="w-full max-w-6xl mx-auto pt-16 pb-12 border-t border-white/10 font-sans space-y-12">
      {/* Top 3-Column Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-xs font-mono">
        
        {/* Col 1: Platform & Squads */}
        <div className="space-y-3">
          <div className="text-white font-bold tracking-wider uppercase text-[11px] text-cyan-400">
            Platform
          </div>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={() => navigate('/team')}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Hackathon Squad Deck
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/profile')}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Developer Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/team')}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Squad Skill Radar
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/team')}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                In-Squad Workspaces
              </button>
            </li>
          </ul>
        </div>

        {/* Col 2: Documentation & Specs */}
        <div className="space-y-3">
          <div className="text-white font-bold tracking-wider uppercase text-[11px] text-purple-300">
            Architecture & Docs
          </div>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={onOpenDocs}
                className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1"
              >
                <span>60-Second Quickstart</span>
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDocs}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Topological DAG Specification
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDocs}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Contract-First Mocks
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDocs}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                GitHub Actions Webhooks
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDocs}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                CLI & Scaffolding Reference
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Sprint Resources & Releases */}
        <div className="space-y-3">
          <div className="text-white font-bold tracking-wider uppercase text-[11px] text-emerald-400">
            Releases & Community
          </div>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={onOpenChangelog}
                className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
              >
                <span>Changelog & Releases</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold">
                  v2.4.0
                </span>
              </button>
            </li>
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </li>
            <li>
              <a
                href="#reality-check"
                className="hover:text-white transition-colors cursor-pointer"
              >
                24-Hour Reality Check
              </a>
            </li>
            <li>
              <a
                href="#architecture-specs"
                className="hover:text-white transition-colors cursor-pointer"
              >
                Architecture Specifications
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className="hover:text-white transition-colors cursor-pointer"
              >
                Developer FAQ
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar: Brand & Copyright */}
      <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-space-900 border border-white/10 flex items-center justify-center p-1">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="rgba(11,15,25,0.9)" />
              <line x1="24" y1="4" x2="24" y2="24" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
              <line x1="42" y1="34" x2="24" y2="24" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="34" x2="24" y2="24" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="24" r="3.5" fill="#00F0FF" />
            </svg>
          </div>
          <span className="text-white font-bold font-sans tracking-tight">Daedalus</span>
          <span>•</span>
          <span className="text-cyan-400">Sprint Orchestration & Engineering Co-pilot</span>
        </div>

        <div className="flex items-center gap-6 text-[11px]">
          <span>© 2026 Daedalus AI</span>
          <span>•</span>
          <span>MIT License</span>
          <span>•</span>
          <button onClick={onOpenStatus} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Telemetry
          </button>
          <span>•</span>
          <button onClick={onOpenDocs} className="hover:text-cyan-300 transition-colors cursor-pointer">
            Docs
          </button>
        </div>
      </div>
    </footer>
  );
};
