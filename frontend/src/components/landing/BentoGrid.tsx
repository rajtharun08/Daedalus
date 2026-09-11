import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  GitBranch,
  FolderGit2,
  ShieldCheck,
  Check,
  Copy,
  CheckCircle2,
  Terminal,
  Code2,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface CandidateSkill {
  name: string;
  repoCount: string;
  proficiencyLevel: string;
  relativeShare: number;
}

interface Candidate {
  handle: string;
  name: string;
  role: string;
  skills: CandidateSkill[];
  recommendedEpic: string;
  matchStatus: string;
}

const CANDIDATES: Record<string, Candidate> = {
  '@alex-fullstack': {
    handle: '@alex-fullstack',
    name: 'Alex Rivera',
    role: 'Frontend & Realtime Architect',
    skills: [
      { name: 'TypeScript / React', repoCount: '24 Repositories', proficiencyLevel: 'Primary Stack', relativeShare: 92 },
      { name: 'WebSockets / Canvas', repoCount: '9 Projects', proficiencyLevel: 'Core Competency', relativeShare: 85 },
      { name: 'Tailwind CSS', repoCount: '16 Repositories', proficiencyLevel: 'Proficient', relativeShare: 78 },
    ],
    recommendedEpic: 'EPIC-01: Interactive Collaborative Canvas',
    matchStatus: 'Verified Match: Frontend Lead',
  },
  '@elena-systems': {
    handle: '@elena-systems',
    name: 'Elena Rostova',
    role: 'Distributed Systems Engineer',
    skills: [
      { name: 'Rust / Systems Architecture', repoCount: '18 Repositories', proficiencyLevel: 'Primary Stack', relativeShare: 95 },
      { name: 'Redis Pub/Sub & CRDTs', repoCount: '11 Projects', proficiencyLevel: 'Core Competency', relativeShare: 88 },
      { name: 'FastAPI / Asyncio', repoCount: '14 Repositories', proficiencyLevel: 'Proficient', relativeShare: 80 },
    ],
    recommendedEpic: 'EPIC-02: Sub-10ms CRDT Sync Engine',
    matchStatus: 'Verified Match: Systems Architect',
  },
  '@marcus-devops': {
    handle: '@marcus-devops',
    name: 'Marcus Vance',
    role: 'Cloud & Infrastructure Engineer',
    skills: [
      { name: 'Docker / Multi-stage', repoCount: '28 Repositories', proficiencyLevel: 'Primary Stack', relativeShare: 90 },
      { name: 'GitHub Actions CI/CD', repoCount: '32 Workflows', proficiencyLevel: 'Core Competency', relativeShare: 86 },
      { name: 'PostgreSQL / Migrations', repoCount: '15 Repositories', proficiencyLevel: 'Proficient', relativeShare: 76 },
    ],
    recommendedEpic: 'EPIC-03: CI Test Pipeline & Deployment',
    matchStatus: 'Verified Match: DevOps & Infra',
  },
};

type CodeFileType = 'sync.ts' | 'Canvas.tsx' | 'daedalus.config.json';

const CODE_FILES: Record<CodeFileType, { filename: string; language: string; code: string }> = {
  'sync.ts': {
    filename: 'server/api/sync.ts',
    language: 'typescript',
    code: `// Auto-generated contract based on EPIC-02
import { WebSocketServer, WebSocket } from 'ws';
import { applyCRDTUpdate } from '../engine/crdt';

export function registerSyncRoute(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (rawPayload) => {
      const delta = JSON.parse(rawPayload.toString());
      const state = await applyCRDTUpdate(delta);
      // Broadcast state with sub-10ms latency
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(state));
        }
      });
    });
  });
}`,
  },
  'Canvas.tsx': {
    filename: 'client/src/Canvas.tsx',
    language: 'typescript',
    code: `// Live mock-connected Canvas component
import React, { useEffect, useRef } from 'react';
import { useSprintSocket } from './hooks/useSprintSocket';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sendDelta, remoteState } = useSprintSocket('/ws/sync');

  // Pre-wired to auto-sync with backend mocks
  useEffect(() => {
    if (remoteState) renderDeltas(canvasRef.current, remoteState);
  }, [remoteState]);

  return <canvas ref={canvasRef} className="w-full h-full bg-space-950" />;
};`,
  },
  'daedalus.config.json': {
    filename: 'daedalus.config.json',
    language: 'json',
    code: `{
  "$schema": "https://daedalus.dev/schema/v2.json",
  "sprintName": "Hackathon 24h Sprint",
  "parallelExecution": true,
  "topologicalDAG": true,
  "ciWebhookTrigger": "all-checks-green",
  "mockEndpoints": ["/ws/sync", "/api/v1/auth", "/api/v1/export"]
}`,
  },
};

