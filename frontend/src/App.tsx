import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Cpu,
  FolderGit2,
  Columns,
  Sparkles,
  Users,
  User as UserIcon,
  Layers,
  ChevronRight,
  LogIn,
  LogOut,
  Search,
  BookOpen,
  Key,
} from 'lucide-react';
import { User as UserType, Project, Task, ActiveSquad } from './types';
import { fetchUsers, decomposeProject, splitTask, createTask, deleteTask, fetchProject } from './services/api';
import { listVaultKeys, isVaultUnlocked, unlockVault, lockVault } from './services/cryptoVault';
import { LandingPage } from './components/landing/LandingPage';
import { DirectOnboarding } from './components/onboarding/DirectOnboarding';
import { TeamRoster } from './components/team/TeamRoster';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { SplitTaskModal } from './components/workspace/SplitTaskModal';
import { UserProfile } from './components/profile/UserProfile';
import { TaskSidePanel } from './components/decomposer/TaskSidePanel';
import { AuthModal } from './components/auth/AuthModal';
import { DocsModal } from './components/modals/DocsModal';
import { ChangelogModal } from './components/modals/ChangelogModal';
import { StatusModal } from './components/modals/StatusModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { KeyVaultModal } from './components/modals/KeyVaultModal';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [project, setProject] = useState<Project | null>(() => {
    const saved = localStorage.getItem('daedalus_active_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse active project:', e);
      }
    }
    return null;
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeyVaultOpen, setIsKeyVaultOpen] = useState(false);
  const [hasBYOKKey, setHasBYOKKey] = useState(() => listVaultKeys().length > 0);

  useEffect(() => {
    if (project) {
      localStorage.setItem('daedalus_active_project', JSON.stringify(project));
    }
  }, [project]);

  // Active Hackathon Squad (locked in-squad task matchmaking context)
  const [activeSquad, setActiveSquad] = useState<ActiveSquad | null>(() => {
    const saved = localStorage.getItem('daedalus_active_squad');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse active squad:', e);
      }
    }
    return null;
  });

  const handleSelectActiveSquad = (squad: ActiveSquad | null) => {
    setActiveSquad(squad);
    if (squad) {
      localStorage.setItem('daedalus_active_squad', JSON.stringify(squad));
    } else {
      localStorage.removeItem('daedalus_active_squad');
    }
  };

  // Global Ctrl+K / Cmd+K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load initial users & persistent session
  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data);
        const saved = localStorage.getItem('daedalus_user');
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
            return;
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        }
      })
      .catch((err) => console.error('Failed to load users:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('daedalus_user');
    setCurrentUser(null);
    lockVault();
  };

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Handle Idea Decomposition strictly within active squad
  const handleDecompose = async (title: string, description: string) => {
    setIsDecomposing(true);
    try {
      const squadContext = activeSquad ? {
        squadId: activeSquad.id,
        squadName: activeSquad.name,
        teamUserIds: activeSquad.memberIds,
      } : undefined;
      const res = await decomposeProject(title, description, squadContext);
      setProject(res);
      setIsDecomposing(false);
    } catch (err) {
      console.error('Decomposition error:', err);
      setIsDecomposing(false);
    }
  };

  // In-squad developers for task assignment (strictly restricted to squad)
  const squadUsers = React.useMemo(() => {
    if (activeSquad?.memberIds && activeSquad.memberIds.length > 0) {
      const idSet = new Set(activeSquad.memberIds);
      const filtered = users.filter((u) => idSet.has(u.id) || idSet.has(u.github_username));
      if (filtered.length > 0) return filtered;
    }
    if (project?.squad_member_ids && project.squad_member_ids.length > 0) {
      const idSet = new Set(project.squad_member_ids);
      const filtered = users.filter((u) => idSet.has(u.id) || idSet.has(u.github_username));
      if (filtered.length > 0) return filtered;
    }
    return users;
  }, [users, activeSquad, project]);

  const [taskToSplit, setTaskToSplit] = useState<Task | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // Handle Task Split
  const handleSplitTask = async (
    taskId: string,
    strategy: 'frontend_backend' | 'logic_testing' | 'parallel_micro' | 'custom',
    customSubtasks?: Array<{
      title: string;
      description: string;
      required_skills: string;
    }>
  ) => {
    try {
      const updatedProject = await splitTask(taskId, strategy, customSubtasks);
      setProject(updatedProject);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Task split error:', err);
      throw err;
    }
  };

  // Handle Dynamic Task Creation
  const handleCreateTask = async (taskData: {
    epic_id: string;
    title: string;
    description: string;
    required_skills: string;
    depends_on?: string[];
  }) => {
    if (!project) return;
    try {
      const updatedProject = await createTask(project.id, taskData);
      setProject(updatedProject);
    } catch (err) {
      console.error('Task creation error:', err);
      throw err;
    }
  };

  // Handle Task Deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    try {
      await deleteTask(taskId);
      const updated = await fetchProject(project.id);
      setProject(updated);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Task deletion error:', err);
      throw err;
    }
  };

  // Handle Reset / Start New Project
  const handleNewProject = () => {
    setProject(null);
    setSelectedTask(null);
  };

  // Handle Instant Template Launch directly into Workspace
  const handleLaunchTemplate = async (title: string, description: string) => {
    navigate('/workspace');
    await handleDecompose(title, description);
  };

  const navLinks = [
    { path: '/', label: 'Overview', icon: Sparkles },
    { path: '/team', label: 'Hackathon Squad', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-100 bg-space-900 selection:bg-neon-cyan/20 selection:text-neon-cyan overflow-x-hidden relative">
      {/* Top Glass Navigation Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-6 py-3.5 bg-space-950/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo: Isometric DAG Vertex */}
          <NavLink
            to="/"
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-space-900 border border-white/10 flex items-center justify-center p-1.5 transition-colors group-hover:border-white/20">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="rgba(11,15,25,0.9)" />
                <line x1="24" y1="4" x2="24" y2="24" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
                <line x1="42" y1="34" x2="24" y2="24" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="34" x2="24" y2="24" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="24" r="3.5" fill="#00F0FF" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white font-sans leading-none mb-1">
                DAEDALUS AI
              </h1>
              <p className="text-[11px] font-mono text-slate-400 leading-none">
                The Autonomous Hackathon Co-Pilot
              </p>
            </div>
          </NavLink>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-zinc-950/80 border border-white/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all duration-150 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 rounded-lg bg-zinc-800 border border-white/15"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span className="relative z-10">{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right: User Profile Widget or Sign In / Sign Up Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Quick Command Palette Search Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-all cursor-pointer"
              title="Quick Search & Actions (Ctrl+K / ⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-zinc-400">⌘K</kbd>
            </button>

            {/* Docs Quick Link */}
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </button>

            {/* Zero-Knowledge BYOK AI Keys Button */}
            <button
              onClick={() => setIsKeyVaultOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer relative"
              title="Manage BYOK AI Keys (Zero-Knowledge Vault)"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">AI Keys</span>
              {hasBYOKKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="BYOK Active" />
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/profile"
                  className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all ${
                    location.pathname === '/profile'
                      ? 'border-white/20 bg-zinc-800 text-white shadow-sm'
                      : 'border-white/10 bg-zinc-900/80 hover:border-white/20 hover:bg-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="relative w-7 h-7 rounded-lg border border-white/10 overflow-hidden bg-zinc-800 shrink-0">
                    <img
                      src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.github_username}`}
                      alt={currentUser.full_name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-zinc-950" />
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <div className="text-xs font-bold text-white font-sans truncate max-w-[100px]">
                      {currentUser.full_name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate max-w-[100px]">
                      @{currentUser.github_username}
                    </div>
                  </div>
                </NavLink>

                {/* Log Out Button */}
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-mono text-zinc-400 hover:text-rose-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('signin')}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 border border-white/20 text-xs font-mono font-bold text-zinc-950 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport with Route Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <Routes>
          {/* 1. Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                onStartOnboarding={() => {
                  navigate('/team');
                }}
                onLaunchTemplate={handleLaunchTemplate}
                onOpenDocs={() => setIsDocsOpen(true)}
                onOpenChangelog={() => setIsChangelogOpen(true)}
                onOpenStatus={() => setIsStatusOpen(true)}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />
            }
          />

          {/* 2. Direct Fallback Onboarding / Login Route */}
          <Route
            path="/onboarding"
            element={
              <DirectOnboarding
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  localStorage.setItem('daedalus_user', JSON.stringify(user));
                  setUsers((prev) => [user, ...prev.filter((u) => u.id !== user.id)]);
                  navigate('/team');
                }}
              />
            }
          />
          <Route
            path="/login"
            element={
              <DirectOnboarding
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  localStorage.setItem('daedalus_user', JSON.stringify(user));
                  setUsers((prev) => [user, ...prev.filter((u) => u.id !== user.id)]);
                  navigate('/team');
                }}
              />
            }
          />

          {/* 3. Hackathon Squad & Friends Teammate Matcher */}
          <Route
            path="/team"
            element={
              <TeamRoster
                currentUser={currentUser}
                onNavigateToWorkspace={() => navigate('/workspace')}
                activeSquad={activeSquad}
                onSelectActiveSquad={handleSelectActiveSquad}
                activeProject={project}
              />
            }
          />

          {/* 4. Active Project Workspace */}
          <Route
            path="/workspace"
            element={
              <WorkspaceView
                project={project}
                onDecompose={handleDecompose}
                isDecomposing={isDecomposing}
                onSelectTask={(task) => setSelectedTask(task)}
                selectedTaskId={selectedTask?.id}
                onSplitTask={handleSplitTask}
                onCreateTask={handleCreateTask}
                onDeleteTask={handleDeleteTask}
                onNewProject={handleNewProject}
                activeSquad={activeSquad}
                onSelectActiveSquad={handleSelectActiveSquad}
              />
            }
          />

          {/* 5. User Profile Page */}
          <Route
            path="/profile"
            element={
              <UserProfile
                user={currentUser || users[0]}
                onEditProfile={() => openAuth('signup')}
                onLogout={handleLogout}
                onUserUpdated={(updated) => {
                  setCurrentUser(updated);
                  setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
                  localStorage.setItem('daedalus_user', JSON.stringify(updated));
                }}
              />
            }
          />
        </Routes>
      </main>

      {/* Universal Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === user.id);
            return exists ? prev : [user, ...prev];
          });
        }}
        availableUsers={users}
        initialMode={authMode}
      />

      {/* Interactive Documentation Modal */}
      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        onNavigateToWorkspace={() => navigate('/workspace')}
      />

      {/* Changelog & Releases Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* System Telemetry Modal */}
      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
      />

      {/* Zero-Knowledge BYOK Key Vault Modal */}
      <KeyVaultModal
        isOpen={isKeyVaultOpen}
        onClose={() => setIsKeyVaultOpen(false)}
        onKeysChanged={() => setHasBYOKKey(listVaultKeys().length > 0)}
      />

      {/* Universal Command Palette (Ctrl+K / ⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onOpenStatus={() => setIsStatusOpen(true)}
        onLaunchTemplate={handleLaunchTemplate}
        onOpenKeyVault={() => setIsKeyVaultOpen(true)}
        onLogout={currentUser ? handleLogout : undefined}
      />

      {/* Task Detail Sliding Side-Panel */}
      <TaskSidePanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        availableUsers={squadUsers}
        onTaskUpdated={(updated) => {
          if (project) {
            setProject({
              ...project,
              tasks: project.tasks.map((t) => (t.id === updated.id ? updated : t)),
            });
          }
        }}
        onSplitTask={(task) => {
          setTaskToSplit(task);
          setIsSplitModalOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
      />

      {/* Root Split Task Modal */}
      <SplitTaskModal
        task={taskToSplit}
        isOpen={isSplitModalOpen}
        onClose={() => {
          setIsSplitModalOpen(false);
          setTaskToSplit(null);
        }}
        onSplit={handleSplitTask}
      />
    </div>
  );
}

export default App;
