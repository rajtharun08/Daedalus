import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GitFork,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Task } from '../../types';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSplit: (
    taskId: string,
    strategy: 'frontend_backend' | 'logic_testing' | 'parallel_micro' | 'custom',
    customSubtasks?: Array<{
      title: string;
      description: string;
      required_skills: string;
    }>
  ) => Promise<void>;
}

type SplitStrategy = 'frontend_backend' | 'logic_testing' | 'parallel_micro' | 'custom';

interface CustomSubtaskItem {
  id: string;
  title: string;
  skills: string;
}

export const SplitTaskModal: React.FC<Props> = ({ task, isOpen, onClose, onSplit }) => {
  const [strategy, setStrategy] = useState<SplitStrategy>('frontend_backend');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic custom strategy subtasks
  const [customSubtasks, setCustomSubtasks] = useState<CustomSubtaskItem[]>([
    { id: '1', title: '', skills: 'Frontend, React, TypeScript' },
    { id: '2', title: '', skills: 'Backend, Python, FastAPI' },
  ]);

  if (!isOpen || !task) return null;

  const strategies: Array<{
    id: SplitStrategy;
    title: string;
    badge: string;
    desc: string;
    previewA: { title: string; skills: string };
    previewB: { title: string; skills: string };
  }> = [
    {
      id: 'frontend_backend',
      title: 'Frontend / Backend Split',
      badge: 'Most Popular',
      desc: 'Decouple client UI & state from backend API endpoints and schema persistence.',
      previewA: {
        title: `${task.title} - Client UI & State Hooks`,
        skills: 'Frontend, React, TypeScript, Tailwind CSS',
      },
      previewB: {
        title: `${task.title} - API Endpoints & Business Logic`,
        skills: 'Backend, Python, FastAPI, PostgreSQL',
      },
    },
    {
      id: 'logic_testing',
      title: 'Core Engine / Testing & CI Split',
      badge: 'Zero Regressions',
      desc: 'Isolate algorithmic domain execution from end-to-end integration and mock tests.',
      previewA: {
        title: `${task.title} - Core Implementation`,
        skills: 'Algorithms, Architecture, Python, TypeScript',
      },
      previewB: {
        title: `${task.title} - Test Suite & Mock Fixtures`,
        skills: 'Pytest, Vitest, CI/CD, QA Automation',
      },
    },
    {
      id: 'parallel_micro',
      title: 'Dual Micro-Track Split',
      badge: 'Max Concurrency',
      desc: 'Split task horizontally into two concurrent parts with independent PR merges.',
      previewA: {
        title: `${task.title} (Part 1: Ingest & Processing)`,
        skills: task.required_skills || 'Fullstack, Logic',
      },
      previewB: {
        title: `${task.title} (Part 2: Delivery & UI)`,
        skills: task.required_skills || 'Fullstack, Delivery',
      },
    },
    {
      id: 'custom',
      title: 'Custom Task Decomposition',
      badge: 'Manual Control',
      desc: 'Explicitly specify dynamic subtrack titles, responsibilities, and skill requirements.',
      previewA: {
        title: customSubtasks[0]?.title || `${task.title} - Subtrack Alpha`,
        skills: customSubtasks[0]?.skills || 'Custom Skills',
      },
      previewB: {
        title: customSubtasks[1]?.title || `${task.title} - Subtrack Beta`,
        skills: customSubtasks[1]?.skills || 'Custom Skills',
      },
    },
  ];

  const selectedConfig = strategies.find((s) => s.id === strategy) || strategies[0];

  const addCustomSubtask = () => {
    if (customSubtasks.length >= 4) return;
    const nextIdx = customSubtasks.length;
    setCustomSubtasks([
      ...customSubtasks,
      {
        id: String(Date.now()),
        title: '',
        skills: nextIdx === 2 ? 'Database, PostgreSQL' : 'DevOps, Docker, CI',
      },
    ]);
  };

  const removeCustomSubtask = (id: string) => {
    if (customSubtasks.length <= 2) return;
    setCustomSubtasks(customSubtasks.filter((s) => s.id !== id));
  };

  const updateSubtask = (id: string, field: 'title' | 'skills', val: string) => {
    setCustomSubtasks(customSubtasks.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const handleExecute = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (strategy === 'custom') {
        for (let i = 0; i < customSubtasks.length; i++) {
          if (!customSubtasks[i].title.trim()) {
            throw new Error(`Please enter a title for Subtrack ${String.fromCharCode(65 + i)}`);
          }
        }
        await onSplit(
          task.id,
          'custom',
          customSubtasks.map((st, i) => ({
            title: st.title.trim(),
            description: `Custom decomposition part ${i + 1} for ${task.title}`,
            required_skills: st.skills.trim() || 'General Engineering',
          }))
        );
      } else {
        await onSplit(task.id, strategy);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to split task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <GitFork className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Decompose Task into Parallel Tracks
                </h3>
                <p className="text-[11px] font-mono text-zinc-400">
                  Splits {task.task_code} and rewires upstream / downstream dependencies automatically
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Target Task Summary Card */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {task.task_code}
                  </span>
                  <span className="text-xs font-semibold text-white">{task.title}</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans line-clamp-2">{task.description}</p>
              </div>
              {task.assignee && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] font-mono text-zinc-500">Current Assignee</div>
                  <div className="text-xs font-mono text-zinc-300">@{task.assignee.github_username}</div>
                </div>
              )}
            </div>

            {/* Strategy Picker */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Select Splitting Architecture
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {strategies.map((s) => {
                  const isSelected = strategy === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStrategy(s.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-zinc-900 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-sm'
                          : 'bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white font-sans">{s.title}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-white/5'
                          }`}
                        >
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Inputs if strategy === 'custom' */}
            {strategy === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    DYNAMIC_PARALLEL_SUBTRACKS ({customSubtasks.length})
                  </span>
                  {customSubtasks.length < 4 && (
                    <button
                      type="button"
                      onClick={addCustomSubtask}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Subtrack</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {customSubtasks.map((st, idx) => {
                    const suffix = String.fromCharCode(97 + idx);
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold border border-cyan-500/20">
                              {suffix}
                            </span>
                            <span className="text-xs font-mono font-semibold text-zinc-200">
                              Subtrack {letter} ({task.task_code}{suffix})
                            </span>
                          </div>
                          {customSubtasks.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeCustomSubtask(st.id)}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          placeholder={`Subtrack ${letter} Title (e.g. API Schema & Controller)...`}
                          value={st.title}
                          onChange={(e) => updateSubtask(st.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-sans text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="Required Skills (comma-separated)..."
                            value={st.skills}
                            onChange={(e) => updateSubtask(st.id, 'skills', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-500"
                          />

                          {/* Quick Chips for this subtrack */}
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-zinc-500 font-mono">Inject:</span>
                            {['React', 'FastAPI', 'PostgreSQL', 'Docker', 'Pytest', 'WebSockets'].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  const current = st.skills ? st.skills.split(',').map((s) => s.trim()) : [];
                                  if (!current.includes(chip)) {
                                    updateSubtask(st.id, 'skills', [...current, chip].join(', '));
                                  }
                                }}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 cursor-pointer transition-colors"
                              >
                                +{chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Generated Subtasks Preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  DAG Transformation Preview
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Topological Ordering Preserved
                </span>
              </div>

              <div className="space-y-2">
                {strategy === 'custom' ? (
                  customSubtasks.map((st, idx) => {
                    const suffix = String.fromCharCode(97 + idx);
                    const colors = [
                      { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                      { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                      { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 flex items-start gap-3"
                      >
                        <div
                          className={`w-6 h-6 rounded-md ${color.bg} ${color.border} ${color.text} font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5 border`}
                        >
                          {suffix}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white truncate font-sans">
                              {st.title || `Subtrack ${String.fromCharCode(65 + idx)}`}
                            </span>
                            <span className={`text-[10px] font-mono ${color.text} shrink-0 font-bold`}>
                              {task.task_code}{suffix}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                            Skills: {st.skills || 'General Engineering'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        a
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate font-sans">
                            {selectedConfig.previewA.title}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 shrink-0 font-bold">
                            {task.task_code}a
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          Skills: {selectedConfig.previewA.skills}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        b
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate font-sans">
                            {selectedConfig.previewB.title}
                          </span>
                          <span className="text-[10px] font-mono text-purple-400 shrink-0 font-bold">
                            {task.task_code}b
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          Skills: {selectedConfig.previewB.skills}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Footer Actions with Keyboard Hint */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-zinc-900/50">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                Ctrl+Enter
              </kbd>
              <span>to execute</span>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-mono font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Splitting Task...</span>
                  </>
                ) : (
                  <>
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Split Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
