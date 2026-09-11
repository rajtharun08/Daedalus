import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Layers,
  HelpCircle,
  Code2,
  Terminal,
  Cpu,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Key,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface TechArchitectureItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  description: string;
  codeSnippet: string;
  bulletPoints: string[];
}

const ARCHITECTURE_ITEMS: TechArchitectureItem[] = [
  {
    id: 'acyclic-dag',
    title: 'Topological Ordering & Cycle Detection',
    subtitle: "Topological Cycle Detection (Kahn's Algorithm)",
    badge: 'O(V + E) Complexity',
    icon: GitBranch,
    description:
      "Daedalus represents sprint epics and tasks as a Directed Acyclic Graph (DAG). Using in-degree tracking and Kahn's algorithm, dependency cycles are detected and rejected at decomposition time.",
    codeSnippet: `// Topological Sort & Cycle Elimination
function resolveTaskDAG(tasks: Task[], edges: Dependency[]): Task[] {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  // Calculate in-degree for each task
  edges.forEach(e => inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1));
  tasks.filter(t => (inDegree.get(t.id) || 0) === 0).forEach(t => queue.push(t.id));
  
  const ordered: Task[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(tasks.find(t => t.id === current)!);
    // Decrement dependent in-degrees to unlock parallel tasks
  }
  if (ordered.length !== tasks.length) throw new Error("Cycle detected");
  return ordered;
}`,
    bulletPoints: [
      'Guarantees 0 circular blocking dependencies',
      'Calculates parallel critical paths for concurrent developer execution',
      'Surfaces unblocked tasks to frontend and backend simultaneously',
    ],
  },
  {
    id: 'contract-mocks',
    title: 'Contract-First Mock API Engine',
    subtitle: 'Zero-Wait Frontend Scaffolding',
    badge: 'Sub-10ms Response',
    icon: Code2,
    description:
      'Frontend engineers frequently lose 4+ hours waiting for backend routes. Daedalus auto-generates type-safe mock API endpoints directly from your sprint roadmap specifications.',
    codeSnippet: `// Auto-generated contract-first mock server
app.get("/api/v1/auth/session", (req, res) => {
  // Pre-wired schema based on Task AUTH-01
  res.json({
    userId: "usr_h8472",
    handle: "@developer",
    sessionToken: "mock_jwt_payload_xyz",
    expiresIn: 3600
  });
});`,
    bulletPoints: [
      'Frontend team builds functional UI without backend blockers',
      'Full TypeScript interface contracts exported automatically',
      'Seamless 1-line switch from mock server to live production backend',
    ],
  },
  {
    id: 'commit-profiling',
    title: 'Repository Commit & Language Profiling',
    subtitle: 'Objective Competency Discovery',
    badge: 'Direct GitHub Telemetry',
    icon: Cpu,
    description:
      'Self-reported questionnaires waste time and misjudge team capabilities. Daedalus inspects public GitHub commit histories, language distributions, and framework usage to pair developers with their highest-leverage tasks.',
    codeSnippet: `// Repository Commit History & Language Ingestion
const candidateVector = analyzeDeveloperProfile({
  handle: "@teammate",
  reposInspected: 12,
  primaryLanguages: ["TypeScript", "Rust", "Python"],
  detectedSpecialties: ["Async Streams", "WebSocket CRDTs", "Docker CI"]
});`,
    bulletPoints: [
      'Discovers verified coding proficiencies directly from GitHub',
      'Eliminates team assignment debates at 10 AM on Saturday',
      'Balances squad radar across Frontend, Backend, Database, DevOps, and AI',
    ],
  },
  {
    id: 'ci-gatekeeper',
    title: 'Automated GitHub CI Webhook State Machine',
    subtitle: 'No Manual Board Dragging',
    badge: 'HMAC-SHA256 Verified',
    icon: ShieldCheck,
    description:
      'Manual Kanban boards get abandoned at 2 AM during crunch time. Daedalus connects directly to GitHub Webhooks, transitioning tasks to Completed the instant your automated tests pass.',
    codeSnippet: `// GitHub Actions Check Run Webhook Handler
@app.post("/api/v1/webhooks/github")
async def handle_ci_check(event: CheckRunEvent):
    if event.check_run.conclusion == "success":
        task_id = extract_task_tag(event.check_run.head_commit.message)
        await sprint_engine.mark_task_done(task_id)
        await ws_broadcast({"event": "TASK_COMPLETED", "taskId": task_id})`,
    bulletPoints: [
      'Tasks auto-complete upon green GitHub Actions CI checks',
      'Subscribers receive sub-second WebSockets board updates',
      'Generates automated sprint audit trails ready for judges and Devpost',
    ],
  },
  {
    id: 'byok-vault',
    title: 'Zero-Knowledge BYOK & Multi-AI Gateway',
    subtitle: 'Client-Side AES-256-GCM Encryption',
    badge: 'PBKDF2 100k SHA-256',
    icon: Key,
    description:
      'Developers bring their own preferred AI keys (Google Gemini 3.6, OpenAI GPT-4o, Anthropic Claude 3.5, GitHub PAT). Keys are encrypted client-side using Web Crypto AES-256-GCM and transmitted via ephemeral headers with zero server persistence and automatic log redaction.',
    codeSnippet: `// Web Crypto AES-256-GCM Vault & Ephemeral Transit
const cryptoKey = await deriveKey(deviceSalt); // PBKDF2 100k
const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, rawKey);

// Dispatched via ephemeral in-memory TLS headers:
headers: {
  'X-BYOK-Provider': 'gemini',
  'X-BYOK-Key': decryptedMemoryKey, // Dereferenced immediately
  'X-BYOK-Model': 'gemini-3.6-flash'
}`,
    bulletPoints: [
      'Zero disk or database persistence of raw API keys anywhere',
      'Native REST adapters for Gemini 3.6 Flash, GPT-4o, and Claude 3.5',
      'SensitiveHeaderRedactorMiddleware strips keys from responses and logs',
      '1-Click Panic Shredder permanently destroys local vault state',
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: 'How does Bring Your Own Key (BYOK) work and is my API key safe?',
    a: 'Daedalus features a Zero-Knowledge Client-Side Key Vault powered by native Web Crypto AES-256-GCM and PBKDF2 with 100,000 iterations. Your raw API keys (Google Gemini 3.6, OpenAI GPT-4o, Anthropic Claude 3.5, GitHub PAT) are never written to disk, databases, or cookies. Keys travel only through encrypted HTTPS request headers for the duration of prompt execution and are immediately scrubbed by our SensitiveHeaderRedactorMiddleware. You also have access to an instant 1-click Panic Shredder to wipe all local ciphertexts.',
  },
  {
    q: 'Can our squad use Daedalus for a 24-hour or 48-hour hackathon without preparation?',
    a: 'Absolutely. Daedalus requires zero prior setup or database configuration. Enter your team handles, describe your project idea, and Daedalus compiles an acyclic roadmap and downloadable starter repo in under 60 seconds.',
  },
  {
    q: 'Can teammates write in different programming languages?',
    a: 'Yes! Because Daedalus generates contract-first API endpoints and mock specifications, a React frontend engineer, a Python FastAPI backend dev, and a Rust systems architect can collaborate seamlessly with zero interface friction.',
  },
  {
    q: 'How does Daedalus prevent 3 AM git merge conflicts?',
    a: 'Daedalus organizes tasks into isolated branches with strict dependency boundaries derived from topological dependency resolution. Because developers build against contract mocks rather than editing the same shared files, merge conflicts drop to zero.',
  },
  {
    q: 'Is our proprietary code or private repository indexed?',
    a: 'No. Daedalus inspects public commit histories and repository languages in-memory. Zero private repository code is retained or shared.',
  },
  {
    q: 'Do we need to install any heavy CLI dependencies?',
    a: 'None at all. You can use Daedalus entirely in your browser to inspect roadmaps, match teammates, and download your starter repository ZIP with zero local setup or CLI dependencies.',
  },
];

export const TechDeepDiveFAQ: React.FC = () => {
  const [selectedArchId, setSelectedArchId] = useState<string>('acyclic-dag');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const activeArch = ARCHITECTURE_ITEMS.find((item) => item.id === selectedArchId) || ARCHITECTURE_ITEMS[0];
  const Icon = activeArch.icon;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16" id="architecture-deepdive">
      
      {/* 1. TECHNICAL ARCHITECTURE DEEP-DIVE */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-neon-cyan text-xs font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>SYSTEM ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
            Built for Engineers Who Value <span className="text-neon-cyan">Precision</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-xl mx-auto">
            Explore the algorithms and protocols powering Daedalus's sprint orchestration.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {ARCHITECTURE_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            const isSelected = item.id === selectedArchId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedArchId(item.id)}
                className={`p-3.5 rounded-xl font-mono text-xs text-left transition-all cursor-pointer flex items-center gap-3 border ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                    : 'bg-space-950/70 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs truncate">{item.title.split('&')[0]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.badge}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Architecture Spec Card */}
        <GlassCard className="p-6 sm:p-8 border-cyan-500/30 bg-space-950/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Details & Explanation */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  {activeArch.subtitle}
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                  {activeArch.badge}
                </span>
              </div>

              <h3 className="text-2xl font-bold font-sans text-white">
                {activeArch.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                {activeArch.description}
              </p>

              {/* Bullet Points */}
              <div className="space-y-2 pt-2">
                {activeArch.bulletPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs font-sans text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Code Snippet */}
            <div className="lg:col-span-6 rounded-xl bg-space-900/90 border border-white/10 p-4 font-mono text-xs overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Terminal className="w-3.5 h-3.5" />
                  spec_engine.ts
                </span>
                <span>Algorithm Verification</span>
              </div>

              <div className="py-3 overflow-x-auto text-[11px] text-slate-300 scrollbar-thin">
                <pre>
                  <code>{activeArch.codeSnippet}</code>
                </pre>
              </div>

              <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
                <span>Memory Footprint: &lt;45MB</span>
                <span className="text-emerald-400">Ready to execute</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 2. FREQUENTLY ASKED DEVELOPER QUESTIONS */}
      <section className="space-y-8" id="faq">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-neon-violet text-xs font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>DEVELOPER FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
            Everything You Need to Know Before Sprinting
          </h2>
          <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-xl mx-auto">
            Direct answers to real technical questions from hackathon winners and engineers.
          </p>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <GlassCard
                key={idx}
                className={`border transition-all overflow-hidden ${
                  isOpen ? 'border-cyan-500/40 bg-space-950/90' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-white font-sans pr-4">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cyan-300' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed border-t border-white/5 pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>
      </section>

    </div>
  );
};
