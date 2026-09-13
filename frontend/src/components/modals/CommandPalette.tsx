import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Terminal,
  Layers,
  Users,
  User,
  BookOpen,
  Tag,
  Activity,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Command,
  X,
  Key,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenDocs: () => void;
  onOpenChangelog: () => void;
  onOpenStatus: () => void;
  onLaunchTemplate: (title: string, prompt: string) => void;
  onOpenKeyVault?: () => void;
  onLogout?: () => void;
}

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'DOCUMENTATION' | 'TEMPLATES' | 'ACTIONS';
  title: string;
  subtitle: string;
  icon: any;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenDocs,
  onOpenChangelog,
  onOpenStatus,
  onLaunchTemplate,
  onOpenKeyVault,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedAction, setCopiedAction] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'nav-workspace',
      category: 'NAVIGATION',
      title: 'Open Sprint Workspace',
      subtitle: 'DAG graph, live scaffolding & SprintGrid board',
      icon: Layers,
      action: () => {
        navigate('/workspace');
        onClose();
      },
      shortcut: 'G W',
    },
    {
      id: 'nav-team',
      category: 'NAVIGATION',
      title: 'Hackathon Squad & Radar',
      subtitle: 'View 5-domain radar, team slots & inbound requests',
      icon: Users,
      action: () => {
        navigate('/team');
        onClose();
      },
      shortcut: 'G S',
    },
    {
      id: 'nav-profile',
      category: 'NAVIGATION',
      title: 'Developer Profile',
      subtitle: 'Commit history, AST skills & credentials',
      icon: User,
      action: () => {
        navigate('/profile');
        onClose();
      },
      shortcut: 'G P',
    },
    {
      id: 'doc-quickstart',
      category: 'DOCUMENTATION',
      title: 'Documentation & Architecture',
      subtitle: 'Topological DAG engine, mock engine & CI webhook specs',
      icon: BookOpen,
      action: () => {
        onClose();
        onOpenDocs();
      },
      shortcut: 'D O',
    },
    {
      id: 'doc-changelog',
      category: 'DOCUMENTATION',
      title: 'View Release Notes & Changelog',
      subtitle: 'Latest updates in v2.4.0 and sprint optimizations',
      icon: Tag,
      action: () => {
        onClose();
        onOpenChangelog();
      },
      shortcut: 'C L',
    },
    {
      id: 'doc-status',
      category: 'DOCUMENTATION',
      title: 'Live System Telemetry',
      subtitle: 'Edge nodes, latency & zero-failure service status',
      icon: Activity,
      action: () => {
        onClose();
        onOpenStatus();
      },
      shortcut: 'S T',
    },
    {
      id: 'tpl-whiteboard',
      category: 'TEMPLATES',
      title: 'Template: Real-Time CRDT Whiteboard',
      subtitle: 'Sub-10ms canvas sync, WebSockets & Redis pub/sub',
      icon: Sparkles,
      action: () => {
        onClose();
        onLaunchTemplate(
          'Real-Time Multiplayer Whiteboard',
          'Autonomous whiteboard platform using CRDTs for sub-10ms conflict-free drawing, WebSockets sync, Redis pub/sub, and JWT auth.'
        );
      },
    },
    {
      id: 'tpl-arbitrage',
      category: 'TEMPLATES',
      title: 'Template: DeFi Flash-Loan Bot',
      subtitle: 'Uniswap/Sushiswap pool monitoring & RPC flash loans',
      icon: Sparkles,
      action: () => {
        onClose();
        onLaunchTemplate(
          'DeFi Flash-Loan Arbitrage Bot',
          'Flash-loan arbitrage engine monitoring Uniswap and Sushiswap liquidity pools, executing sub-second smart contract trades via RPC nodes.'
        );
      },
    },
    {
      id: 'act-copy-cli',
      category: 'ACTIONS',
      title: 'Copy Docker Quickstart',
      subtitle: 'docker compose up --build',
      icon: Terminal,
      action: () => {
        navigator.clipboard.writeText('docker compose up --build');
        setCopiedAction(true);
        setTimeout(() => {
          setCopiedAction(false);
          onClose();
        }, 800);
      },
      shortcut: '⌘ C',
    },
    {
      id: 'act-byok-vault',
      category: 'ACTIONS',
      title: 'Configure AI Keys (Zero-Knowledge Vault)',
      subtitle: 'Bring Your Own Key for Gemini 3.6, OpenAI GPT-4o, Claude 3.5 & GitHub PAT',
      icon: Key,
      action: () => {
        onClose();
        if (onOpenKeyVault) onOpenKeyVault();
      },
      shortcut: 'K V',
    },
    ...(onLogout ? [{
      id: 'act-logout',
      category: 'ACTIONS' as const,
      title: 'Log Out Session',
      subtitle: 'Clear session tokens & lock zero-knowledge key vault',
      icon: LogOut,
      action: () => {
        onClose();
        onLogout();
      },
      shortcut: '⇧ L',
    }] : []),
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-start justify-center pt-20 sm:pt-28 p-4 bg-space-950/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl bg-space-900 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-200"
        >
          {/* Top Search Input */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3 bg-space-950/80">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command, page name, doc or template..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full bg-transparent border-none text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            >
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">ESC</kbd>
            </button>
          </div>

          {/* Command List */}
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                No matching commands found for "{query}"
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border border-cyan-400/40 text-white shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                        : 'border border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold font-sans text-xs sm:text-sm truncate text-white">
                          {cmd.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {cmd.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {cmd.shortcut && (
                        <kbd className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-400">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {isSelected && <ArrowRight className="w-4 h-4 text-cyan-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-2.5 border-t border-white/10 bg-space-950/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-4">
              <span>Navigate: <kbd className="px-1 py-0.5 rounded bg-white/5">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white/5">↓</kbd></span>
              <span>Select: <kbd className="px-1 py-0.5 rounded bg-white/5">↵</kbd></span>
            </div>
            <span className="text-cyan-400">Daedalus Command Center</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
