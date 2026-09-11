import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, GitCommit, GitPullRequest, CheckCircle2, ShieldAlert, Send } from 'lucide-react';
import { simulateWebhook } from '../../services/api';
import { Task } from '../../types';
import { MagneticButton } from '../common/MagneticButton';

interface Props {
  tasks: Task[];
}

export const WebhookSimulator: React.FC<Props> = ({ tasks }) => {
  const [eventType, setEventType] = useState<'push' | 'pull_request' | 'check_run'>('check_run');
  const [targetCode, setTargetCode] = useState(tasks[0]?.task_code || 'CORE-01');
  const [commitMsg, setCommitMsg] = useState('feat: closes #CORE-01 setup database and models');
  const [ciConclusion, setCiConclusion] = useState<'success' | 'failure'>('success');
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCode || isDispatching) return;

    setIsDispatching(true);
    try {
      await simulateWebhook({
        event_type: eventType,
        task_code: targetCode,
        commit_message: commitMsg,
        branch_name: `task/${targetCode}`,
        ci_conclusion: ciConclusion,
      });
      setLastDispatched(`Dispatched ${eventType.toUpperCase()} for ${targetCode}`);
      setTimeout(() => setLastDispatched(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 border border-white/10 bg-zinc-950/80 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
            GitHub Webhook Simulator & Testbench
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          HMAC-SHA256 • Event-Driven State Machine
        </span>
      </div>

      <form onSubmit={handleDispatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Event Type */}
        <div className="space-y-1">
          <label className="text-zinc-400 text-[11px]">EVENT_TYPE</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as any)}
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 outline-none focus:border-white/30"
          >
            <option value="check_run">check_run (GitHub Actions CI)</option>
            <option value="push">push (Commit to Branch)</option>
            <option value="pull_request">pull_request (PR Opened)</option>
          </select>
        </div>

        {/* Target Task */}
        <div className="space-y-1">
          <label className="text-zinc-400 text-[11px]">TARGET_TASK</label>
          <select
            value={targetCode}
            onChange={(e) => {
              setTargetCode(e.target.value);
              setCommitMsg(`feat: closes #${e.target.value} implement feature logic`);
            }}
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white outline-none focus:border-white/30"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.task_code}>
                {t.task_code} - {t.title.slice(0, 20)}...
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Detail (CI Conclusion or Commit Msg) */}
        {eventType === 'check_run' ? (
          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px]">CI_OUTCOME</label>
            <select
              value={ciConclusion}
              onChange={(e) => setCiConclusion(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-emerald-400 outline-none focus:border-white/30 font-bold"
            >
              <option value="success">Success (CI Gate Passed)</option>
              <option value="failure">Failure (Tests Failed)</option>
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-zinc-400 text-[11px]">COMMIT_MESSAGE</label>
            <input
              type="text"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 outline-none truncate focus:border-white/30"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isDispatching}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 fill-black" />
            <span>{isDispatching ? 'DISPATCHING...' : 'FIRE WEBHOOK'}</span>
          </button>
        </div>
      </form>

      {lastDispatched && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{lastDispatched}</span>
        </motion.div>
      )}
    </div>
  );
};
