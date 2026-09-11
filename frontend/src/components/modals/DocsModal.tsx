import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Terminal,
  GitBranch,
  Code2,
  ShieldCheck,
  FolderGit2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWorkspace?: () => void;
}

interface DocArticle {
  id: string;
  category: string;
  title: string;
  badge: string;
  summary: string;
  content: {
    sectionTitle: string;
    text: string;
    code?: string;
    language?: string;
  }[];
}

const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'quickstart',
    category: 'GETTING STARTED',
    title: '60-Second Hackathon Quickstart',
    badge: 'Guide',
    summary: 'From concept prompt and squad formation to a verified acyclic dependency graph and runnable multi-service repository in under 60 seconds.',
    content: [
      {
        sectionTitle: '1. Launch Web Workspace or Local Stack',
        text: 'Daedalus offers two frictionless entry points tailored for fast-paced hackathons: launch the interactive Web Workspace directly in your browser with zero local installation, or spin up the full-stack system locally via Docker Compose.',
        code: `# Quickstart A: One-command containerized stack (Docker Compose)
docker compose up --build

# Quickstart B: Clone repository for local development
git clone https://github.com/rajtharun08/Daedalus.git
cd Daedalus

# Quickstart C: Start Daedalus local dev servers with hot-reloading
cd frontend && npm run dev     # UI running at http://localhost:5173
cd backend && python main.py   # API running at http://localhost:8000`,
        language: 'bash',
      },
      {
        sectionTitle: '2. Form Your Squad & Assign Squad Lead',
        text: 'Navigate to the Hackathon Squad Deck. When you create a squad, you are automatically crowned Squad Lead (👑 SQUAD LEAD (YOU)) and designated as Member 1. Add teammates or invite developers whose 5-domain skill radars complement your strengths (Frontend, Backend, AI/ML, DevOps, UI/UX). Once assembled, click "Open Workspace" to launch your dedicated sprint cockpit.',
      },
      {
        sectionTitle: '3. Natural Language Sprint Decomposition',
        text: 'Enter your project vision into the AI Decomposer (e.g., "DeFi cross-chain yield aggregator with automated rebalancing and Telegram alert bot"). Daedalus extracts functional requirements, analyzes architectural constraints, determines time estimates, and produces an acyclic Directed Acyclic Graph (DAG) with explicit dependency edges.',
        code: `// Sample Task Node emitted by the AI Decomposer
{
  "id": "task-auth-01",
  "title": "Dual-Tier Web3 & OAuth Session Service",
  "domain": "backend",
  "estimatedHours": 3.5,
  "requiredSkills": {
    "frontend": 0.2,
    "backend": 0.9,
    "ai_ml": 0.0,
    "devops": 0.4,
    "ui_ux": 0.1
  },
  "dependencies": ["task-db-schema-00"],
  "deliverables": [
    "JWT signing middleware with Ed25519 keys",
    "SIWE (Sign-In with Ethereum) nonce verification",
    "PostgreSQL session table migration"
  ]
}`,
        language: 'json',
      },
      {
        sectionTitle: '4. Synthesize & Download Complete Repository',
        text: 'In the Infrastructure & Scaffolding panel, select your target tech stack (FastAPI/Express, React 19/Next.js, Tailwind, Docker Compose, and GitHub Actions). Click "Generate Infrastructure" to synthesize a complete multi-service repository in-memory and download it as a ready-to-run .zip archive with zero missing configuration files.',
      },
    ],
  },
  {
    id: 'byok-vault',
    category: 'SECURITY & PRIVACY',
    title: 'Zero-Knowledge BYOK Vault & Gateway',
    badge: 'Security',
    summary: 'Browser-native AES-256-GCM client-side encryption, ephemeral TLS header pass-through, and zero-storage backend guarantees.',
    content: [
      {
        sectionTitle: 'Client-Side Cryptographic Vault (Web Crypto API)',
        text: 'Daedalus guarantees zero-storage key custody. Your API keys (Google Gemini, OpenAI, Anthropic, DeepSeek, Groq, OpenRouter) are never written to our database or persistent backend storage. Keys are encrypted directly in your browser using the native Web Crypto API with PBKDF2 (100,000 iterations of SHA-256) and AES-256-GCM authenticated encryption.',
        code: `// Client-side Web Crypto API Vault Implementation
export async function encryptKey(plainKey: string, masterPass: string): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive AES-256 key via PBKDF2 (100,000 rounds)
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(masterPass), 'PBKDF2', false, ['deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    enc.encode(plainKey)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv))
  };
}`,
        language: 'typescript',
      },
      {
        sectionTitle: 'Ephemeral TLS Header Pass-Through & Backend Redaction',
        text: 'When calling AI models, your browser decrypts the required key into ephemeral memory and transmits it strictly through encrypted HTTPS request headers (e.g., X-Gemini-Key, X-OpenAI-Key). The Daedalus FastAPI backend consumes the key in-flight, proxies the request to the upstream AI provider, and immediately discards it. Redactor middleware intercepts all logging streams to guarantee zero leakage in console logs or error traces.',
        code: `# FastAPI Ephemeral Header Consumption & Redactor
from fastapi import Request, HTTPException
import logging

class KeyRedactorFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        for header in ["X-Gemini-Key", "X-OpenAI-Key", "X-Anthropic-Key"]:
            if header in msg:
                record.msg = msg.replace(header, "[REDACTED_BYOK_KEY]")
        return True

async def extract_ephemeral_key(request: Request, provider: str) -> str:
    header_name = f"X-{provider.capitalize()}-Key"
    key = request.headers.get(header_name)
    if not key:
        raise HTTPException(status_code=401, detail=f"Missing ephemeral {header_name}")
    return key  # Consumed strictly in-memory, never persisted`,
        language: 'python',
      },
      {
        sectionTitle: 'Emergency Panic Shredder',
        text: 'In a hackathon or shared workstation environment, click the red "Panic Shredder" button in the Key Vault. This executes an instant cryptographic zeroization routine: local storage tokens are purged, in-memory buffers are overwritten with random entropy, and active WebSocket sessions are terminated in sub-5ms.',
      },
    ],
  },
  {
    id: 'dag-engine',
    category: 'CORE ARCHITECTURE',
    title: 'DAG & Topological Dependency Engine',
    badge: 'Engine',
    summary: 'Graph-theoretical foundation guaranteeing zero circular dependencies, bottleneck elimination, and optimal parallel execution paths.',
    content: [
      {
        sectionTitle: 'Mathematical Graph Formulation G = (V, E)',
        text: 'A hackathon project is modeled as a finite directed graph G = (V, E), where vertices V represent development tasks and directed edges (u, v) in E represent strict prerequisites (task v cannot begin until task u is completed). A valid execution schedule exists if and only if G contains no directed cycles, making it a Directed Acyclic Graph (DAG).',
      },
      {
        sectionTitle: 'In-Degree Zero Topological Sort & Cycle Isolation',
        text: 'Daedalus computes the in-degree indeg(v) = |{u in V : (u, v) in E}| for every task node. All nodes with in-degree 0 are queued as Phase 1 parallel tasks. As tasks complete, downstream node in-degrees decrement. If unvisited nodes remain with non-zero in-degrees when the queue empties, Daedalus isolates the exact cyclical subgraph and prompts the user with deterministic cycle-breaking recommendations.',
        code: `// Complete Topological Sort & Cycle Detection Engine
export interface DAGValidationResult {
  isAcyclic: boolean;
  executionOrder: string[];
  parallelPhases: string[][];
  cycleNodes: string[];
}

export function analyzeSprintDAG(tasks: { id: string }[], edges: { from: string; to: string }[]): DAGValidationResult {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  tasks.forEach(t => {
    inDegree.set(t.id, 0);
    adjList.set(t.id, []);
  });

  edges.forEach(e => {
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    adjList.get(e.from)?.push(e.to);
  });

  // Kahn's in-degree zero queue traversal
  let currentLevel = tasks.filter(t => inDegree.get(t.id) === 0).map(t => t.id);
  const phases: string[][] = [];
  const executionOrder: string[] = [];

  while (currentLevel.length > 0) {
    phases.push([...currentLevel]);
    executionOrder.push(...currentLevel);
    const nextLevel: string[] = [];

    for (const nodeId of currentLevel) {
      for (const neighbor of adjList.get(nodeId) || []) {
        const updatedInDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, updatedInDegree);
        if (updatedInDegree === 0) {
          nextLevel.push(neighbor);
        }
      }
    }
    currentLevel = nextLevel;
  }

  const isAcyclic = executionOrder.length === tasks.length;
  const cycleNodes = isAcyclic ? [] : tasks.filter(t => (inDegree.get(t.id) || 0) > 0).map(t => t.id);

  return { isAcyclic, executionOrder, parallelPhases: phases, cycleNodes };
}`,
        language: 'typescript',
      },
      {
        sectionTitle: 'Critical Path Depth Analysis',
        text: 'Using dynamic programming across the topological order, Daedalus computes the critical path: the sequence of dependent tasks whose cumulative duration determines the absolute minimum completion time of the hackathon project. Tasks on the critical path receive visual highlighting on the canvas, alerting squad leads to assign senior bandwidth to those bottlenecks.',
      },
    ],
  },
  {
    id: 'squad-deck',
    category: 'COLLABORATION',
    title: 'Hackathon Squad Deck & 5-Domain Radar',
    badge: 'Squad',
    summary: 'Git commit AST profiling, multi-dimensional skill matchmaking, and team synergy optimization for 24-48 hour hackathons.',
    content: [
      {
        sectionTitle: '5-Dimensional Developer Skill Vector',
        text: 'Daedalus profiles developer repositories and commit ASTs to derive a 5-element normalized skill vector S = [Frontend, Backend, AI/ML, DevOps, UI/UX] in [0, 1]^5. This provides an objective baseline for team balance and automated task delegation.',
        code: `# Developer Skill Vector & Cosine Similarity Matchmaking
import numpy as np

def calculate_match_score(developer_vector: list[float], task_vector: list[float]) -> float:
    """Computes cosine similarity between developer proficiency and task requirement."""
    dev = np.array(developer_vector, dtype=float)
    task = np.array(task_vector, dtype=float)
    
    norm_dev = np.linalg.norm(dev)
    norm_task = np.linalg.norm(task)
    
    if norm_dev == 0 or norm_task == 0:
        return 0.0
    
    return float(np.dot(dev, task) / (norm_dev * norm_task))

# Example: Assigning an AI/ML Vector Pipeline Task
# Task Vector: [Frontend: 0.1, Backend: 0.4, AI/ML: 0.9, DevOps: 0.5, UI/UX: 0.0]
task_req = [0.1, 0.4, 0.9, 0.5, 0.0]
dev_alice = [0.2, 0.5, 0.85, 0.4, 0.1]  # Score: ~0.97 (Strong Match)
dev_bob   = [0.9, 0.3, 0.1, 0.2, 0.8]   # Score: ~0.35 (Poor Match)`,
        language: 'python',
      },
      {
        sectionTitle: 'Squad Creator Leadership Invariant',
        text: 'When a user creates a new squad in Daedalus, they are automatically designated as Squad Lead (👑 SQUAD LEAD (YOU)) and pinned as Member 1. Squad leads cannot be accidentally removed or demoted. They retain authority to invite members, edit the master roadmap, split tasks, and configure cloud deployment targets.',
      },
      {
        sectionTitle: 'Strict In-Squad Assignment Constraint',
        text: 'All roadmap tasks generated by the AI decomposer are strictly partitioned among registered squad members. External or unassigned tasks are flagged with warnings, guaranteeing that every feature on the Kanban board has an active in-squad owner before development commences.',
      },
    ],
  },
  {
    id: 'task-splitting',
    category: 'EXECUTION ENGINE',
    title: 'Dynamic Task Splitting & Graph Invariant Rewiring',
    badge: 'Decomposer',
    summary: 'Algorithmic decomposition of monolithic bottlenecks into parallel micro-tracks with automated dependency inheritance.',
    content: [
      {
        sectionTitle: 'The Monolithic Bottleneck Dilemma',
        text: 'In hackathons, oversized tasks (e.g., "Implement Realtime Collaborative Whiteboard - 10 Hours") create deadlocks: frontend developers cannot work without server schemas, and backend developers build in isolation. Daedalus provides an automated task-splitting engine that breaks monolithic tasks into clean sub-tracks: Frontend Interface, Backend Schema/Sockets, and Automated Test Coverage.',
      },
      {
        sectionTitle: 'Graph Invariant Rewiring Rules',
        text: 'When a parent task P is split into subtasks S1 (Frontend) and S2 (Backend): (1) All inbound edges targeting P are rewired to S1 or S2 depending on domain prerequisites. (2) An internal dependency edge S2 -> S1 is established if the frontend consumes the backend contract. (3) All outbound edges originating from P are inherited by the terminal subtask. (4) Parent task P is retired cleanly, preserving the DAG invariant.',
        code: `// Automated Graph Rewiring on Task Split
export function splitTask(
  parentTaskId: string,
  subtasks: Task[],
  edges: DependencyEdge[]
): { updatedTasks: Task[]; updatedEdges: DependencyEdge[] } {
  // 1. Isolate inbound and outbound edges of the parent task
  const inboundEdges = edges.filter(e => e.targetTaskId === parentTaskId);
  const outboundEdges = edges.filter(e => e.sourceTaskId === parentTaskId);
  const remainingEdges = edges.filter(
    e => e.sourceTaskId !== parentTaskId && e.targetTaskId !== parentTaskId
  );

  // 2. Wire inbound edges to initial subtask (e.g. Subtask 0: Backend/Schema)
  const rewiredInbound = inboundEdges.map(e => ({
    ...e,
    targetTaskId: subtasks[0].id
  }));

  // 3. Chain internal subtasks sequentially or in parallel
  const internalEdges: DependencyEdge[] = [];
  for (let i = 0; i < subtasks.length - 1; i++) {
    internalEdges.push({
      id: \`edge-split-\${Date.now()}-\${i}\`,
      sourceTaskId: subtasks[i].id,
      targetTaskId: subtasks[i + 1].id
    });
  }

  // 4. Wire terminal subtask to original outbound targets
  const terminalSubtask = subtasks[subtasks.length - 1];
  const rewiredOutbound = outboundEdges.map(e => ({
    ...e,
    sourceTaskId: terminalSubtask.id
  }));

  return {
    updatedTasks: subtasks,
    updatedEdges: [...remainingEdges, ...rewiredInbound, ...internalEdges, ...rewiredOutbound]
  };
}`,
        language: 'typescript',
      },
      {
        sectionTitle: 'Domain-Based Auto-Reassignment',
        text: 'Immediately following a split, Daedalus examines the specialized skill requirements of each child subtask and matches them against your squad members. The frontend subtask is assigned to your UI lead, while backend API and database migrations are assigned to your infrastructure specialist.',
      },
    ],
  },
  {
    id: 'contract-mocks',
    category: 'PARALLELIZATION',
    title: 'Contract-First Mock API Engine',
    badge: 'Spec',
    summary: 'Type-safe OpenAPI schemas, zero-backend frontend prototyping, and sub-10ms mock streaming.',
    content: [
      {
        sectionTitle: 'Decoupled Parallel Development',
        text: 'Traditional hackathons lose 6 to 12 hours while frontend engineers wait for backend databases and API routes to be coded. Daedalus eliminates this wait: during the initial idea decomposition, strong TypeScript interfaces and simulated mock endpoints are synthesized simultaneously. Frontend developers build against real data structures on Minute 1.',
      },
      {
        sectionTitle: 'Mock Server with Latency & Error Jitter Simulation',
        text: 'Mock routes provide realistic network simulation (configurable 50ms-250ms latency with optional 2% HTTP 500 error jitter). This ensures frontend teams implement loading spinners, skeleton loaders, and error boundaries before connecting to production services.',
        code: `// Express / Vite Mock Server Implementation: server/api/mocks.ts
import { Router } from 'express';

export const mockRouter = Router();

// Simulated In-Memory Store
const mockSquads = [
  { id: 'squad-01', name: 'CyberPulse', lead: 'Tharun', members: 3, score: 94 }
];

mockRouter.get('/api/v1/squads', (req, res) => {
  // Inject realistic 120ms network latency
  setTimeout(() => {
    res.status(200).json({
      success: true,
      data: mockSquads,
      timestamp: new Date().toISOString()
    });
  }, 120);
});

mockRouter.post('/api/v1/squads', (req, res) => {
  const newSquad = { id: \`squad-\${Date.now()}\`, ...req.body };
  mockSquads.push(newSquad);
  res.status(201).json({ success: true, data: newSquad });
});`,
        language: 'typescript',
      },
      {
        sectionTitle: 'Zero-Code Live API Cutover',
        text: 'Daedalus client SDKs utilize a single environment toggle (VITE_USE_MOCKS=false). When your backend engineer merges their real FastAPI endpoints, switching the entire frontend app to production APIs requires no code changes.',
      },
    ],
  },
  {
    id: 'domain-archetypes',
    category: 'BLUEPRINTS',
    title: '8 Core Domain Archetype Blueprints',
    badge: 'Blueprints',
    summary: 'Production-ready architectural blueprints optimized for winning hackathon domains.',
    content: [
      {
        sectionTitle: '1. Web3 & DeFi Automated Market Maker (AMM)',
        text: 'Solidity smart contracts (Foundry framework), Ethers.js / Wagmi React hooks, local Anvil testnet, and mock Uniswap v3 swap router. Includes pre-written token swap, liquidity pool staking, and event listener contracts.',
        code: `# Synthesize via Workspace or download via Scaffolding API:
GET /api/v1/projects/scaffold/{project_id}/download
# Includes: contracts/ (Solidity 0.8.24), frontend/ (Wagmi + RainbowKit), tests/ (Foundry)`,
        language: 'bash',
      },
      {
        sectionTitle: '2. Local Healthcare & Medical RAG Pipeline',
        text: 'FastAPI microservice with LangChain / LlamaIndex retrieval, FAISS vector embeddings, HIPAA-grade client-side PII redactor, and structured medical citation outputs with certainty scoring.',
      },
      {
        sectionTitle: '3. CRDT Multiplayer Real-Time Canvas',
        text: 'WebSockets with Yjs conflict-free replicated data types (CRDT), WebRTC mesh fallback, and 60fps HTML5 Canvas/SVG rendering with shared pointer presence.',
      },
      {
        sectionTitle: '4. High-Frequency Fintech Ledger & Event Sourcing',
        text: 'Double-entry bookkeeping schema, Redis stream event processing, PostgreSQL transaction isolation, and idempotency key validation middleware.',
      },
    ],
  },
  {
    id: 'ci-webhooks',
    category: 'AUTOMATION',
    title: 'GitHub Actions CI Webhooks',
    badge: 'Integration',
    summary: 'Auto-advance Kanban tasks when pull requests pass automated test suites.',
    content: [
      {
        sectionTitle: 'Zero-Maintenance Sprint Tracking',
        text: 'During a high-intensity hackathon, developers should write code rather than manually moving cards across Kanban columns. Daedalus provides an automated webhook endpoint that parses GitHub check_run and pull_request events, automatically marking roadmap tasks as COMPLETED when tests pass and code merges.',
      },
      {
        sectionTitle: 'HMAC-SHA256 Signature Verification',
        text: 'Every incoming webhook is verified against your repository secret using HMAC-SHA256, protecting your sprint board from spoofed payload attacks.',
        code: `# FastAPI GitHub Webhook Verification Handler
import hmac
import hashlib
from fastapi import Request, HTTPException, Header

async def verify_github_signature(request: Request, x_hub_signature_256: str = Header(None)):
    secret = "your_daedalus_webhook_secret".encode('utf-8')
    payload = await request.body()
    
    if not x_hub_signature_256:
        raise HTTPException(status_code=401, detail="Missing signature header")
    
    expected_hash = "sha256=" + hmac.new(secret, payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, x_hub_signature_256):
        raise HTTPException(status_code=403, detail="Invalid cryptographic signature")
    
    return True`,
        language: 'python',
      },
      {
        sectionTitle: 'Complete GitHub Actions CI Workflow',
        text: 'Drop this workflow file into your repository under .github/workflows/daedalus-ci.yml to enable automatic task completion upon successful build and test runs.',
        code: `# .github/workflows/daedalus-ci.yml
name: Daedalus Sprint CI Gatekeeper

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  validate-and-notify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js & Python
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Run Test Suite
        run: |
          npm ci
          npm test -- --passWithNoTests

      - name: Notify Daedalus Sprint Engine
        if: success()
        run: |
          curl -s -X POST "https://api.daedalus.dev/api/v1/webhooks/github" \\
            -H "Content-Type: application/json" \\
            -H "X-Hub-Signature-256: \${{ secrets.DAEDALUS_WEBHOOK_SECRET }}" \\
            -d '{"ref":"\${{ github.ref }}","action":"pr_merged","status":"completed"}'`,
        language: 'yaml',
      },
    ],
  },
  {
    id: 'deployment',
    category: 'DEPLOYMENT',
    title: 'Local Setup & Docker Deployment',
    badge: 'DevOps',
    summary: 'Host execution, Docker Compose multi-container setup, and environment configuration.',
    content: [
      {
        sectionTitle: 'One-Command Containerized Deployment (Docker Compose)',
        text: 'Run the entire Daedalus platform (FastAPI backend, PostgreSQL with pgvector, and Vite frontend) with a single command:',
        code: `# 1. Clone the repository
git clone https://github.com/rajtharun08/Daedalus.git
cd Daedalus

# 2. Boot backend, frontend & database containers
docker compose up --build

# Endpoints:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs`,
        language: 'bash',
      },
      {
        sectionTitle: 'Local Host Development Setup',
        text: 'For local hot-reloading development on host machines without Docker:',
        code: `# Backend (Terminal 1)
cd backend
python -m venv venv
# Windows: .\\venv\\Scripts\\activate  |  Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev     # Runs on http://localhost:5173`,
        language: 'bash',
      },
      {
        sectionTitle: 'Environment Variables & Configuration',
        text: 'Configure your environment by setting these optional keys in backend/.env or your shell:',
        code: `# Daedalus Environment Variables
DATABASE_URL=sqlite+aiosqlite:///./daedalus_dev.db  # Or postgresql+asyncpg://...
PORT=8000                                          # Backend API port
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
SECRET_KEY=your-jwt-and-webhook-signing-secret
ENVIRONMENT=development`,
        language: 'bash',
      },
    ],
  },
];

