import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  GitBranch,
  Cpu,
  Code2,
  Save,
  UserCheck,
  ShieldCheck,
  GitFork,
  Trash2,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import { Task, User } from '../../types';
import { updateTask } from '../../services/api';

interface Props {
  task: Task | null;
  onClose: () => void;
  availableUsers: User[];
  onTaskUpdated?: (updatedTask: Task) => void;
  onSplitTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskSidePanel: React.FC<Props> = ({
  task,
  onClose,
  availableUsers,
  onTaskUpdated,
  onSplitTask,
  onDeleteTask,
}) => {
  if (!task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable Skills state
  const [skillsList, setSkillsList] = useState<string[]>(() =>
    task.required_skills ? task.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  // Editable API Contract state
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractMethod, setContractMethod] = useState(task.api_route_spec?.method || 'GET');
  const [contractPath, setContractPath] = useState(task.api_route_spec?.path || '/api/v1/resource');
  const [contractMockJson, setContractMockJson] = useState(
    task.api_route_spec?.response_mock ? JSON.stringify(task.api_route_spec.response_mock, null, 2) : ''
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setAssigneeId(task.assignee?.id || '');
    setSkillsList(
      task.required_skills ? task.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : []
    );
    setContractMethod(task.api_route_spec?.method || 'GET');
    setContractPath(task.api_route_spec?.path || '/api/v1/resource');
    setContractMockJson(
      task.api_route_spec?.response_mock ? JSON.stringify(task.api_route_spec.response_mock, null, 2) : ''
    );
    setIsEditingContract(false);
    setJsonError(null);
  }, [task]);

  // Check if form is dirty
  const isDirty =
    title !== task.title ||
    description !== task.description ||
    status !== task.status ||
    (assigneeId || '') !== (task.assignee?.id || '') ||
    skillsList.join(', ') !== (task.required_skills || '') ||
    (task.api_route_spec &&
      (contractMethod !== task.api_route_spec.method ||
        contractPath !== task.api_route_spec.path ||
        contractMockJson !== JSON.stringify(task.api_route_spec.response_mock, null, 2)));

  const handleSave = async () => {
    let parsedMock: any = undefined;
    if (contractMockJson.trim()) {
      try {
        parsedMock = JSON.parse(contractMockJson);
        setJsonError(null);
      } catch (err: any) {
        setJsonError('Invalid JSON format in Mock Response: ' + err.message);
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatedRouteSpec = task.api_route_spec
        ? {
            ...task.api_route_spec,
            method: contractMethod,
            path: contractPath,
            ...(parsedMock !== undefined ? { response_mock: parsedMock } : {}),
          }
        : undefined;

      const finalSkills = skillsList.join(', ');

      await updateTask(task.id, {
        title,
        description,
        status,
        assignee_id: assigneeId || null,
        required_skills: finalSkills,
        ...(updatedRouteSpec ? { api_route_spec: updatedRouteSpec } : {}),
      });

      setIsSaving(false);
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          title,
          description,
          status,
          required_skills: finalSkills,
          assignee: availableUsers.find((u) => u.id === assigneeId) || task.assignee,
          ...(updatedRouteSpec ? { api_route_spec: updatedRouteSpec } : {}),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteTask) return;
    if (!window.confirm(`Delete ${task.task_code} and bridge DAG dependencies?`)) return;
    setIsDeleting(true);
    try {
      await onDeleteTask(task.id);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  const addSkill = (val: string) => {
    const cleaned = val.trim().replace(',', '');
    if (cleaned && !skillsList.includes(cleaned)) {
      setSkillsList([...skillsList, cleaned]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (toRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== toRemove));
  };

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    TODO: { label: 'TODO', color: 'text-zinc-400', bg: 'bg-zinc-800/40', border: 'border-zinc-700' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    IN_REVIEW: { label: 'IN REVIEW', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    COMPLETED: { label: 'COMPLETED', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    BLOCKED: { label: 'BLOCKED', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 500 }}
          animate={{ x: 0 }}
          exit={{ x: 500 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="w-full max-w-xl h-full glass-panel bg-zinc-950 border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {task.task_code}
                </span>
                <span className="text-xs font-mono text-zinc-400">Task Details</span>
                {isDirty && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    • Unsaved Changes
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions: Split & Delete */}
            <div className="grid grid-cols-2 gap-2">
              {onSplitTask && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSplitTask(task);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Split into Subtasks</span>
                </button>
              )}
              {onDeleteTask && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Task'}</span>
                </button>
              )}
            </div>

            {/* Title & Description Fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-900/90 border border-white/10 text-sm font-semibold text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-sans transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none leading-relaxed font-sans transition-colors"
                />
              </div>
            </div>

            {/* Status & Assignee Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none cursor-pointer"
                  >
                    <option value="TODO">⚪ TODO</option>
                    <option value="IN_PROGRESS">🔵 IN PROGRESS</option>
                    <option value="IN_REVIEW">🟡 IN REVIEW</option>
                    <option value="COMPLETED">🟢 COMPLETED</option>
                    <option value="BLOCKED">🔴 BLOCKED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:border-cyan-500 outline-none cursor-pointer"
                >
                  <option value="">-- Unassigned --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} (@{u.github_username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Stack Requirements (Editable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-zinc-300">
                  Required Skills
                </label>
                <span className="text-[10px] font-mono text-zinc-500">{skillsList.length} skills</span>
              </div>

              {/* Active Skill Chips */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-900/60 border border-white/5 min-h-[38px]">
                {skillsList.length === 0 ? (
                  <span className="text-xs font-mono text-zinc-500 self-center pl-1">No skills required</span>
                ) : (
                  skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/25 text-xs font-mono"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Skill Input & Popular Suggestions */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Pytest, Docker)... Press Enter"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkill(newSkillInput);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => addSkill(newSkillInput)}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-mono border border-purple-500/30 transition-colors cursor-pointer"
                >
                  + Add
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-zinc-500 font-mono">Quick Add:</span>
                {['React', 'FastAPI', 'Docker', 'PostgreSQL', 'WebSockets', 'Pytest', 'Redis', 'Solidity'].map(
                  (sug) => {
                    const isAdded = skillsList.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          if (isAdded) removeSkill(sug);
                          else addSkill(sug);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                          isAdded
                            ? 'bg-purple-500/25 text-purple-200 border-purple-500/40'
                            : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                        }`}
                      >
                        {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Upstream Dependencies */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-zinc-300">Prerequisites</label>
              {task.depends_on && task.depends_on.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {task.depends_on.map((depId, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-white/10 flex items-center gap-1.5"
                    >
                      <GitBranch className="w-3 h-3 text-cyan-400" />
                      <span>{depId.startsWith('task_') ? `Task #${depId.slice(-4)}` : depId}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-zinc-500 p-2 rounded-lg bg-zinc-900/40 border border-white/5">
                  Root milestone (no upstream blockers)
                </div>
              )}
            </div>

            {/* Interactive Mock API Route Spec */}
            {task.api_route_spec && (
              <div className="space-y-2.5 p-4 rounded-xl bg-zinc-900/70 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    API Contract Spec
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingContract(!isEditingContract)}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    {isEditingContract ? 'Done Editing' : 'Edit Contract'}
                  </button>
                </div>

                {isEditingContract ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Method</label>
                        <select
                          value={contractMethod}
                          onChange={(e) => setContractMethod(e.target.value)}
                          className="w-full p-2 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-cyan-300 font-bold"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Endpoint Path</label>
                        <input
                          type="text"
                          value={contractPath}
                          onChange={(e) => setContractPath(e.target.value)}
                          placeholder="/api/v1/resource"
                          className="w-full p-2 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-zinc-400">Mock Response (JSON)</label>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(contractMockJson);
                              setContractMockJson(JSON.stringify(parsed, null, 2));
                              setJsonError(null);
                            } catch (e: any) {
                              setJsonError(e.message);
                            }
                          }}
                          className="text-[9px] font-mono text-zinc-400 hover:text-white"
                        >
                          Format JSON
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={contractMockJson}
                        onChange={(e) => {
                          setContractMockJson(e.target.value);
                          try {
                            JSON.parse(e.target.value);
                            setJsonError(null);
                          } catch (err: any) {
                            setJsonError(err.message);
                          }
                        }}
                        className={`w-full p-2.5 rounded-lg bg-zinc-950 border text-xs font-mono ${
                          jsonError ? 'border-rose-500/50 text-rose-300' : 'border-white/10 text-emerald-400'
                        } resize-none`}
                      />
                      {jsonError && (
                        <div className="text-[10px] font-mono text-rose-400">Syntax error: {jsonError}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {contractMethod}
                      </span>
                      <span className="font-mono text-xs text-zinc-200 bg-zinc-950 px-2.5 py-1 rounded-lg border border-white/5 flex-1 truncate">
                        {contractPath}
                      </span>
                    </div>

                    {contractMockJson && (
                      <pre className="text-[11px] font-mono text-emerald-400/90 bg-zinc-950 p-3 rounded-lg border border-white/5 overflow-x-auto max-h-32">
                        {contractMockJson}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button with Keyboard Hint */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                Ctrl+Enter
              </kbd>
              <span>to save</span>
            </span>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                isDirty
                  ? 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-md'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10'
              } disabled:opacity-50`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
