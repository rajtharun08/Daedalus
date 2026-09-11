import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Columns, CheckCircle2, Cpu, GitPullRequest, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { Project, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { WebhookSimulator } from './WebhookSimulator';
import { triggerConfettiBurst } from '../common/ConfettiBurst';
import { wsClient } from '../../services/websocket';

interface Props {
  project: Project | null;
  onSelectTask: (task: Task) => void;
  onRefreshProject?: () => void;
  onSplitTask?: (task: Task) => void;
}

export const SprintGrid: React.FC<Props> = ({ project, onSelectTask, onRefreshProject, onSplitTask }) => {
  const [tasks, setTasks] = useState<Task[]>(project?.tasks || []);
  const [pulsingTaskId, setPulsingTaskId] = useState<string | null>(null);
  const [selectedEpicId, setSelectedEpicId] = useState<string>('ALL');

  useEffect(() => {
    if (project?.tasks) {
      setTasks(project.tasks);
    }
  }, [project]);

  useEffect(() => {
    // Listen for WebSocket task updates
    const unsubUpdate = wsClient.subscribe('TASK_UPDATED', (data) => {
      if (data?.task_id) {
        setPulsingTaskId(data.task_id);
        setTimeout(() => setPulsingTaskId(null), 2500);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.task_id
              ? {
                  ...t,
                  status: data.status || t.status,
                  ci_status: data.ci_status || t.ci_status,
                  last_commit_hash: data.last_commit_hash || t.last_commit_hash,
                  last_commit_message: data.last_commit_message || t.last_commit_message,
                  pr_number: data.pr_number || t.pr_number,
                }
              : t
          )
        );
      }
    });

    // Listen for CI Passed events
    const unsubCIPassed = wsClient.subscribe('CI_PASSED', (data) => {
      if (data?.task_id) {
        setPulsingTaskId(data.task_id);
        triggerConfettiBurst();
        setTimeout(() => setPulsingTaskId(null), 3000);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.task_id
              ? { ...t, status: 'COMPLETED', ci_status: 'PASSED' }
              : t
          )
        );
      }
    });

    return () => {
      unsubUpdate();
      unsubCIPassed();
    };
  }, []);

  if (!project) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto border border-white/10">
        <Columns className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white font-sans">No Active Sprint</h3>
        <p className="text-xs text-slate-400 font-mono">
          Decompose a project idea first to generate your sprint tracking board.
        </p>
      </div>
    );
  }

  // Calculate sprint completion metrics
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
  const totalTasks = tasks.length || 1;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  const columns = [
    {
      id: 'TODO',
      title: 'Ready / Backlog',
      filter: (t: Task) => t.status === 'TODO' || t.status === 'BACKLOG' || t.status === 'BLOCKED',
      badgeColor: 'text-slate-400 border-white/10 bg-white/5',
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      filter: (t: Task) => t.status === 'IN_PROGRESS',
      badgeColor: 'text-neon-cyan border-cyan-500/30 bg-cyan-500/10',
    },
    {
      id: 'IN_REVIEW',
      title: 'In Review (PR Open)',
      filter: (t: Task) => t.status === 'IN_REVIEW',
      badgeColor: 'text-neon-violet border-purple-500/30 bg-purple-500/10',
    },
    {
      id: 'COMPLETED',
      title: 'Done / Merged',
      filter: (t: Task) => t.status === 'COMPLETED',
      badgeColor: 'text-neon-green border-neon-green/30 bg-neon-green/10',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header: Progress Metric Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-950/60">
        <div className="space-y-1 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
              SPRINT PROGRESS
            </span>
            <span className="text-xs font-mono text-zinc-400">
              ({completedCount} / {totalTasks} Tasks Completed)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-sans truncate">{project.title}</h2>
        </div>

        {/* Real-Time Progress Bar */}
        <div className="w-full md:w-72 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Velocity
            </span>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              className="h-full bg-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* GitHub Webhook Simulator Console */}
      <WebhookSimulator tasks={tasks} />

      {/* Epic Filter Tabs */}
      {project.epics && project.epics.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono text-zinc-400 shrink-0">Filter by Epic:</span>
          <button
            type="button"
            onClick={() => setSelectedEpicId('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer border ${
              selectedEpicId === 'ALL'
                ? 'bg-zinc-800 text-white border-white/20 font-semibold'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5'
            }`}
          >
            All Epics ({tasks.length})
          </button>
          {project.epics.map((epic) => (
            <button
              key={epic.id}
              type="button"
              onClick={() => setSelectedEpicId(epic.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer border ${
                selectedEpicId === epic.id
                  ? 'bg-zinc-800 text-white border-white/20 font-semibold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              Epic {epic.order_index}: {epic.title}
            </button>
          ))}
        </div>
      )}

      {/* Kanban Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const displayTasks = selectedEpicId === 'ALL' ? tasks : tasks.filter((t) => t.epic_id === selectedEpicId);
          const colTasks = displayTasks.filter(col.filter);
          return (
            <div
              key={col.id}
              className="rounded-2xl p-3.5 border border-white/10 bg-zinc-950/80 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                    {col.title}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onSelectTask(task)}
                    isPulsing={pulsingTaskId === task.id}
                    onSplitTask={onSplitTask}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="py-12 text-center text-xs font-mono text-zinc-600 border border-dashed border-white/10 rounded-xl">
                    Empty Column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
