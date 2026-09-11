import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderGit2,
  Check,
  Copy,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Terminal,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { updateProjectRepo } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle?: string;
  currentRepo?: string;
  onRepoUpdated: (newRepo: string) => void;
}

export const RepoConnectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  currentRepo,
  onRepoUpdated,
}) => {
  const [repoInput, setRepoInput] = useState(currentRepo || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'webhook' | 'push_existing' | 'local_hook'>('webhook');

  // Quick repository suggestions based on active user and project
  const storedUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('daedalus_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const projectSlug = React.useMemo(() => {
    if (!projectTitle) return 'hackathon-sprint';
    return projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  }, [projectTitle]);

  const userHandle = storedUser?.github_username || 'dev-team';

  const suggestedRepos = React.useMemo(
    () => [
      `${userHandle}/${projectSlug}`,
      `${userHandle}/daedalus-workspace`,
      'rajtharun08/Daedalus',
    ],
    [userHandle, projectSlug]
  );

  if (!isOpen) return null;

  const webhookUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/webhooks/github`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setIsSaving(true);
    try {
      const res = await updateProjectRepo(projectId, repoInput.trim());
      onRepoUpdated(res.github_repo);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Failed to link repo:', err);
      setIsSaving(false);
    }
  };

  const localHookCode = `#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
MSG=$(git log -1 --pretty=%B)
HASH=$(git log -1 --pretty=%h)

curl -s -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-GitHub-Event: push" \\
  -d "{\\"ref\\":\\"refs/heads/$BRANCH\\",\\"commits\\":[{\\"id\\":\\"$HASH\\",\\"message\\":\\"$MSG\\"}]}" > /dev/null 2>&1 &`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-zinc-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-sans text-white">Repository & Auto-Tracking</h2>
                <p className="text-[11px] font-mono text-zinc-400">
                  Connect your GitHub repo or track local commits automatically
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Auto-Discovery Notice Banner */}
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs font-mono text-zinc-300 leading-relaxed">
                <strong className="text-cyan-300">Automatic Discovery:</strong> Even if you leave this empty, Daedalus{' '}
                <span className="text-white font-semibold">auto-binds your repo name</span> on the very first commit or push containing any task tag (e.g. <code className="text-cyan-300">task/CORE-01</code> or <code className="text-cyan-300">closes #CORE-01</code>).
              </div>
            </div>

            {/* Connected Repo Status if already bound */}
            {currentRepo && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      Currently Linked Repository
                    </div>
                    <a
                      href={`https://github.com/${currentRepo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono font-bold text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5 truncate"
                    >
                      <span>github.com/{currentRepo}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                    </a>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0 font-semibold">
                  Live Webhook Ready
                </span>
              </div>
            )}

            {/* Link / Change Repo Form */}
            <form onSubmit={handleSaveRepo} className="space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <span>SET_GITHUB_REPOSITORY</span>
                </label>
                <span className="text-[10px] text-zinc-500">format: owner/repo</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-zinc-500 select-none">
                    github.com/
                  </span>
                  <input
                    type="text"
                    value={repoInput.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')}
                    onChange={(e) => setRepoInput(e.target.value.trim())}
                    placeholder="your-org-or-username/your-repo-name"
                    className="w-full pl-[95px] pr-8 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  {repoInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setRepoInput('')}
                      className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setRepoInput(
                            text.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').trim()
                          );
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Paste from clipboard"
                  >
                    Paste
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving || !repoInput.trim()}
                    className="px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-mono font-bold rounded-xl cursor-pointer transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Repo</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Select Suggestions */}
              <div className="pt-1 space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Quick Select Suggestions:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestedRepos.map((sug) => {
                    const isSelected =
                      repoInput.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '') === sug;
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setRepoInput(sug)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold shadow-sm'
                            : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-white/10 hover:border-cyan-400/30'
                        }`}
                      >
                        <FolderGit2 className="w-3 h-3 text-cyan-400" />
                        <span>{sug}</span>
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Format Validation Cue */}
              {repoInput.trim() && (
                <div className="text-[11px] font-mono flex items-center gap-1.5 pt-0.5">
                  {/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/.test(
                    repoInput.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
                  ) ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Valid repository address: {repoInput.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')}</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <span>• Must include both owner and repository name (e.g. org/repo)</span>
                    </span>
                  )}
                </div>
              )}
            </form>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('webhook')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === 'webhook'
                    ? 'bg-zinc-800 text-white font-bold border border-white/10 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1. GitHub Cloud Webhook
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('push_existing')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === 'push_existing'
                    ? 'bg-zinc-800 text-white font-bold border border-white/10 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2. Created Repo Yourself?
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local_hook')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === 'local_hook'
                    ? 'bg-zinc-800 text-white font-bold border border-white/10 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3. Offline Local Hook
              </button>
            </div>

            {/* Tab Content 1: GitHub Cloud Webhook */}
            {activeTab === 'webhook' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <div className="text-zinc-400 flex items-center justify-between">
                    <span>GitHub Webhook Payload URL:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookUrl, 'url')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'url' ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-cyan-300 break-all">
                    {webhookUrl}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5 space-y-2">
                  <div className="font-semibold text-zinc-200">How to add in GitHub:</div>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed">
                    <li>Go to your GitHub repo <strong className="text-zinc-200">Settings</strong> → <strong className="text-zinc-200">Webhooks</strong> → <strong className="text-zinc-200">Add webhook</strong>.</li>
                    <li>Paste the Payload URL above and set Content Type to <code className="text-zinc-300">application/json</code>.</li>
                    <li>Under events, select <strong className="text-zinc-200">Pushes</strong>, <strong className="text-zinc-200">Pull requests</strong>, and <strong className="text-zinc-200">Workflow runs / Check runs</strong>.</li>
                    <li>Click <strong className="text-zinc-200">Add webhook</strong>. Every push will auto-advance your sprint!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tab Content 2: Created Repo Yourself */}
            {activeTab === 'push_existing' && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-zinc-400 leading-relaxed">
                  If you created a new blank repo on GitHub, push your scaffolded files or initial code using these standard commands:
                </p>

                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
{`# 1. Initialize and link remote
git init
git remote add origin https://github.com/${repoInput.trim() || 'your-username/your-repo'}.git

# 2. Add and commit with a task tag (e.g. closes #CORE-01)
git add .
git commit -m "feat: closes #CORE-01 initial scaffolding setup"

# 3. Push branch to GitHub
git branch -M main
git push -u origin main`}
                  </pre>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `git init\ngit remote add origin https://github.com/${repoInput.trim() || 'your-username/your-repo'}.git\ngit add .\ngit commit -m "feat: closes #CORE-01 initial setup"\ngit branch -M main\ngit push -u origin main`,
                        'git-push'
                      )
                    }
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === 'git-push' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'git-push' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-zinc-500">
                  Tagging commits with <code className="text-cyan-400">closes #TASK_CODE</code> or using branches like <code className="text-cyan-400">task/CORE-01</code> automatically advances tasks on your board.
                </div>
              </div>
            )}

            {/* Tab Content 3: Offline Local Hook */}
            {activeTab === 'local_hook' && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-zinc-400 leading-relaxed">
                  Developing on localhost without a public domain? Drop this 4-line hook into your repo’s <code className="text-zinc-200">.git/hooks/post-commit</code> so every local commit updates Daedalus instantly:
                </p>

                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
                    {localHookCode}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(localHookCode, 'hook')}
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === 'hook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'hook' ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-zinc-400">
                  Save this script as <code className="text-white">.git/hooks/post-commit</code> and run <code className="text-white">chmod +x .git/hooks/post-commit</code>.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
