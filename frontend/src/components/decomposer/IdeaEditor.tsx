import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Play, GitFork, Terminal, Check, Sparkles, Users } from 'lucide-react';
import { ActiveSquad } from '../../types';

interface Props {
  onSubmit: (title: string, description: string) => void;
  isLoading: boolean;
  activeSquad?: ActiveSquad | null;
}

const PRESETS = [
  {
    name: 'AI / RAG',
    title: 'Autonomous PubMed RAG & Medical Synthesizer',
    desc: `Construct a clinical trial intelligence system combining dense vector search and citation grounding.
Key requirements:
- PubMed Open Access XML parser and biomedical text chunking
- Hybrid sparse-dense retrieval (BM25 + BAAI/bge-large embeddings)
- Cross-encoder re-ranking pipeline with LLM citation grounding
- PII redaction and HIPAA compliance boundary enforcement
- Automated regression evaluation pipeline with RAGAS metrics`,
  },
  {
    name: 'Web3 / DeFi',
    title: 'Cross-DEX Mempool Arbitrage & Flash Loan Bot',
    desc: `Construct an EVM cross-DEX arbitrage execution engine with zero capital lockup.
Features:
- Mempool transaction listener for pending swap orders on Uniswap v3 & Sushiswap
- Solidity flash-loan receiver contract with atomic callback verification
- Subgraph indexer for real-time liquidity pool reserves & slip calculation
- Multi-call contract simulation to guarantee transaction profitability
- Automated GitHub CI unit test runner verifying gas limits and slippage bounds`,
  },
  {
    name: 'CRDT / Realtime',
    title: 'Autonomous Collaborative Vector Whiteboard',
    desc: `Build a real-time collaborative vector whiteboard with zero merge conflicts.
Requirements:
- Yjs / Automerge CRDT state synchronization over resilient WebSockets
- Canvas renderer with 60fps infinite pan/zoom and spatial index
- Conflict-free presence indicators with ephemeral cursor broadcasting
- Offline snapshot export to vector SVG and local IndexedDB cache
- Automated end-to-end integration tests validating simultaneous concurrent edits`,
  },
  {
    name: 'Fintech',
    title: 'Real-Time Transaction Fraud Detection & Settlement',
    desc: `High-throughput financial ledger processing 10,000 TPS with sub-10ms anomaly inference.
System specifications:
- Kafka event streaming pipeline ingesting raw card swipe authorizations
- Feature store with real-time rolling velocity counters (Redis cluster)
- Isolation forest inference model evaluating risk scores
- Double-entry bookkeeping ledger with strict SQL ACID guarantees
- Automated reconciliation worker and merchant webhook notification dispatcher`,
  },
  {
    name: 'Healthcare',
    title: 'Emergency Triage & Vital Signs Telemetry Platform',
    desc: `Intelligent ICU monitoring platform streaming patient telemetry with immediate alerts.
Specifications:
- MQTT broker ingestion for wearable SpO2, ECG, and blood pressure telemetry
- Anomaly detection service calculating National Early Warning Score (NEWS2)
- Real-time paramedic dispatch and hospital bed capacity coordinator
- HL7 / FHIR compliant patient medical record export
- Role-based encryption with automated audit logging`,
  },
  {
    name: 'DevTools',
    title: 'Distributed eBPF Profiler & Tracing Gateway',
    desc: `Continuous kernel profiling and OpenTelemetry tracing agent for Kubernetes clusters.
Architecture:
- eBPF kernel probes capturing CPU flamegraphs and network socket latency
- OTLP gRPC collector pipeline with streaming compression
- Live flamegraph visualization dashboard with differential profiling
- Alert manager triggering Slack webhooks on anomalous p99 latency spikes
- Automated CI pipeline testing kernel probe compilation across Linux versions`,
  },
];

