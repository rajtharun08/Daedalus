import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  FolderGit2,
  Columns,
  Layers,
  GitFork,
  CheckCircle2,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  Plus,
  GitBranch,
  Flame,
  Activity,
  X,
  Key,
  Users,
} from 'lucide-react';
import { Project, Task, User, ActiveSquad } from '../../types';
import { IdeaEditor } from '../decomposer/IdeaEditor';
import { NodeGraphView } from '../decomposer/NodeGraphView';
import { ZippingFolder3D } from '../scaffolding/ZippingFolder3D';
import { SprintGrid } from '../dashboard/SprintGrid';
import { SplitTaskModal } from './SplitTaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import { RepoConnectModal } from '../modals/RepoConnectModal';
import { listVaultKeys } from '../../services/cryptoVault';

interface Props {
  project: Project | null;
  onDecompose: (title: string, description: string) => void;
  isDecomposing: boolean;
  onSelectTask: (task: Task) => void;
  selectedTaskId?: string;
  onSplitTask?: (
    taskId: string,
    strategy: 'frontend_backend' | 'logic_testing' | 'parallel_micro' | 'custom',
    customSubtasks?: Array<{
      title: string;
      description: string;
      required_skills: string;
    }>
  ) => Promise<void>;
  onCreateTask?: (taskData: {
    epic_id: string;
    title: string;
    description: string;
    required_skills: string;
    depends_on?: string[];
  }) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onNewProject?: () => void;
  activeSquad?: ActiveSquad | null;
  onSelectActiveSquad?: (squad: ActiveSquad | null) => void;
}

