import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  ArrowRight,
  CheckCircle2,
  Layers,
  Cpu,
  GitBranch,
  FolderGit2,
  BookOpen,
  Copy,
  Check,
  Zap,
  Code2,
  Activity,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onStartOnboarding: () => void;
  onLaunchTemplate?: (title: string, prompt: string) => void;
  onOpenDocs: () => void;
  onOpenCommandPalette: () => void;
}

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  prompt: string;
  epics: number;
  tasks: number;
  tags: string[];
  sampleFiles: {
    name: string;
    lang: string;
    code: string;
  }[];
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'whiteboard',
    title: 'Real-Time Multiplayer Whiteboard',
    category: 'Full-Stack / Distributed',
    prompt: 'Collaborative whiteboard platform using CRDTs for sub-10ms conflict-free drawing, WebSockets sync, Redis pub/sub, and JWT auth.',
    epics: 3,
    tasks: 7,
    tags: ['CRDT', 'WebSockets', 'Canvas API', 'Redis'],
    sampleFiles: [
      {
        name: 'server/api/sync.ts',
        lang: 'typescript',
        code: `// Auto-generated CRDT WebSocket contract
import { WebSocketServer, WebSocket } from 'ws';
import { applyStateDelta, CRDTRoot } from '../engine/crdt';

export function setupSyncSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data) => {
      const delta = JSON.parse(data.toString());
      const newState = await applyStateDelta(delta);
      // Broadcast sub-10ms state packet to active squad peers
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(newState));
        }
      });
    });
  });
}`,
      },
      {
        name: 'client/src/Canvas.tsx',
        lang: 'typescript',
        code: `// Pre-wired Canvas client with live mock fallback
import React, { useEffect, useRef } from 'react';
import { useSprintSocket } from './hooks/useSprintSocket';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sendDelta, remoteState } = useSprintSocket('/ws/sync');

  return (
    <div className="relative w-full h-full bg-space-950">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
      <div className="absolute top-3 left-3 font-mono text-[10px] text-cyan-400 bg-space-900/80 px-2 py-1 rounded">
        CRDT SYNC: ONLINE (Active)
      </div>
    </div>
  );
};`,
      },
    ],
  },
  {
    id: 'arbitrage',
    title: 'DeFi Flash-Loan Arbitrage Bot',
    category: 'Web3 / Algorithmic',
    prompt: 'Flash-loan arbitrage engine monitoring Uniswap and Sushiswap liquidity pools, executing sub-second smart contract trades via RPC nodes.',
    epics: 3,
    tasks: 8,
    tags: ['Solidity', 'FastAPI', 'Uniswap V3', 'Web3.py'],
    sampleFiles: [
      {
        name: 'contracts/FlashLoanArbitrage.sol',
        lang: 'solidity',
        code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";

contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Execute atomic multi-dex trade before loan repayment
        return true;
    }
}`,
      },
      {
        name: 'bot/scanner.py',
        lang: 'python',
        code: `# Sub-second liquidity pool spread analyzer
import asyncio
from web3 import AsyncWeb3

async def poll_pool_spreads(w3: AsyncWeb3, uniswap_pool, sushiswap_pool):
    while True:
        spread = await calculate_delta(uniswap_pool, sushiswap_pool)
        if spread > 0.0035: # >0.35% net arbitrage margin
            await dispatch_flash_loan(spread)
        await asyncio.sleep(0.12)`,
      },
    ],
  },
  {
    id: 'medical-rag',
    title: 'Clinical Records RAG Pipeline',
    category: 'AI / Healthcare',
    prompt: 'HIPAA-compliant document intelligence pipeline vectorizing clinical trials with 384-D embeddings, FastAPI endpoints, and citation audit trail.',
    epics: 3,
    tasks: 6,
    tags: ['Embeddings', 'FastAPI', 'Citation Graph', 'Resilient DB'],
    sampleFiles: [
      {
        name: 'app/services/rag_engine.py',
        lang: 'python',
        code: `# Vector search and citation grounding pipeline
from app.db.models import ClinicalTrial
from app.services.embeddings import get_embedding

async def query_clinical_records(prompt: str, top_k: int = 5):
    query_vector = await get_embedding(prompt)
    records = await ClinicalTrial.find_nearest(query_vector, limit=top_k)
    return {
        "citations": [r.trial_id for r in records],
        "synthesized_response": generate_grounded_answer(prompt, records)
    }`,
      },
      {
        name: 'client/src/CitationViewer.tsx',
        lang: 'typescript',
        code: `// HIPAA Citation Audit Trail Component
import React from 'react';

export const CitationViewer: React.FC<{ citations: string[] }> = ({ citations }) => (
  <div className="p-4 rounded-xl border border-cyan-500/20 bg-space-950 font-mono text-xs">
    <div className="text-cyan-400 font-bold mb-2">VERIFIED CLINICAL CITATIONS</div>
    {citations.map((c) => (
      <div key={c} className="text-slate-300 py-1 border-b border-white/5">
        DOI: 10.1001/jama.2026.clinical_trial_{c}
      </div>
    ))}
  </div>
);`,
      },
    ],
  },
];

export const HeroMasterpiece: React.FC<Props> = ({
  onStartOnboarding,
  onLaunchTemplate,
  onOpenDocs,
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const activeTemplate = TEMPLATES[activeTemplateIdx];
  const activeFile = activeTemplate.sampleFiles[activeFileIdx] || activeTemplate.sampleFiles[0];

  const handleCopySnippet = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.code);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 relative pt-2">
      {/* Subtle Restrained Radial Illumination */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header & Narrative */}
      <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
        {/* Masterpiece Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans text-white leading-[1.08]">
          Ship faster. Merge cleaner.{' '}
          <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-400 bg-clip-text text-transparent">
            Win the weekend.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed max-w-2xl mx-auto">
          Collaborative sprint platform that decomposes project prompts into topological dependency graphs, matches team skills from GitHub histories, and synthesizes runnable starter codebases in seconds.
        </p>

        {/* Action Group: Conversion-Focused Primary CTA + Documentation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {/* Primary Action Button: Linear / Stripe Style High-Contrast Solid */}
          <button
            onClick={onStartOnboarding}
            className="px-8 py-3.5 sm:py-4 rounded-xl bg-white text-space-950 font-sans text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2.5 cursor-pointer hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] group"
          >
            <Users className="w-4 h-4 text-space-950" />
            <span>Open Squad Deck</span>
            <ArrowRight className="w-4 h-4 text-space-950 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Secondary Action: Documentation & Architecture Specs */}
          <button
            onClick={onOpenDocs}
            className="px-6 py-3.5 sm:py-4 rounded-xl bg-space-900 hover:bg-space-850 border border-white/10 hover:border-white/20 font-sans text-xs sm:text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer transition-all"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Documentation & Specs</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Architecture Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Strict Acyclic Task Graph
          </span>
          <span className="text-slate-600">/</span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Zap className="w-3.5 h-3.5" /> Isolated Branch Workflows
          </span>
          <span className="text-slate-600">/</span>
          <span className="flex items-center gap-1.5 text-purple-300">
            <Code2 className="w-3.5 h-3.5" /> Automated Contract Mocking
          </span>
        </div>
      </div>

      {/* Product Cockpit Workbench */}
      <div className="relative rounded-2xl bg-space-950 border border-white/10 shadow-2xl overflow-hidden font-mono">
        
        {/* Cockpit Window Top Bar */}
        <div className="px-5 py-3.5 bg-space-900 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          {/* Architecture Spec Title */}
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-cyan-300">
              Architecture Preview
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              {activeTemplate.title}
            </span>
          </div>

          {/* Template Switcher Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase mr-1">Examples:</span>
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setActiveTemplateIdx(idx);
                  setActiveFileIdx(0);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  activeTemplateIdx === idx
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {tpl.id === 'whiteboard' ? 'CRDT Canvas' : tpl.id === 'arbitrage' ? 'DeFi Bot' : 'Medical RAG'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySnippet}
              className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy active code snippet"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Snippet Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cockpit Main Grid: 3 Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-[420px]">
          
          {/* PANE 1: Acyclic Task DAG (Span 4) */}
          <div className="lg:col-span-4 p-5 space-y-4 bg-space-950/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                Task Pipeline
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Acyclic Order
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-space-900 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-400 font-bold">CORE-01: Engine Contracts</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Specifies state interfaces and mock WebSocket handler.
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Assignee: @alex-rivera</span>
                  <span className="text-cyan-300 font-bold">Unlocks 2 Tasks</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-space-900 border border-purple-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-300 font-bold">API-02: Live Mock Sync</span>
                  <span className="text-[10px] text-cyan-400 font-bold">Parallel Active</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Runs local mock daemon with synthetic latency.
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Assignee: @elena-rostova</span>
                  <span className="text-emerald-400">Non-blocking</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-space-900 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">UI-03: Canvas State Engine</span>
                  <span className="text-[10px] text-purple-400">In Progress</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Interactive multi-touch surface consuming mock stream.
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Assignee: @marcus-vance</span>
                  <span className="text-cyan-400">Ready to Merge</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Concurrent Execution:</span>
              <span className="text-cyan-400 font-bold">3 Parallel Tracks</span>
            </div>
          </div>

          {/* PANE 2: Live Code & Contract Editor (Span 5) */}
          <div className="lg:col-span-5 p-5 space-y-3 flex flex-col justify-between bg-space-900/40">
            <div className="space-y-3">
              {/* File Sub-tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  {activeTemplate.sampleFiles.map((file, idx) => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFileIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                        activeFileIdx === idx
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {file.name.split('/').pop()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase">{activeFile.lang}</span>
                  <button
                    onClick={handleCopySnippet}
                    className="px-2 py-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                    title="Copy code snippet"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="p-3.5 rounded-xl bg-space-950 border border-white/5 overflow-x-auto text-[11px] text-slate-300 max-h-[260px] scrollbar-thin leading-relaxed">
                <pre>
                  <code>{activeFile.code}</code>
                </pre>
              </div>
            </div>

            {/* In-Memory Scaffold Footer */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-slate-400">&gt; Starter repository generated</span>
              <span className="text-emerald-400">42 files verified</span>
            </div>
          </div>

          {/* PANE 3: Blueprint Specs & Invariants (Span 3) */}
          <div className="lg:col-span-3 p-5 space-y-4 bg-space-950/80 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Blueprint Specs
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {activeTemplate.category.split('/')[0].trim()}
              </span>
            </div>

            {/* Scope Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-space-900 border border-white/5 space-y-0.5">
                <div className="text-lg font-bold text-white font-mono">{activeTemplate.epics}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Epics</div>
              </div>
              <div className="p-2.5 rounded-xl bg-space-900 border border-white/5 space-y-0.5">
                <div className="text-lg font-bold text-cyan-400 font-mono">{activeTemplate.tasks}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tasks</div>
              </div>
            </div>

            {/* Stack Tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Target Stack</span>
              <div className="flex flex-wrap gap-1.5">
                {activeTemplate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 border border-white/10 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Architectural Invariants */}
            <div className="p-3 rounded-xl bg-space-900 border border-white/5 space-y-2 text-[11px]">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Engine Guarantees</div>
              <div className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Topological Acyclic DAG</span>
              </div>
              <div className="text-cyan-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Pre-wired Mock Contracts</span>
              </div>
              <div className="text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Parallel Branch Isolation</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Scaffold Ready:</span>
              <span className="text-emerald-400 font-bold">1-Click Synthesis</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
