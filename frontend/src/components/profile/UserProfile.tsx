import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Terminal, GitBranch, Clock, Cpu, CheckCircle2, Award, Zap, Code2, RefreshCw, Sparkles, Camera, X } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { MagneticButton } from '../common/MagneticButton';
import { AvatarPicker } from '../common/AvatarPicker';
import { updateUserAvatar } from '../../services/api';

interface Props {
  user: any;
  onEditProfile?: () => void;
  onUserUpdated?: (user: any) => void;
}

export const UserProfile: React.FC<Props> = ({ user, onEditProfile, onUserUpdated }) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'tasks' | 'vector'>('skills');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  if (!user) {
    return (
      <div className="glass-panel p-16 rounded-2xl text-center space-y-4 max-w-xl mx-auto border border-white/10">
        <User className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white font-sans">No Profile Selected</h3>
        <p className="text-xs text-slate-400 font-mono">
          Sign in or connect your GitHub profile to generate your developer competency profile.
        </p>
      </div>
    );
  }

  const skills = user.skills || [];

  const handleSelectAvatar = async (url: string) => {
    const updated = { ...user, avatar_url: url };
    localStorage.setItem('daedalus_user', JSON.stringify(updated));
    if (onUserUpdated) {
      onUserUpdated(updated);
    }
    setIsAvatarPickerOpen(false);
    try {
      if (user.id) {
        await updateUserAvatar(user.id, url);
      }
    } catch {
      // Offline fallback: already saved in localStorage and state
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Profile Hero Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden bg-zinc-950/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Container with Hover Quick Edit */}
            <div
              onClick={() => setIsAvatarPickerOpen(true)}
              className="relative w-18 h-18 rounded-2xl border border-white/15 p-1 bg-zinc-900 shrink-0 cursor-pointer group"
              title="Click to choose a new avatar / PFP"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.github_username}`}
                alt={user.full_name}
                className="w-full h-full object-cover rounded-xl transition-opacity group-hover:opacity-75"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-zinc-950" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-white font-sans">{user.full_name}</h2>
                <span className="text-xs font-mono text-zinc-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  @{user.github_username}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400">{user.email || `${user.github_username}@daedalus.hack`}</p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-zinc-300">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {user.timezone || 'UTC-04:00 (EDT)'}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                  {user.active_branch || 'main'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAvatarPickerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Change PFP</span>
            </button>
            <button
              onClick={onEditProfile}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-950" />
              <span>Re-Scan Skills</span>
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {isAvatarPickerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/10 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-sans">Choose Your Avatar / PFP</h3>
                </div>
                <button
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AvatarPicker
                selectedUrl={user.avatar_url || ''}
                onSelect={handleSelectAvatar}
                usernameSeed={user.github_username}
              />

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Developer Status Bar */}
      <div className="p-3.5 rounded-xl border border-white/10 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-zinc-400">DEVELOPER PROFILE:</span>
          <span className="text-zinc-200">GitHub Verified • {skills.length} Technical Competencies Extracted</span>
        </div>
        <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          SYNCED & ACTIVE
        </span>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/80 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
            activeTab === 'skills'
              ? 'bg-zinc-800 text-white font-bold border border-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Extracted Skills ({skills.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-zinc-800 text-white font-bold border border-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Assigned Tasks
        </button>
        <button
          onClick={() => setActiveTab('vector')}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
            activeTab === 'vector'
              ? 'bg-zinc-800 text-white font-bold border border-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Account & Environment
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((s: any, idx: number) => {
            const skillName = s.skill_name || s.raw_skill_text || s;
            const proficiency = s.proficiency || 0.9;
            const category = s.category || 'General';
            return (
              <div key={idx} className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-sm font-semibold text-white font-sans">{skillName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {category}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Proficiency Rating</span>
                    <span className="text-zinc-200 font-bold">{Math.round(proficiency * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${Math.round(proficiency * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="rounded-2xl p-6 border border-white/10 bg-zinc-950/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase">
              Assigned Sprints & Git Pulses
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              CI Webhooks Active
            </span>
          </div>

          {Array.isArray(user.tasks) && user.tasks.length > 0 ? (
            <div className="space-y-2.5 font-mono text-xs">
              {user.tasks.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-bold">{item.task_code || item.code}</span>
                    <span className="text-zinc-200">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <span className="text-cyan-400">{item.hash || '—'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                      {item.status}
                    </span>
                    {item.time && <span className="text-zinc-500 text-[11px] hidden sm:inline">{item.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-white/5 rounded-xl bg-zinc-900/40">
              No tasks assigned yet. Select tasks in your Project Roadmap or Squad Deck to link CI runs.
            </div>
          )}
        </div>
      )}

      {activeTab === 'vector' && (
        <div className="rounded-2xl p-6 border border-white/10 bg-zinc-950/80 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-zinc-200 font-bold">Developer Environment & Git Attributes</span>
            <span className="text-[10px] text-zinc-400">Authenticated Session</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Git Configuration</span>
              <div className="text-zinc-200 flex items-center justify-between">
                <span className="text-zinc-400">Active Branch:</span>
                <span className="text-cyan-400 font-semibold">{user.active_branch || 'main'}</span>
              </div>
              <div className="text-zinc-200 flex items-center justify-between">
                <span className="text-zinc-400">Default Remote:</span>
                <span className="text-zinc-300">origin/main</span>
              </div>
              <div className="text-zinc-200 flex items-center justify-between">
                <span className="text-zinc-400">Commit Signature:</span>
                <span className="text-emerald-400">GPG Verified</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Identity & Platform Sync</span>
              <div className="text-zinc-200 flex items-center justify-between">
                <span className="text-zinc-400">User ID:</span>
                <span className="text-zinc-300">{user.id}</span>
              </div>
              <div className="text-zinc-200 flex items-center justify-between">
                <span className="text-zinc-400">GitHub Provider:</span>
                <span className="text-zinc-300">@{user.github_username}</span>
              </div>
              <div className="text-zinc-200 flex items-center justify-between">
                <span className="text-zinc-400">Status:</span>
                <span className="text-emerald-400">Active Contributor</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