export const WorkspaceView: React.FC<Props> = ({
  project,
  onDecompose,
  isDecomposing,
  onSelectTask,
  selectedTaskId,
  onSplitTask,
  onCreateTask,
  onDeleteTask,
  onNewProject,
  activeSquad,
  onSelectActiveSquad,
}) => {
  const [viewTab, setViewTab] = useState<'decomposer' | 'scaffold' | 'dashboard'>('decomposer');
  const [taskToSplit, setTaskToSplit] = useState<Task | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [linkedRepo, setLinkedRepo] = useState<string | undefined>(project?.github_repo);

  React.useEffect(() => {
    setLinkedRepo(project?.github_repo);
  }, [project?.github_repo]);

  const displayedRepo = linkedRepo ?? project?.github_repo;

  // New task dialog state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const tabs = [
    { id: 'decomposer', label: '1. AI Decomposer & DAG', icon: Cpu },
    { id: 'scaffold', label: '2. Scaffolding Engine', icon: FolderGit2 },
    { id: 'dashboard', label: '3. SprintGrid Tracking', icon: Columns },
  ];

  const handleOpenSplit = (task: Task) => {
    setTaskToSplit(task);
    setIsSplitModalOpen(true);
  };

  const handleExecuteSplit = async (
    taskId: string,
    strategy: 'frontend_backend' | 'logic_testing' | 'parallel_micro' | 'custom',
    customSubtasks?: Array<{
      title: string;
      description: string;
      required_skills: string;
    }>
  ) => {
    if (onSplitTask) {
      await onSplitTask(taskId, strategy, customSubtasks);
    }
  };

  const domainArchetype = project?.domain || 'GENERAL SPRINT';
  const metrics = project?.metrics || {
    critical_path_depth: project?.tasks ? Math.min(project.tasks.length, 4) : 0,
    max_parallel_tracks: project?.tasks ? Math.min(Math.ceil(project.tasks.length / 2), 4) : 0,
    estimated_sprint_hours: (project?.tasks?.length || 0) * 4.5,
    total_task_count: project?.tasks?.length || 0,
  };

  const activeBYOK = listVaultKeys().find((k) => k.verified) || listVaultKeys()[0];

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Workspace Sub-Header Controls */}
      <div className="glass-panel p-2.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 px-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white tracking-wider truncate max-w-[240px]">
            {project ? `Project: ${project.title}` : 'Hackathon Workspace'}
          </span>
          {project && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              {domainArchetype.toUpperCase()}
            </span>
          )}
          {activeBYOK ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              BYOK: {activeBYOK.provider.toUpperCase()} ({activeBYOK.model})
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5 font-semibold flex items-center gap-1">
              <Key className="w-2.5 h-2.5 text-zinc-500" />
              STANDARD ENGINE
            </span>
          )}

          {/* Active Hackathon Squad Indicator */}
          {(activeSquad || project?.squad_name) && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs shadow-sm">
              <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-white truncate max-w-[180px]">
                Squad: {activeSquad?.name || project?.squad_name}
              </span>
              {activeSquad?.members && activeSquad.members.length > 0 && (
                <div className="flex items-center -space-x-1.5 ml-0.5">
                  {activeSquad.members.slice(0, 4).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.github_username}`}
                      alt={m.full_name}
                      title={`${m.full_name} (@${m.github_username})`}
                      className="w-5 h-5 rounded-full border border-zinc-950 object-cover"
                    />
                  ))}
                </div>
              )}
              <NavLink
                to="/team"
                className="text-[10px] text-purple-400 hover:text-white underline ml-1 cursor-pointer whitespace-nowrap"
                title="View & manage squad members in Team Roster"
              >
                Squad /team ↗
              </NavLink>
            </div>
          )}

          {/* GitHub Repository Link / Auto-Tracking Action Button */}
          {project && (
            <button
              type="button"
              onClick={() => setIsRepoModalOpen(true)}
              className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                displayedRepo
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-100 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-gradient-to-r from-cyan-500/25 to-blue-500/20 hover:from-cyan-500/35 hover:to-blue-500/30 text-cyan-300 hover:text-white border border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/40'
              }`}
              title="Configure GitHub Repository & Automated Tracking"
            >
              <FolderGit2 className={`w-3.5 h-3.5 ${displayedRepo ? 'text-emerald-400' : 'text-cyan-400'}`} />
              <span>{displayedRepo ? `github.com/${displayedRepo}` : 'Connect Repo'}</span>
              {displayedRepo ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold uppercase tracking-wide">
                  Linked
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/30 text-cyan-200 border border-cyan-400/50 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Link
                </span>
              )}
            </button>
          )}

          {/* New Project Button */}
          {project && onNewProject && (
            <button
              type="button"
              onClick={onNewProject}
              className="text-xs font-mono font-medium px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Start a new hackathon project with a fresh prompt"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Project</span>
            </button>
          )}
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/80 border border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = viewTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold border border-white/15 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Sprint Telemetry Bar */}
      {project && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          <div className="glass-panel p-3 rounded-xl border border-white/10 bg-zinc-950/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-cyan-400" />
              Critical Path Depth
            </div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {metrics.critical_path_depth} Milestones
            </div>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-white/10 bg-zinc-950/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
              <GitFork className="w-3 h-3 text-purple-400" />
              Max Concurrency
            </div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {metrics.max_parallel_tracks} Parallel Tracks
            </div>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-white/10 bg-zinc-950/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              Sprint Workload
            </div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {metrics.estimated_sprint_hours}h Total Effort
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-1 glass-panel p-2.5 rounded-xl border border-white/10 bg-zinc-950/60 flex items-center justify-center">
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="w-full h-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/25 text-xs font-mono text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Custom Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Viewport Tabs */}
      <AnimatePresence mode="wait">
        {viewTab === 'decomposer' && (
          <motion.div
            key="decomposer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Idea Prompt Editor */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-sans text-white">Idea Breakdown Engine</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Submit project requirements to compile into a validated DAG.
                  </p>
                </div>
                <IdeaEditor onSubmit={onDecompose} isLoading={isDecomposing} activeSquad={activeSquad} />
              </div>

              {/* Right: Interactive Node Graph */}
              <div className="lg:col-span-7">
                {project ? (
                  <NodeGraphView
                    project={project}
                    onSelectTask={onSelectTask}
                    selectedTaskId={selectedTaskId}
                    onSplitTask={handleOpenSplit}
                  />
                ) : (
                  <div className="glass-panel p-8 rounded-2xl text-center space-y-5 border border-white/10 h-[520px] flex flex-col items-center justify-center bg-zinc-950/40">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-base font-bold text-white font-sans">
                        Roadmap Graph Preview
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                        Describe your project on the left or choose a blueprint below to generate your dependency roadmap:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-lg pt-2">
                      {[
                        {
                          title: 'CRDT Whiteboard',
                          desc: 'Real-time collaborative canvas with WebSocket consensus and undo/redo stacks.',
                        },
                        {
                          title: 'DeFi Arbitrage Bot',
                          desc: 'Mempool listener and flash-loan execution smart contracts with slippage protection.',
                        },
                        {
                          title: 'Clinical Trials RAG',
                          desc: 'PubMed ingest pipeline with hybrid vector search and FDA regulatory check.',
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => onDecompose(preset.title, preset.desc)}
                          disabled={isDecomposing}
                          className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-white/25 hover:bg-zinc-800 text-left transition-all group cursor-pointer disabled:opacity-50"
                        >
                          <div className="text-xs font-bold text-white font-sans group-hover:text-cyan-300 transition-colors">
                            {preset.title}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 mt-1 line-clamp-2">
                            {preset.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {viewTab === 'scaffold' && (
          <motion.div
            key="scaffold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ZippingFolder3D project={project} />
          </motion.div>
        )}

        {viewTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SprintGrid
              project={project}
              onSelectTask={onSelectTask}
              onSplitTask={handleOpenSplit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Splitting Modal */}
      <SplitTaskModal
        task={taskToSplit}
        isOpen={isSplitModalOpen}
        onClose={() => {
          setIsSplitModalOpen(false);
          setTaskToSplit(null);
        }}
        onSplit={handleExecuteSplit}
      />

      {/* Custom Task Creation Modal */}
      {project && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          project={project}
          onCreateTask={async (data) => {
            if (onCreateTask) {
              await onCreateTask(data);
            }
          }}
        />
      )}

      {/* GitHub Repository Connection & Webhook Modal */}
      {project && (
        <RepoConnectModal
          isOpen={isRepoModalOpen}
          onClose={() => setIsRepoModalOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          currentRepo={displayedRepo}
          onRepoUpdated={(newRepo) => {
            project.github_repo = newRepo;
            setLinkedRepo(newRepo);
          }}
        />
      )}
    </div>
  );
};