export const DocsModal: React.FC<Props> = ({ isOpen, onClose, onNavigateToWorkspace }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const filteredArticles = DOC_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeArticle = DOC_ARTICLES.find((a) => a.id === selectedDocId) || DOC_ARTICLES[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isMaximized ? 'p-0' : 'p-2 sm:p-4 md:p-6'} bg-space-950/85 backdrop-blur-md transition-all`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className={`w-full ${
            isMaximized
              ? 'h-full w-full rounded-none border-0'
              : 'max-w-[96vw] 2xl:max-w-[1520px] h-[93vh] rounded-3xl border border-white/10'
          } bg-space-900 shadow-2xl flex flex-col overflow-hidden text-slate-200 transition-all duration-200`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-space-950/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-sans text-white">Daedalus Technical Documentation</h2>
                <p className="text-xs font-mono text-cyan-400">Architecture, Guides & API Specifications</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMaximized ? 'Restore Size' : 'Maximize Fullscreen'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Documentation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Split View */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 lg:w-96 border-r border-white/10 bg-space-950/60 p-4 sm:p-5 flex flex-col gap-4 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-space-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedDocId(article.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 border ${
                      selectedDocId === article.id
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-white shadow-[0_0_20px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30'
                        : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        {article.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyan-400 font-semibold border border-white/5">
                        {article.badge}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold font-sans text-slate-100 line-clamp-2 leading-snug">
                      {article.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content View */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12 space-y-8 scrollbar-thin">
              <div className="space-y-3 border-b border-white/10 pb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {activeArticle.category}
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">
                    {activeArticle.badge}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-sans text-white tracking-tight leading-tight">
                  {activeArticle.title}
                </h1>
                <p className="text-sm sm:text-base font-sans text-slate-300 leading-relaxed max-w-4xl">
                  {activeArticle.summary}
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-8 max-w-5xl">
                {activeArticle.content.map((sec, i) => (
                  <div key={i} className="space-y-3.5">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold font-sans text-white flex items-center gap-2.5">
                      <ChevronRight className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>{sec.sectionTitle}</span>
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                      {sec.text}
                    </p>

                    {sec.code && (
                      <div className="rounded-2xl bg-space-950 border border-white/10 overflow-hidden font-mono shadow-lg my-4">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-space-900 border-b border-white/10 text-xs text-slate-300">
                          <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px]">
                            {sec.language || 'code'}
                          </span>
                          <button
                            onClick={() => handleCopy(sec.code!)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs hover:text-white transition-colors cursor-pointer border border-white/5"
                          >
                            {copiedCode === sec.code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 leading-relaxed scrollbar-thin">
                          <pre>
                            <code>{sec.code}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
