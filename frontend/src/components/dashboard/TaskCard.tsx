import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, GitPullRequest, CheckCircle, Clock, ShieldAlert, Cpu, ChevronRight, GitFork } from 'lucide-react';
import { Task } from '../../types';
import { TeammateAvatar } from './TeammateAvatar';

interface Props {
  task: Task;
  onClick: () => void;
  isPulsing?: boolean;
  onSplitTask?: (task: Task) => void;
}

export const TaskCard: React.FC<Props> = ({ task, onClick, isPulsing = false, onSplitTask }) => {
  const getCIBadge = () => {
    switch (task.ci_status) {
      case 'PASSED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> CI PASSED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            <Cpu className="w-3 h-3 animate-spin" /> RUNNING
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" /> FAILED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            <Clock className="w-3 h-3" /> QUEUED
          </span>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor: isPulsing ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
      }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`rounded-xl p-3.5 cursor-pointer border transition-all duration-150 select-none ${
        isPulsing
          ? 'bg-emerald-950/30 border-emerald-500/50'
          : 'bg-zinc-900/80 hover:bg-zinc-800/80 hover:border-white/20'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            {task.task_code}
          </span>
          {onSplitTask && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSplitTask(task);
              }}
              title="Split this task into parallel subtracks"
              className="p-1 rounded bg-zinc-800/80 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-300 transition-all cursor-pointer"
            >
              <GitFork className="w-3 h-3" />
            </button>
          )}
        </div>
        {getCIBadge()}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug font-sans mb-2">
        {task.title}
      </h4>

      {/* Stack Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.required_skills
          .split(',')
          .slice(0, 3)
          .map((skill, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5"
            >
              {skill.trim()}
            </span>
          ))}
      </div>

      {/* Git Activity & Assignee Footer */}
      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.last_commit_hash ? (
            <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              <GitCommit className="w-3 h-3" />
              <span>{task.last_commit_hash}</span>
            </div>
          ) : task.pr_number ? (
            <div className="flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
              <GitPullRequest className="w-3 h-3" />
              <span>#{task.pr_number}</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-slate-500">No commits yet</span>
          )}
        </div>

        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <TeammateAvatar user={task.assignee} size="sm" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
