import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed';
}

interface Props {
  steps: Step[];
}

export const BuildSequence: React.FC<Props> = ({ steps }) => {
  return (
    <div className="space-y-2.5 font-mono text-xs">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            step.status === 'completed'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
              : step.status === 'running'
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
              : 'bg-white/2 border-white/5 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {step.status === 'completed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : step.status === 'running' ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-700" />
            )}
            <span>{step.label}</span>
          </div>
          <span className="text-[10px] tracking-wider uppercase">
            {step.status === 'completed' ? 'READY' : step.status === 'running' ? 'COMPILING' : 'QUEUED'}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
