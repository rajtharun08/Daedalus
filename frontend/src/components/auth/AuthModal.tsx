import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Github,
  ArrowRight,
  Sparkles,
  Cpu,
  Zap,
  LogIn,
  UserPlus,
  CheckCircle2,
  Code2,
  FolderGit2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Mail,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { loginUser, signupUser } from '../../services/api';
import { triggerConfettiBurst } from '../common/ConfettiBurst';
import { AvatarPicker } from '../common/AvatarPicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  availableUsers: UserType[];
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  availableUsers,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign In state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [name, setName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [email, setEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [role, setRole] = useState('Full-Stack');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(
    'https://api.dicebear.com/7.x/bottts/svg?seed=Apollo'
  );

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const roles = [
    { id: 'Frontend', label: 'Frontend Engineer', icon: Code2 },
    { id: 'Backend', label: 'Backend Engineer', icon: Cpu },
    { id: 'AI', label: 'AI Engineer', icon: Sparkles },
    { id: 'DevOps', label: 'DevOps Engineer', icon: FolderGit2 },
  ];

  // Quick Switch Teammate
  const handleQuickSelect = (user: UserType) => {
    localStorage.setItem('daedalus_user', JSON.stringify(user));
    onLoginSuccess(user);
    onClose();
  };

  // Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const idClean = signInIdentifier.trim().replace(/^@/, '');
    if (!idClean) {
      setError('Please enter your GitHub handle or developer email.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setStatusMessage(`Verifying credentials for @${idClean}...`);

    try {
      const res = await loginUser(idClean, signInPassword.trim() || undefined);
      const authUser: UserType = res.user;

      localStorage.setItem('daedalus_user', JSON.stringify(authUser));
      if (rememberMe) {
        localStorage.setItem('daedalus_remember_me', 'true');
      }
      onLoginSuccess(authUser);
      onClose();
    } catch (err: any) {
      // Fallback: check in availableUsers list if offline
      const localMatch = availableUsers.find(
        (u) =>
          u.github_username.toLowerCase() === idClean.toLowerCase() ||
          u.email.toLowerCase() === idClean.toLowerCase()
      );
      if (localMatch) {
        localStorage.setItem('daedalus_user', JSON.stringify(localMatch));
        onLoginSuccess(localMatch);
        onClose();
        return;
      }
      setError(err.message || `No profile found for @${idClean}. Please create an account.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = githubUsername.trim().replace(/^@/, '');
    if (!name.trim() || !cleanUsername) {
      setError('Please provide your full name and GitHub username.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setStatusMessage(`Registering @${cleanUsername} & extracting competencies...`);

    try {
      const res = await signupUser({
        full_name: name.trim(),
        github_username: cleanUsername,
        email: email.trim() || undefined,
        password: signUpPassword.trim() || undefined,
        avatar_url: selectedAvatarUrl,
        role,
      });

      const newUser: UserType = res.user;
      localStorage.setItem('daedalus_user', JSON.stringify(newUser));
      triggerConfettiBurst();
      onLoginSuccess(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create developer profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // GitHub Direct Auth
  const handleGitHubAuth = () => {
    const defaultUser = availableUsers[0] || {
      id: 'usr_github_auth',
      full_name: 'Alex Chen',
      github_username: 'alexc-dev',
      email: 'alex@daedalus.hack',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apollo',
      timezone: 'UTC-04:00 (EDT)',
      active_branch: 'feat/CORE-01-db',
      skills: [
        { id: '1', skill_name: 'FastAPI Microservices', category: 'Backend', proficiency: 0.95 },
        { id: '2', skill_name: 'Vector Search Systems', category: 'AI', proficiency: 0.90 },
      ],
    };
    handleQuickSelect(defaultUser);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`w-full ${
          mode === 'signup' ? 'max-w-4xl' : 'max-w-2xl'
        } bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col my-auto transition-all duration-300`}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-zinc-900/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-sans">
                {mode === 'signin' ? 'Sign In' : 'Create Profile'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 sm:px-8 pt-5 pb-2 relative z-10">
          <div className="grid grid-cols-2 p-1.5 bg-zinc-900/90 rounded-xl border border-white/10 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2.5 text-xs sm:text-sm font-mono font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-zinc-800 text-cyan-300 font-bold border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2.5 text-xs sm:text-sm font-mono font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-zinc-800 text-purple-300 font-bold border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto relative z-10 flex-1 scrollbar-thin">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm font-mono">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {mode === 'signin' && error.includes('not found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="block mt-1.5 text-cyan-400 hover:underline font-semibold"
                  >
                    Click here to create a new profile →
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 animate-spin">
                <Cpu className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white font-sans">Connecting to Daedalus</h4>
                <p className="text-xs sm:text-sm text-cyan-300 font-mono">{statusMessage}</p>
              </div>
            </div>
          ) : mode === 'signin' ? (
            /* ==================== SIGN IN VIEW ==================== */
            <div className="space-y-6">
              {/* Quick Squad Member Switcher */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                  Quick Sign In
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableUsers.slice(0, 4).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickSelect(user)}
                      className="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/10 hover:border-cyan-500/50 flex items-center gap-3.5 transition-all text-left group cursor-pointer shadow-sm"
                    >
                      <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.github_username}`}
                        alt={user.full_name}
                        className="w-11 h-11 rounded-xl bg-zinc-950 border border-white/15 group-hover:border-cyan-400/60 object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white group-hover:text-cyan-300 truncate font-sans">
                          {user.full_name}
                        </div>
                        <div className="text-xs font-mono text-zinc-400 truncate">
                          @{user.github_username}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Or with email or handle</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Username or Email</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-zinc-500 font-mono text-sm">@</span>
                    <input
                      type="text"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="alexc-dev or alex@daedalus.hack"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-11 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-zinc-400 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-900 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-medium"
                  >
                    Need an account? Sign up →
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/25"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </form>

              {/* GitHub SSO */}
              <button
                type="button"
                onClick={handleGitHubAuth}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/25 text-sm font-mono text-zinc-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Github className="w-5 h-5 text-white" />
                <span>Continue with GitHub</span>
              </button>
            </div>
          ) : (
            /* ==================== SIGN UP VIEW (SPACIOUS 2-COLUMN) ==================== */
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column (Avatar & Live Preview Identity) */}
                <div className="md:col-span-5 space-y-5">
                  {/* Live Avatar Preview Card */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-lg relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                    <img
                      src={selectedAvatarUrl}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-2xl bg-zinc-950 border-2 border-cyan-400/50 shadow-xl object-cover shrink-0 mb-3"
                    />
                    <div className="min-w-0 w-full">
                      <div className="text-base font-bold text-white font-sans truncate">
                        {name || 'Developer Name'}
                      </div>
                      <div className="text-sm font-mono text-cyan-400 truncate mb-2">
                        @{githubUsername.replace(/^@/, '') || 'github_handle'}
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-medium">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <AvatarPicker
                    selectedUrl={selectedAvatarUrl}
                    onSelect={setSelectedAvatarUrl}
                    usernameSeed={githubUsername}
                  />
                </div>

                {/* Right Column (Form Inputs & Roles) */}
                <div className="md:col-span-7 space-y-5">
                  {/* Full Name & GitHub Handle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>Full Name *</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Chen"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-sans text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
                        <Github className="w-4 h-4 text-purple-400" />
                        <span>GitHub Handle *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-zinc-500 font-mono text-sm">@</span>
                        <input
                          type="text"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value.replace(/^@/, ''))}
                          placeholder="alexc-dev"
                          required
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span>Email (Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@daedalus.hack"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-400" />
                        <span>Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-4 pr-11 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-mono text-zinc-300 block font-medium">
                      Role
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {roles.map((r) => {
                        const RoleIcon = r.icon;
                        const isSelected = role === r.id;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => setRole(r.id)}
                            className={`py-3 px-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? 'bg-purple-500/15 border-purple-500/60 text-white ring-1 ring-purple-400/40 shadow-sm'
                                : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/25 hover:text-white'
                            }`}
                          >
                            <RoleIcon
                              className={`w-4 h-4 shrink-0 ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`}
                            />
                            <span className="text-xs sm:text-sm font-bold font-sans truncate">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-black font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-white/10 mt-2"
                  >
                    <span>Create Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center text-xs sm:text-sm font-mono text-zinc-400 pt-1">
                    <span>Already have a profile? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Sign in here →
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
