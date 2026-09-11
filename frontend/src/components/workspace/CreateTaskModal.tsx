import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Search,
  Check,
  Sparkles,
  GitBranch,
  Terminal,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Project, Task } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onCreateTask: (taskData: {
    epic_id: string;
    title: string;
    description: string;
    required_skills: string;
    depends_on?: string[];
  }) => Promise<void>;
}

const POPULAR_SKILLS = [
  'React',
  'FastAPI',
  'Docker',
  'PostgreSQL',
  'WebSockets',
  'Pytest',
  'Redis',
  'Tailwind CSS',
  'TypeScript',
  'Solidity',
];

const TASK_TITLE_IDEAS = [
  'Implement Real-Time WebSocket Heartbeat Manager',
  'Construct PostgreSQL Database Migration Scripts',
  'Build Client-Side Reactive State Cache',
  'Configure Docker Multi-Stage Production Image',
  'Create End-to-End Pytest Smoke Test Suite',
  'Deploy Redis Pub/Sub Event Synchronization Bus',
];

export const CreateTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  onCreateTask,
}) => {
  const [selectedEpicId, setSelectedEpicId] = useState(project.epics[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>(['React', 'TypeScript']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);
  const [prereqSearch, setPrereqSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter project tasks for prerequisite picker
  const filteredTasks = useMemo(() => {
    if (!prereqSearch.trim()) return project.tasks;
    const q = prereqSearch.toLowerCase();
    return project.tasks.filter(
      (t) =>
        t.task_code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [project.tasks, prereqSearch]);

  if (!isOpen) return null;

  const handleAddSkill = (skill: string) => {
    const cleaned = skill.trim().replace(',', '');
    if (cleaned && !skillsList.includes(cleaned)) {
      setSkillsList([...skillsList, cleaned]);
      setCustomSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const togglePrereq = (taskId: string) => {
    if (selectedPrereqs.includes(taskId)) {
      setSelectedPrereqs(selectedPrereqs.filter((id) => id !== taskId));
    } else {
      setSelectedPrereqs([...selectedPrereqs, taskId]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateTask({
        epic_id: selectedEpicId || project.epics[0]?.id,
        title: title.trim(),
        description: description.trim() || `Execution milestone for ${title.trim()}`,
        required_skills: skillsList.join(', ') || 'General Engineering',
        depends_on: selectedPrereqs,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl flex flex-col overflow-hidden text-zinc-200"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  New Task
                </h3>
                <p className="text-[11px] font-mono text-zinc-400">
                  Create and schedule a milestone task in your sprint roadmap
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto font-mono text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                {error}
              </div>
            )}

            {/* Target Epic Selector */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-semibold block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Epic</span>
              </label>
              <select
                value={selectedEpicId || project.epics[0]?.id}
                onChange={(e) => setSelectedEpicId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:border-cyan-400 outline-none cursor-pointer"
              >
                {project.epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    Epic {epic.order_index}: {epic.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold block">Task Title</label>
                <button
                  type="button"
                  onClick={() => {
                    const random = TASK_TITLE_IDEAS[Math.floor(Math.random() * TASK_TITLE_IDEAS.length)];
                    setTitle(random);
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Random Idea</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Implement WebSocket Heartbeat Manager"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-sans text-white focus:border-cyan-400 outline-none transition-colors"
              />
            </div>

            {/* Task Description */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-semibold block">Description</label>
              <textarea
                rows={3}
                placeholder="Requirements, endpoint specs, or edge cases..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs font-sans text-zinc-200 focus:border-cyan-400 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            {/* Required Skills Tag System */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold block">Required Skills</label>
                <span className="text-[10px] text-zinc-500">
                  {skillsList.length === 1 ? '1 skill selected' : `${skillsList.length} skills selected`}
                </span>
              </div>

              {/* Active Skill Chips */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/25 text-xs font-mono"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Next.js, Redis)... Press Enter"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddSkill(customSkillInput);
                    }
                  }}
                  className="flex-1 p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(customSkillInput)}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-mono border border-purple-500/30 transition-colors cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-zinc-500">Quick Add:</span>
                {POPULAR_SKILLS.map((sug) => {
                  const isAdded = skillsList.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        if (isAdded) handleRemoveSkill(sug);
                        else handleAddSkill(sug);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                        isAdded
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                      }`}
                    >
                      {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Searchable Prerequisite Upstream Tasks Picker */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dependencies</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">
                    {selectedPrereqs.length === 1 ? '1 prerequisite' : `${selectedPrereqs.length} prerequisites`}
                  </span>
                  {selectedPrereqs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPrereqs([])}
                      className="text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Search filter input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={prereqSearch}
                  onChange={(e) => setPrereqSearch(e.target.value)}
                  placeholder="Filter upstream tasks by code or title..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Tasks List */}
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-zinc-900/60 border border-white/5">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-4 text-zinc-500 text-xs">No matching tasks found</div>
                ) : (
                  filteredTasks.map((t) => {
                    const isChecked = selectedPrereqs.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => togglePrereq(t.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                          isChecked
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                            : 'border-white/5 hover:bg-zinc-800/60 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by container
                            className="rounded border-white/20 text-cyan-400 focus:ring-0 bg-zinc-800 pointer-events-none"
                          />
                          <span className="font-bold text-cyan-400 shrink-0 font-mono text-[11px]">
                            {t.task_code}
                          </span>
                          <span className="truncate text-xs font-sans">{t.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-2">
                          {t.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10 mt-6">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                  Ctrl+Enter
                </kbd>
                <span>to add</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Adding Task...</span>
                    </>
                  ) : (
                    <>
                      <span>Add Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