export const IdeaEditor: React.FC<Props> = ({ onSubmit, isLoading, activeSquad }) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Dynamic domain detector
  const detectedDomain = React.useMemo(() => {
    if (!title.trim() && !description.trim()) return 'Custom Sprint';
    const text = (title + ' ' + description).toLowerCase();
    if (text.match(/pubmed|rag|vector|biomedical|clinical|hipaa/)) return 'AI / Biomedical RAG';
    if (text.match(/dex|mempool|arbitrage|flash loan|solidity|uniswap|evm/)) return 'Web3 / DeFi Arbitrage';
    if (text.match(/crdt|yjs|automerge|whiteboard|collaborative|canvas/)) return 'Realtime CRDT Engine';
    if (text.match(/fraud|kafka|ledger|tps|settlement|anomaly/)) return 'Fintech / High-TPS';
    if (text.match(/icu|vital|spo2|news2|paramedic|telemetry/)) return 'Healthcare Telemetry';
    if (text.match(/ebpf|flamegraph|opentelemetry|otlp|kernel|profiler/)) return 'DevTools / Kernel Tracing';
    return 'Fullstack Sprint';
  }, [title, description]);

  // Multi-stage compilation message


  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description.trim() || isLoading) return;
    const projectTitle = title.trim() || 'My Hackathon Sprint';
    onSubmit(projectTitle, description.trim());
  };

  const handleInjectArch = (textToAppend: string) => {
    if (description.includes(textToAppend.trim())) return;
    setDescription((prev) => prev.trimEnd() + textToAppend);
  };

  const wordCount = description.trim() ? description.trim().split(/\s+/).filter(Boolean).length : 0;
  const lineCount = description.trim() ? description.split('\n').length : 0;

  const ARCH_CHIPS = [
    { label: '+ WebSockets', text: '\n- Resilient WebSockets client connection with automatic heartbeat reconnection' },
    { label: '+ PostgreSQL', text: '\n- PostgreSQL relational database with strict ACID transaction guarantees' },
    { label: '+ Docker CI', text: '\n- Automated Docker multi-stage build and GitHub Actions CI test suite' },
    { label: '+ Redis Pub/Sub', text: '\n- Redis cluster caching and pub/sub message broadcaster' },
    { label: '+ JWT Auth', text: '\n- Stateless JWT authentication with role-based access control (RBAC)' },
    { label: '+ Pytest', text: '\n- Comprehensive Pytest unit and integration test coverage with mock fixtures' },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Quick Preset Badges & Actions */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Custom / Blank Project Button - Active by default */}
          <button
            type="button"
            onClick={() => {
              setSelectedPresetIdx(null);
              setTitle('');
              setDescription('');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
              selectedPresetIdx === null && !title
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/10'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>✨ Blank Project</span>
          </button>

          <span className="text-zinc-700 text-xs mx-0.5">|</span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">Presets:</span>

          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedPresetIdx(idx);
                setTitle(p.title);
                setDescription(p.desc);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer border ${
                selectedPresetIdx === idx
                  ? 'bg-zinc-800 text-white border-white/20 font-semibold shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/10'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) {
                  setDescription(text);
                  setSelectedPresetIdx(null);
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Paste Spec
          </button>
          <span className="text-zinc-700">•</span>
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
              setSelectedPresetIdx(null);
            }}
            className="text-[11px] font-mono text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Clear Form
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="space-y-3"
      >
        {/* Project Title Input */}
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 flex items-center gap-2.5 transition-colors focus-within:border-cyan-500/50">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />
          <span className="text-xs font-mono text-zinc-400 shrink-0">
            Project Name:
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (selectedPresetIdx !== null) setSelectedPresetIdx(null);
            }}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none font-sans font-semibold text-sm text-white placeholder-zinc-600 focus:ring-0"
            placeholder="e.g. Decentralized P2P Mesh Network, Real-Time Whiteboard..."
          />
        </div>

        {/* Code-Editor Styled Textarea with Clean Hairline Border */}
        <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 transition-colors duration-200">
          {/* Editor Title Bar with Live Metrics & Detected Archetype */}
          <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="ml-2 text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                idea_spec.prompt
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                {detectedDomain}
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">{wordCount} words</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{Math.max(lineCount, 1)} lines</span>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex min-h-[220px]">
            {/* Line Numbers */}
            <div className="py-3 pl-3 pr-2 text-right select-none font-mono text-xs text-zinc-600 border-r border-white/5 w-10 bg-zinc-950/80">
              {Array.from({ length: Math.max(lineCount, 6) }).map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (selectedPresetIdx !== null) setSelectedPresetIdx(null);
              }}
              disabled={isLoading}
              rows={8}
              placeholder={`Describe your hackathon project requirements, architecture goals, and tech stack in plain English...

Example:
- Build a real-time collaborative canvas with CRDT synchronization
- WebSockets relay server for sub-10ms peer delta updates
- Canvas API with 60fps pan/zoom and vector object export
- Redis pub/sub for multi-room presence and cursor broadcasting`}
              className="flex-1 p-3.5 bg-transparent border-none outline-none font-mono text-xs text-zinc-200 placeholder-zinc-600 resize-none leading-6 focus:ring-0"
            />
          </div>

          {/* 1-Click Architecture Tag Injector Strip */}
          <div className="px-3 py-2 bg-zinc-950/90 border-t border-white/5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 mr-1">Inject Requirement:</span>
            {ARCH_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInjectArch(chip.text)}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-white/15 transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-zinc-900/90 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5 pl-2 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Topological Dependency Resolution • Ready to Decompose</span>
            </span>

            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10">Ctrl+Enter</kbd>
              </span>

              <button
                type="submit"
                disabled={isLoading || !description.trim()}
                className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-mono font-bold tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Decomposing roadmap...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Decompose Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
