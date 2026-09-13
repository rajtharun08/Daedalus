import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Github, ArrowRight, Terminal, Cpu, Monitor, Server, Brain, Layers, Zap } from 'lucide-react';
import { scanSkills } from '../../services/api';
import { triggerConfettiBurst } from '../common/ConfettiBurst';
import { AvatarPicker } from '../common/AvatarPicker';

interface Props {
  onLoginSuccess: (user: any) => void;
}

export const DirectOnboarding: React.FC<Props> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [role, setRole] = useState('Full-Stack');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('https://api.dicebear.com/7.x/bottts/svg?seed=Apollo');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'FastAPI']);

  const roles = [
    { id: 'Frontend', label: 'Frontend / UI', icon: Monitor, color: 'text-cyan-400' },
    { id: 'Backend', label: 'Backend / APIs', icon: Server, color: 'text-purple-400' },
    { id: 'AI', label: 'AI & Data / RAG', icon: Brain, color: 'text-emerald-400' },
    { id: 'DevOps', label: 'DevOps & Infra', icon: Layers, color: 'text-amber-400' },
  ];

  const handleStartOnboarding = async (nameToUse: string, githubToUse: string, roleToUse: string) => {
    if (!nameToUse.trim() || !githubToUse.trim()) {
      setError('Please provide your name and GitHub username.');
      return;
    }

    setError(null);
    setIsScanning(true);
    setLogs([
      `Connecting to GitHub profile: @${githubToUse}...`,
      'Scanning public repositories and competencies...',
      `Registering role: ${roleToUse}...`,
      `Syncing skill profile: ${selectedSkills.join(', ')}...`,
      'Profile setup complete. Joining workspace...'
    ]);

    try {
      const res = await scanSkills(githubToUse.trim(), nameToUse.trim(), selectedAvatarUrl);
      const finalizedUser = {
        ...res.user,
        avatar_url: selectedAvatarUrl || res.user.avatar_url,
      };
      setTimeout(() => {
        setIsScanning(false);
        onLoginSuccess(finalizedUser);
        navigate('/team');
      }, 1000);
    } catch (err: any) {
      setIsScanning(false);
      setError(err?.response?.data?.detail || err.message || 'Failed to scan skills and connect developer profile. Please verify your handle or backend connection.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Developer Onboarding</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Join Your <span className="text-zinc-200">Hackathon Workspace</span>
        </h1>
        <p className="text-xs text-zinc-400 font-mono">
          Enter your details once. We will auto-extract your tech stack and match you with teammates.
        </p>
      </div>

      {/* Main Glass Form Card */}
      <div className="rounded-2xl p-6 sm:p-8 border border-white/10 bg-zinc-950/80 shadow-2xl">
        <AnimatePresence mode="wait">
          {!isScanning ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleStartOnboarding(name, githubUsername, role);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleStartOnboarding(name, githubUsername, role);
                }
              }}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                  {error}
                </div>
              )}

              {/* Live Profile Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <img
                  src={selectedAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${githubUsername || 'builder'}`}
                  alt="Developer Avatar"
                  className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate font-sans">
                    {name || 'Anonymous Builder'}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 truncate">
                    @{githubUsername || 'github-username'}
                  </div>
                </div>
              </div>

              {/* 15 Avatar / PFP Picker */}
              <AvatarPicker
                selectedUrl={selectedAvatarUrl}
                onSelect={setSelectedAvatarUrl}
                usernameSeed={githubUsername}
              />

              {/* Full Name & GitHub username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ada Lovelace"
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-semibold text-white focus:border-cyan-400 focus:ring-0 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-zinc-400" /> GitHub Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500 font-mono text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value.replace('@', ''))}
                      placeholder="e.g. torvalds"
                      className="w-full pl-8 p-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-zinc-200 focus:border-cyan-400 focus:ring-0 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Role Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400">
                  Primary Competency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-800 text-white font-bold border-cyan-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : r.color}`} />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Skill Stack Injectors */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Specialized Tech Skills</span>
                  <span className="text-[10px] text-zinc-500">
                    {selectedSkills.length} {selectedSkills.length === 1 ? 'skill selected' : 'skills selected'}
                  </span>
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'FastAPI',
                    'React',
                    'Docker',
                    'PostgreSQL',
                    'PyTorch',
                    'WebSockets',
                    'Tailwind',
                    'Redis',
                    'TypeScript',
                    'Solidity',
                  ].map((s) => {
                    const isSelected = selectedSkills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSkills(selectedSkills.filter((sk) => sk !== s));
                          } else {
                            setSelectedSkills([...selectedSkills, s]);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                            : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                        }`}
                      >
                        {isSelected ? `✓ ${s}` : `+ ${s}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <span>CONNECT PROFILE & JOIN SQUAD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          ) : (
            /* Scanning Animation State */
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-6 space-y-4 text-center font-mono"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6 text-zinc-300 animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-sans">
                  Setting up Developer Profile
                </h3>
                <p className="text-xs text-zinc-400">@{githubUsername}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/5 text-left text-xs space-y-2 max-h-40 overflow-hidden font-mono">
                {logs.map((l, i) => (
                  <div key={i} className="text-zinc-300 leading-relaxed">
                    {l}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