const DAG_SPEC_SNIPPET = `{
  "pipelineId": "crdt-canvas-v2",
  "topologicalOrder": ["CORE-01", "API-02", "UI-03"],
  "metrics": {
    "acyclicVerified": true,
    "parallelTracks": 2,
    "criticalPathDepth": 2
  }
}`;

const WEBHOOK_PAYLOAD_SNIPPET = `{
  "event": "check_run.completed",
  "conclusion": "success",
  "branch": "feat/sync",
  "commit": "8f391b4",
  "autoTransition": {
    "taskCode": "API-02",
    "status": "COMPLETED"
  }
}`;

export const BentoGrid: React.FC = () => {
  // Candidate Profile Inspector
  const [selectedHandle, setSelectedHandle] = useState<string>('@alex-fullstack');
  const activeCandidate = CANDIDATES[selectedHandle] || CANDIDATES['@alex-fullstack'];

  // Code snippet explorer
  const [activeCodeTab, setActiveCodeTab] = useState<CodeFileType>('sync.ts');
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [hasCopiedDag, setHasCopiedDag] = useState(false);
  const [hasCopiedWebhook, setHasCopiedWebhook] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_FILES[activeCodeTab].code);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const handleCopyDag = () => {
    navigator.clipboard.writeText(DAG_SPEC_SNIPPET);
    setHasCopiedDag(true);
    setTimeout(() => setHasCopiedDag(false), 2000);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_PAYLOAD_SNIPPET);
    setHasCopiedWebhook(true);
    setTimeout(() => setHasCopiedWebhook(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8" id="architecture-specs">
      {/* Section Header: Clean Architecture & Example Specifications */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-space-950 border border-white/10 text-slate-300 text-xs font-mono">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Architecture Specifications</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
          Engineered for Velocity: <span className="text-cyan-400">Example Snippets</span>
        </h2>
        <p className="text-xs sm:text-sm font-sans text-slate-400 max-w-xl mx-auto">
          Inspect how Daedalus structures team skill vectors, topological task pipelines, CI webhook events, and synthesized starter codebases.
        </p>
      </div>

      {/* 4-Card Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CARD 1: Squad Pairing Analyzer (Span 7) */}
        <GlassCard className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 border-white/10 hover:border-cyan-500/30 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Squad Pairing
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                GitHub Commit Analysis
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-sans text-white">
                Competency Mapping via GitHub Commits
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                Analyzes repository commit histories, framework usage, and language distributions to map developer proficiencies directly from GitHub.
              </p>
            </div>

            {/* Teammate Profiles Spec Selector */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Profiles:</span>
              {Object.keys(CANDIDATES).map((handle) => (
                <button
                  key={handle}
                  onClick={() => setSelectedHandle(handle)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all ${
                    selectedHandle === handle
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-space-950 border border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {handle}
                </button>
              ))}
            </div>

            {/* Candidate Spec Card */}
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 space-y-3.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-bold text-cyan-300 text-xs">
                    {activeCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{activeCandidate.name}</div>
                    <div className="text-[10px] text-slate-400">{activeCandidate.role}</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {activeCandidate.matchStatus}
                </span>
              </div>

              {/* Skill Distribution & Verified Volume */}
              <div className="space-y-2.5">
                {activeCandidate.skills.map((skill) => (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-200 font-semibold">{skill.name}</span>
                      <span className="text-cyan-400 text-[10px] font-mono">{skill.repoCount} • {skill.proficiencyLevel}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.relativeShare}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Assignment Output */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Assigned Task Lead</div>
                  <div className="text-cyan-300 font-bold text-xs">{activeCandidate.recommendedEpic}</div>
                </div>
                <span className="text-emerald-400 text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Auto-Drafted
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Repository commit telemetry</span>
            <span className="text-cyan-400">Objective role alignment</span>
          </div>
        </GlassCard>

        {/* CARD 2: Parallel DAG Specification (Span 5) */}
        <GlassCard className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 border-white/10 hover:border-purple-500/30 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-purple-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4" /> Parallel Roadmap
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                Topological Ordering
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-sans text-white">
                Parallel Workflows, Zero Blockers
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                Decomposes projects into an acyclic task graph. Frontend builds against live mock APIs while backend configures databases in parallel.
              </p>
            </div>

            {/* Pipeline Stage Architecture */}
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                <span>Topological Depth: 2 Stages (3 Parallel Tracks)</span>
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded">0 Cycle Deadlocks</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <div className="font-bold">CORE-01</div>
                  <div className="text-slate-400">Contracts Ready</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  <div className="font-bold">API-02</div>
                  <div className="text-slate-400">Mock Live</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <div className="font-bold">UI-03</div>
                  <div className="text-slate-400">Active Build</div>
                </div>
              </div>

              {/* JSON Spec Snippet */}
              <div className="rounded-lg bg-space-900 border border-white/5 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-slate-400 uppercase">Topological DAG Spec</span>
                  <button
                    onClick={handleCopyDag}
                    className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {hasCopiedDag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopiedDag ? 'Copied' : 'Copy Spec'}</span>
                  </button>
                </div>
                <pre className="text-[10px] text-purple-300 font-mono overflow-x-auto">
                  <code>{DAG_SPEC_SNIPPET}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Topological ordering</span>
            <span className="text-purple-400">Dependency-verified</span>
          </div>
        </GlassCard>

        {/* CARD 3: GitHub CI Gatekeeper (Span 5) */}
        <GlassCard className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 border-white/10 hover:border-emerald-500/30 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Git-Driven CI
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                Automated Transitions
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-sans text-white">
                Tasks Update When Code Passes
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                Push commits, open pull requests, and watch tasks auto-complete the second your CI test checks go green via HMAC-SHA256 verified webhooks.
              </p>
            </div>

            {/* PR Check Spec Box */}
            <div className="p-4 rounded-xl bg-space-950 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-300 font-bold">PR #42: feat(sync) CRDT pipeline</span>
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                  feat/sync → main
                </span>
              </div>

              {/* Step Progress Specs */}
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Lint & TypeCheck
                  </span>
                  <span className="text-emerald-400 font-bold">Pass (0.3s)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Jest & Unit Tests
                  </span>
                  <span className="text-emerald-400 font-bold">28/28 Pass (0.7s)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    Daedalus Webhook Sync
                  </span>
                  <span className="text-cyan-400 font-bold">Task API-02 Complete</span>
                </div>
              </div>

              {/* Webhook Payload Snippet */}
              <div className="rounded-lg bg-space-900 border border-white/5 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-slate-400 uppercase">Webhook Event Spec</span>
                  <button
                    onClick={handleCopyWebhook}
                    className="flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {hasCopiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopiedWebhook ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
                <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto">
                  <code>{WEBHOOK_PAYLOAD_SNIPPET}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>GitHub webhook listener</span>
            <span className="text-emerald-400">HMAC-SHA256 verified</span>
          </div>
        </GlassCard>

        {/* CARD 4: Instant Scaffolding Streamer (Span 7) */}
        <GlassCard className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 border-white/10 hover:border-cyan-500/30 relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4" /> Scaffolding & Codebases
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                Day-One Scaffolding
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-sans text-white">
                Full Starter Codebase in Seconds
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                Synthesizes a clean, runnable repository tailored to your exact roadmap with pre-wired API routes, contract-first UI views, and dev configurations. Skip boilerplate fatigue entirely.
              </p>
            </div>

            {/* Code Tabs & Snippet Viewer */}
            <div className="rounded-xl bg-space-950 border border-white/10 overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-2 bg-space-900 border-b border-white/5">
                <div className="flex items-center gap-2">
                  {(Object.keys(CODE_FILES) as CodeFileType[]).map((fileKey) => (
                    <button
                      key={fileKey}
                      onClick={() => setActiveCodeTab(fileKey)}
                      className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                        activeCodeTab === fileKey
                          ? 'bg-white/10 text-cyan-400 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fileKey}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copy active code snippet"
                >
                  {hasCopiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Viewer */}
              <div className="p-3.5 overflow-x-auto max-h-[160px] text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
                <pre className="font-mono">
                  <code>{CODE_FILES[activeCodeTab].code}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>In-memory synthesis</span>
            <span className="text-cyan-400">FastAPI + React 18 + Docker</span>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};
