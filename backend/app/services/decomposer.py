import json
import logging
import re
from collections import defaultdict, deque
from typing import Dict, List, Optional, Tuple, Any
from app.services.embeddings import compute_deterministic_embedding, cosine_similarity

logger = logging.getLogger("daedalus.decomposer")


class DAGCycleException(Exception):
    pass


def validate_dag(tasks: List[dict], dependencies: List[Tuple[str, str]]) -> List[str]:
    """
    Validates that the task graph is a Directed Acyclic Graph (DAG) using topological sorting.
    dependencies: list of (task_code, prerequisite_task_code) -> task_code depends on prerequisite
    Returns a topologically sorted order of task codes.
    Raises DAGCycleException if a cycle is detected.
    """
    task_codes = {t["task_code"] for t in tasks}
    in_degree = {code: 0 for code in task_codes}
    adjacency = defaultdict(list)

    for task, prereq in dependencies:
        if task in task_codes and prereq in task_codes:
            adjacency[prereq].append(task)
            in_degree[task] += 1

    queue = deque([code for code, deg in in_degree.items() if deg == 0])
    topological_order = []

    while queue:
        curr = queue.popleft()
        topological_order.append(curr)
        for neighbor in adjacency[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(topological_order) != len(task_codes):
        raise DAGCycleException("Circular dependency detected in decomposed task roadmap!")

    return topological_order


def calculate_dag_metrics(tasks: List[dict], dependencies: List[Tuple[str, str]]) -> dict:
    """
    Computes critical path depth, parallel track concurrency, and estimated sprint hours.
    Guarantees termination by first validating acyclicity with Kahn's algorithm and then
    computing the longest path via dynamic programming over the topological ordering in O(V+E).
    """
    if not tasks:
        return {
            "critical_path_depth": 0,
            "max_parallel_tracks": 0,
            "estimated_sprint_hours": 0.0,
            "total_task_count": 0
        }

    # Validate acyclicity first: raises DAGCycleException if graph is circular
    topological_order = validate_dag(tasks, dependencies)

    task_codes = {t["task_code"] for t in tasks}
    adjacency = defaultdict(list)

    for task, prereq in dependencies:
        if task in task_codes and prereq in task_codes:
            adjacency[prereq].append(task)

    # Dynamic programming along topological order guarantees longest path (critical path depth) in O(V+E)
    levels = {code: 1 for code in task_codes}
    for curr in topological_order:
        curr_lvl = levels[curr]
        for neighbor in adjacency[curr]:
            if curr_lvl + 1 > levels[neighbor]:
                levels[neighbor] = curr_lvl + 1

    critical_path_depth = max(levels.values()) if levels else 1
    level_counts = defaultdict(int)
    for code, lvl in levels.items():
        level_counts[lvl] += 1
    max_parallel_tracks = max(level_counts.values()) if level_counts else 1

    return {
        "critical_path_depth": critical_path_depth,
        "max_parallel_tracks": max_parallel_tracks,
        "estimated_sprint_hours": len(tasks) * 2.5,
        "total_task_count": len(tasks)
    }


def detect_project_domain(title: str, description: str) -> str:
    """Detects domain archetype from title and prompt text."""
    combined = (title + " " + description).lower()

    if any(k in combined for k in ["solidity", "defi", "arbitrage", "mempool", "uniswap", "smart contract", "token", "web3", "ethereum", "solana", "evm", "blockchain", "dao"]):
        return "web3"
    elif any(k in combined for k in ["crdt", "whiteboard", "canvas", "collaborative", "websocket", "realtime", "real-time", "ot", "presence", "multiplayer", "webrtc"]):
        return "crdt_realtime"
    elif any(k in combined for k in ["clinical", "health", "hipaa", "patient", "medical", "doctor", "hospital", "fda", "fhir", "hl7", "biotech"]):
        return "healthcare"
    elif any(k in combined for k in ["payment", "stripe", "ledger", "banking", "credit", "fraud", "invoice", "transaction", "checkout", "billing", "finance"]):
        return "fintech"
    elif any(k in combined for k in ["rag", "embedding", "llm", "gpt", "claude", "agent", "langchain", "llamaindex", "pytorch", "inference", "nlp", "semantic search"]):
        return "ai_rag"
    elif any(k in combined for k in ["mobile", "react native", "flutter", "ios", "android", "iot", "sensor", "mqtt", "telemetry", "bluetooth", "ble", "hardware"]):
        return "mobile_iot"
    elif any(k in combined for k in ["cli", "compiler", "linter", "ast", "devops", "infrastructure", "terraform", "kubernetes", "ci/cd", "monitoring", "ebpf", "profiler", "flamegraph"]):
        return "devtools"
    elif any(k in combined for k in ["ecommerce", "e-commerce", "store", "marketplace", "social", "feed", "chat", "recommendation", "catalog"]):
        return "ecommerce_social"
    return "general"


def decompose_project_idea(title: str, description: str) -> dict:
    """
    Decomposes ANY raw hackathon/project idea into structured, domain-accurate Epics,
    Tasks, mock API route specifications, required skill sets, and DAG dependencies.
    """
    domain = detect_project_domain(title, description)
    logger.info(f"Decomposing project '{title}' as domain: {domain}")

    if domain == "web3":
        epics_data = [
            {
                "title": "Epic 1: Smart Contracts & Mempool Listener",
                "description": "Develop core EVM/Solana contracts, liquidity pool routing, and pending transaction listeners.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "SOL-01",
                        "title": "Smart Contract Architecture & Flash Receiver",
                        "description": "Write and audit Solidity/Rust contracts for atomic swap execution with slippage guards.",
                        "required_skills": "Solidity, Hardhat, Foundry, Smart Contracts, Web3",
                        "api_route_spec": {
                            "path": "/api/v1/contracts/deployments",
                            "method": "GET",
                            "summary": "List deployed contract addresses and ABIs",
                            "response_mock": {"network": "mainnet-fork", "router_address": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "status": "verified"}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "MEM-02",
                        "title": "Mempool WebSocket Listener & RPC Stream",
                        "description": "Establish high-frequency WebSocket connection to Erigon/Geth nodes for pending swap mempool transactions.",
                        "required_skills": "Python, Web3.py, WebSockets, AsyncIO, RPC",
                        "api_route_spec": {
                            "path": "/api/v1/mempool/status",
                            "method": "GET",
                            "summary": "Mempool listener health and gas tracker",
                            "response_mock": {"listening": True, "latest_block": 21894012, "base_fee_gwei": 14.2}
                        },
                        "depends_on": ["SOL-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Arbitrage Detection & Pricing Matrix",
                "description": "Build sub-millisecond price discrepancy scanner across Uniswap v3, Sushiswap, and Curve.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "ARB-01",
                        "title": "Cross-DEX Pool Reserve Engine",
                        "description": "Maintain in-memory orderbook and constant product formula curve calculations.",
                        "required_skills": "Python, NumPy, Mathematical Modeling, DeFi Protocols",
                        "api_route_spec": {
                            "path": "/api/v1/arbitrage/opportunities",
                            "method": "GET",
                            "summary": "Active profitable arbitrage spreads",
                            "response_mock": {"opportunities": [{"pair": "WETH/USDC", "spread_bps": 42, "estimated_profit_usd": 128.50}], "timestamp": "2026-09-10T18:00:00Z"}
                        },
                        "depends_on": ["MEM-02"]
                    },
                    {
                        "task_code": "EXEC-02",
                        "title": "Atomic Bundle Execution & MEV Simulation",
                        "description": "Simulate transaction execution against Flashbots Builder endpoints to eliminate gas waste on reverts.",
                        "required_skills": "Python, Flashbots, Ethers.js, MEV, Cryptography",
                        "api_route_spec": {
                            "path": "/api/v1/bundle/simulate",
                            "method": "POST",
                            "summary": "Simulate Flashbots bundle execution",
                            "response_mock": {"simulated": True, "gas_used": 142000, "profit_net_eth": 0.048}
                        },
                        "depends_on": ["SOL-01", "ARB-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: Trader Terminal & Analytics UI",
                "description": "Build real-time dark mode cockpit with live PnL telemetry and wallet connectors.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Web3 Wallet Ingestion & Liquidity Charts",
                        "description": "Construct reactive trading terminal with wagmi/viem connector, pool depth charts, and transaction feeds.",
                        "required_skills": "React, TypeScript, Tailwind CSS, Wagmi, Ethers.js, UI/UX",
                        "api_route_spec": None,
                        "depends_on": ["SOL-01"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Live Execution Feed & Profit Dashboard",
                        "description": "Real-time WebSocket stream displaying mined arbitrage bundles and cumulative sprint PnL.",
                        "required_skills": "React, Framer Motion, WebSockets, Chart.js, Frontend Architecture",
                        "api_route_spec": None,
                        "depends_on": ["UI-01", "EXEC-02"]
                    }
                ]
            },
            {
                "title": "Epic 4: Hardhat Fork & CI Guardrails",
                "description": "Automated local mainnet forking, gas benchmark tests, and GitHub Actions PR validation.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Anvil / Hardhat Mainnet Fork Orchestration",
                        "description": "Configure multi-container Docker compose running local RPC fork with pre-seeded liquidity pool state.",
                        "required_skills": "Docker, Hardhat, Anvil, DevOps, Shell",
                        "api_route_spec": None,
                        "depends_on": ["SOL-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "Gas Optimization & Revert Gatekeeper CI",
                        "description": "Automate GitHub CI checks for contract gas thresholds and zero-slippage edge cases.",
                        "required_skills": "GitHub Actions, CI/CD, Foundry, Pytest",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "EXEC-02"]
                    }
                ]
            }
        ]

    elif domain == "crdt_realtime":
        epics_data = [
            {
                "title": "Epic 1: CRDT State & Synchronization Engine",
                "description": "Build decentralized Conflict-Free Replicated Data Type layer with sub-10ms state convergence.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "CRDT-01",
                        "title": "Yjs / Automerge Document Architecture",
                        "description": "Initialize conflict-free binary document models, delta compression, and undo/redo stacks.",
                        "required_skills": "CRDT, Yjs, Automerge, Algorithms, Data Structures",
                        "api_route_spec": {
                            "path": "/api/v1/crdt/snapshot",
                            "method": "GET",
                            "summary": "Fetch base document state vector",
                            "response_mock": {"doc_id": "sprint-canvas-01", "vector_clock": {"client_a": 42, "client_b": 38}, "nodes_count": 128}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "WS-02",
                        "title": "WebSocket Relay Server & Redis Pub/Sub",
                        "description": "Develop high-throughput room broadcast server with Redis pub/sub channel partitioning.",
                        "required_skills": "FastAPI, Python AsyncIO, WebSockets, Redis, Distributed Systems",
                        "api_route_spec": {
                            "path": "/api/v1/rooms/active",
                            "method": "GET",
                            "summary": "Active peer rooms and connection counts",
                            "response_mock": {"rooms": [{"room_id": "room_alpha", "peers": 4, "msg_rate_per_sec": 84}]}
                        },
                        "depends_on": ["CRDT-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Vector Canvas & Interaction Physics",
                "description": "High-performance 60 FPS infinite vector renderer with cursor broadcasting.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "CANVAS-01",
                        "title": "Infinite Canvas Vector Renderer (WebGL / Canvas)",
                        "description": "Build high-performance 2D drawing engine supporting infinite pan, zoom, Bezier smoothing, and shape snapping.",
                        "required_skills": "TypeScript, HTML5 Canvas, WebGL, Mathematical Geometry",
                        "api_route_spec": None,
                        "depends_on": ["CRDT-01"]
                    },
                    {
                        "task_code": "PRESENCE-02",
                        "title": "Multiplayer Cursor & Ephemeral Presence Matrix",
                        "description": "Broadcast peer mouse coordinates, user selections, and typing indicators at 30hz throttle.",
                        "required_skills": "React, WebSockets, TypeScript, Frontend Optimization",
                        "api_route_spec": {
                            "path": "/api/v1/presence/peers",
                            "method": "GET",
                            "summary": "Room peer roster & cursor positions",
                            "response_mock": {"peers": [{"id": "usr_alex", "color": "#00F0FF", "x": 420.5, "y": 210.0}]}
                        },
                        "depends_on": ["WS-02", "CANVAS-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: Asset Export & Snapshot Persistence",
                "description": "Server-side vector SVG/PNG rendering, cloud backup, and version history trees.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "PERSIST-01",
                        "title": "SQLite / S3 Canvas Snapshot Persistence",
                        "description": "Serialize CRDT binary update logs to local disk or S3 bucket for cold restart recovery.",
                        "required_skills": "Python, SQLite, S3, Serialization, Backend Architecture",
                        "api_route_spec": {
                            "path": "/api/v1/canvas/export",
                            "method": "POST",
                            "summary": "Export canvas snapshot to SVG/JSON",
                            "response_mock": {"export_url": "https://storage.daedalus.hack/export_123.svg", "size_kb": 34.2}
                        },
                        "depends_on": ["CRDT-01", "WS-02"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Collaborative Toolbar & Version History Scrubber",
                        "description": "Develop UI tool palette (Pen, Sticky, Vector Arrow, Eraser) and temporal state playback slider.",
                        "required_skills": "React, Tailwind CSS, Lucide Icons, UI/UX, State Management",
                        "api_route_spec": None,
                        "depends_on": ["CANVAS-01", "PRESENCE-02"]
                    }
                ]
            },
            {
                "title": "Epic 4: Concurrency Benchmarks & CI Pipeline",
                "description": "Multi-client load generator simulating 100 simultaneous writers and automated CI gates.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Multi-Client Concurrency Stress Harness",
                        "description": "Python headless bot swarm injecting 1,000 edits/sec to benchmark convergence speed.",
                        "required_skills": "Python, Locust, Docker, Performance Testing",
                        "api_route_spec": None,
                        "depends_on": ["WS-02"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "CRDT Invariant Verification & GitHub CI",
                        "description": "GitHub Actions workflow verifying mathematical state convergence under simulated network partitions.",
                        "required_skills": "GitHub Actions, CI/CD, Pytest, Bash",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "PERSIST-01"]
                    }
                ]
            }
        ]

    elif domain == "ai_rag":
        epics_data = [
            {
                "title": "Epic 1: Ingestion Pipeline & Hybrid Vector Index",
                "description": "Parse heterogeneous documents, generate dense embeddings, and configure hybrid BM25 + Vector index.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "INGEST-01",
                        "title": "Multi-Modal Document Chunking & Tokenizer",
                        "description": "Implement recursive character chunking with semantic overlap and metadata extraction.",
                        "required_skills": "Python, LangChain, LlamaIndex, NLP, Tokenization",
                        "api_route_spec": {
                            "path": "/api/v1/documents/upload",
                            "method": "POST",
                            "summary": "Upload and parse sprint document",
                            "response_mock": {"doc_id": "doc_9918", "chunks_created": 48, "status": "indexed"}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "VEC-02",
                        "title": "pgvector & HNSW High-Dimensional Indexing",
                        "description": "Configure PostgreSQL pgvector extension with HNSW index for sub-10ms cosine similarity queries.",
                        "required_skills": "PostgreSQL, pgvector, SQLAlchemy, Database Architecture",
                        "api_route_spec": {
                            "path": "/api/v1/vector/health",
                            "method": "GET",
                            "summary": "Vector database dimension & index status",
                            "response_mock": {"dimension": 384, "index_type": "HNSW", "total_vectors": 1420}
                        },
                        "depends_on": ["INGEST-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Retrieval Engine & Cross-Encoder Reranker",
                "description": "Execute hybrid semantic retrieval, apply cross-encoder reranking, and inject citations.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "RAG-01",
                        "title": "Hybrid Search Engine & Reciprocal Rank Fusion",
                        "description": "Combine dense cosine vectors with sparse BM25 keyword match using RRF score fusion.",
                        "required_skills": "Python, Information Retrieval, Search Algorithms, NumPy",
                        "api_route_spec": {
                            "path": "/api/v1/retrieval/query",
                            "method": "POST",
                            "summary": "Hybrid RAG search query",
                            "response_mock": {"matches": [{"chunk_id": "c1", "score": 0.94, "content": "Relevant document snippet"}], "latency_ms": 14}
                        },
                        "depends_on": ["VEC-02"]
                    },
                    {
                        "task_code": "AGENT-02",
                        "title": "LLM Reasoning Loop & Citation Synthesis",
                        "description": "Prompt orchestration with hallucination guards, streaming tokens, and verifiable source footnotes.",
                        "required_skills": "Python, OpenAI/Anthropic API, Prompt Engineering, Streaming",
                        "api_route_spec": {
                            "path": "/api/v1/ai/chat/stream",
                            "method": "POST",
                            "summary": "Stream synthesized AI answer with citations",
                            "response_mock": {"answer": "Synthesized AI response with [1] citations.", "sources": [{"id": 1, "doc": "Paper A"}]}
                        },
                        "depends_on": ["RAG-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: AI Chat Workspace & Source Inspector UI",
                "description": "Dark-mode chat interface with markdown code rendering, citation hovercards, and latency telemetry.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Streaming Chat UI & Markdown Syntax Highlighting",
                        "description": "Build responsive conversation thread with streaming SSE tokens, copy buttons, and LaTeX KaTeX math.",
                        "required_skills": "React, TypeScript, Tailwind CSS, SSE, UI/UX",
                        "api_route_spec": None,
                        "depends_on": ["VEC-02"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Interactive Citation Drawer & Source Inspector",
                        "description": "Develop slide-over modal highlighting original source chunk text and confidence scores.",
                        "required_skills": "React, Framer Motion, TypeScript, UI Components",
                        "api_route_spec": None,
                        "depends_on": ["UI-01", "AGENT-02"]
                    }
                ]
            },
            {
                "title": "Epic 4: RAG Evaluation Benchmark & CI Deployment",
                "description": "Ragas evaluation harness for context precision, faithfulness, and automated Docker orchestration.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Containerized RAG Stack with Local pgvector",
                        "description": "Multi-stage Dockerfile bundling FastAPI backend, pgvector database, and frontend client.",
                        "required_skills": "Docker, Docker Compose, Linux, DevOps",
                        "api_route_spec": None,
                        "depends_on": ["VEC-02"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "RAGAS Evaluation Gatekeeper CI Workflow",
                        "description": "Automated GitHub CI test suite enforcing minimum 85% faithfulness and answer relevance scores.",
                        "required_skills": "GitHub Actions, CI/CD, Pytest, Python",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "AGENT-02"]
                    }
                ]
            }
        ]

    elif domain == "healthcare":
        epics_data = [
            {
                "title": "Epic 1: HIPAA Compliance & FHIR Data Modeling",
                "description": "Establish HIPAA-compliant encrypted storage, audit logging, and FHIR resource schemas.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "FHIR-01",
                        "title": "FHIR Schema Definition & Encrypted DB",
                        "description": "Implement patient/observation models with AES-256 field-level encryption and strict audit logging.",
                        "required_skills": "PostgreSQL, SQLAlchemy, Cryptography, Python, HIPAA",
                        "api_route_spec": {
                            "path": "/api/v1/patients",
                            "method": "POST",
                            "summary": "Create encrypted patient profile",
                            "response_mock": {"patient_id": "pt_9918", "status": "active", "encryption": "AES-256"}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "AUTH-02",
                        "title": "Role-Based Access Control & Audit Trails",
                        "description": "Implement OAuth2 / BAA compliant access guardrails with immutable audit log trails.",
                        "required_skills": "FastAPI, JWT, Security, OAuth2, RBAC",
                        "api_route_spec": {
                            "path": "/api/v1/auth/audit",
                            "method": "GET",
                            "summary": "Retrieve immutable access logs",
                            "response_mock": {"events_logged": 12, "integrity": "verified"}
                        },
                        "depends_on": ["FHIR-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Clinical Ingestion & Telemetry Processing",
                "description": "Parse medical observation feeds, normalize telemetry, and execute triage alerting.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "CLINIC-01",
                        "title": "Vitals Stream Normalization & HL7 Parser",
                        "description": "Process incoming HL7/vitals data streams and trigger alerts on abnormal readings.",
                        "required_skills": "Python, Redis, HL7, Data Pipelines, AsyncIO",
                        "api_route_spec": {
                            "path": "/api/v1/vitals/stream",
                            "method": "POST",
                            "summary": "Ingest real-time patient vitals packet",
                            "response_mock": {"status": "ingested", "triage_score": "normal", "heart_rate": 72}
                        },
                        "depends_on": ["FHIR-01"]
                    },
                    {
                        "task_code": "ALERT-02",
                        "title": "Critical Triage & Escalation Dispatcher",
                        "description": "Automate priority routing of critical patient events via push notifications and SMS.",
                        "required_skills": "Python, WebSockets, Celery, Twilio, Redis",
                        "api_route_spec": None,
                        "depends_on": ["CLINIC-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: Provider Portal & Patient Graph Dashboard",
                "description": "Build high-accessibility clinical interface for physicians to inspect longitudinal patient histories.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Longitudinal Patient History & Timeline",
                        "description": "Interactive React dashboard rendering FHIR observations, lab results, and timeline graphs.",
                        "required_skills": "React, TypeScript, TailwindCSS, Chart.js, Frontend Architecture",
                        "api_route_spec": None,
                        "depends_on": ["CLINIC-01", "AUTH-02"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Physician Note Collaboration & Prescriptions",
                        "description": "Secure clinician note editor with real-time prescription review and signing.",
                        "required_skills": "React, TypeScript, TailwindCSS, State Management",
                        "api_route_spec": None,
                        "depends_on": ["UI-01"]
                    }
                ]
            },
            {
                "title": "Epic 4: De-Identification & HIPAA Audit CI",
                "description": "Configure automated de-identification pipelines and GitHub Actions compliance verification.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "PHI De-Identification Masking Pipeline",
                        "description": "Implement automated scrubber that sanitizes PHI/PII before analytics ingestion.",
                        "required_skills": "Python, Regex, Docker, Data Engineering",
                        "api_route_spec": None,
                        "depends_on": ["FHIR-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "HIPAA Compliance & Pen-Test Gate CI",
                        "description": "GitHub Actions workflow running automated dependency auditing, TLS verification, and penetration tests.",
                        "required_skills": "GitHub Actions, CI/CD, Pytest, Security Auditing",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "UI-02"]
                    }
                ]
            }
        ]

    elif domain == "fintech":
        epics_data = [
            {
                "title": "Epic 1: Double-Entry Ledger & Idempotency Vault",
                "description": "Implement ACID double-entry accounting ledger with distributed idempotency keys.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "LEDGER-01",
                        "title": "Double-Entry Schema & Balance Invariant Engine",
                        "description": "Write immutable ledger entries enforcing sum(debit) == sum(credit) with pessimistic locking.",
                        "required_skills": "PostgreSQL, SQLAlchemy, Financial Modeling, Database Architecture",
                        "api_route_spec": {
                            "path": "/api/v1/ledger/transactions",
                            "method": "POST",
                            "summary": "Record double-entry ledger transaction",
                            "response_mock": {"tx_id": "tx_4412", "status": "settled", "balanced": True}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "IDEMP-02",
                        "title": "Distributed Idempotency & Replay Guard",
                        "description": "Build Redis-backed idempotency key verification middleware to prevent double charges.",
                        "required_skills": "FastAPI, Redis, Python, Distributed Systems, Middleware",
                        "api_route_spec": {
                            "path": "/api/v1/ledger/accounts/{id}/balance",
                            "method": "GET",
                            "summary": "Fetch verified settled balance",
                            "response_mock": {"account_id": "acc_01", "balance_cents": 500000, "currency": "USD"}
                        },
                        "depends_on": ["LEDGER-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Payment Rail Ingestion & Settlement",
                "description": "Process external payment webhooks (Stripe / ACH) and manage automated clearing settlement.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "PAY-01",
                        "title": "Payment Gateway Ingestion & Webhooks",
                        "description": "Handle Stripe / ACH payout webhooks with cryptographic signature verification and DLQ.",
                        "required_skills": "FastAPI, Stripe, Cryptography, Webhooks, Python",
                        "api_route_spec": {
                            "path": "/api/v1/payments/webhook",
                            "method": "POST",
                            "summary": "Payment provider webhook receiver",
                            "response_mock": {"status": "received", "event_id": "evt_99182"}
                        },
                        "depends_on": ["IDEMP-02"]
                    },
                    {
                        "task_code": "RECON-02",
                        "title": "Automated Reconciliation & Dispute Engine",
                        "description": "Nightly batch job matching bank settlement files against internal ledger transactions.",
                        "required_skills": "Python, Celery, Pandas, SQL, Batch Processing",
                        "api_route_spec": None,
                        "depends_on": ["PAY-01", "LEDGER-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: Real-Time Cashflow & Merchant Terminal",
                "description": "Real-time dashboard displaying settlement pipelines, cashflow velocity, and dispute management.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Ledger Balance & Cashflow Sankey Graph",
                        "description": "Interactive React dashboard rendering multi-currency balances and real-time cashflow graphs.",
                        "required_skills": "React, TypeScript, TailwindCSS, Chart.js, D3",
                        "api_route_spec": None,
                        "depends_on": ["IDEMP-02", "PAY-01"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Transaction Drill-Down & Dispute Workflow",
                        "description": "Slide-over transaction inspection panel with evidence upload and refund issuance.",
                        "required_skills": "React, TypeScript, TailwindCSS, State Management",
                        "api_route_spec": None,
                        "depends_on": ["UI-01"]
                    }
                ]
            },
            {
                "title": "Epic 4: PCI-DSS Compliance & Financial CI",
                "description": "Enforce strict financial invariants, rounding edge-cases, and automated audit CI pipelines.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Tokenized Cardholder Data Vault & Isolation",
                        "description": "Isolate cardholder data environment (CDE) with strict network egress policies and tokenization.",
                        "required_skills": "Docker, DevOps, Security, PCI-DSS, Shell",
                        "api_route_spec": None,
                        "depends_on": ["LEDGER-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "Financial Invariant & Rounding Verification CI",
                        "description": "Automate GitHub CI tests running thousands of fuzzing transactions verifying zero penny leaks.",
                        "required_skills": "GitHub Actions, CI/CD, Pytest, Python",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "RECON-02"]
                    }
                ]
            }
        ]

    elif domain == "devtools":
        epics_data = [
            {
                "title": "Epic 1: AST Parser & Semantic Graph Engine",
                "description": "Construct high-performance code parsing, syntax tree traversal, and dependency graph analysis.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "AST-01",
                        "title": "Tree-sitter Grammar & Multi-Language Parser",
                        "description": "Implement multi-language AST extraction pipeline supporting Python, TypeScript, and Go.",
                        "required_skills": "Python, Tree-sitter, Compilers, AST, Algorithms",
                        "api_route_spec": {
                            "path": "/api/v1/ast/parse",
                            "method": "POST",
                            "summary": "Parse source file into AST nodes",
                            "response_mock": {"nodes_count": 340, "languages": ["typescript"], "status": "parsed"}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "GRAPH-02",
                        "title": "Call Graph & Dependency Invariant Analysis",
                        "description": "Build directed graph representation of symbol declarations, call chains, and import cycles.",
                        "required_skills": "Algorithms, Graph Theory, Python, Data Structures",
                        "api_route_spec": {
                            "path": "/api/v1/ast/graph",
                            "method": "GET",
                            "summary": "Retrieve project symbol call graph",
                            "response_mock": {"nodes": 52, "edges": 118, "cycles": 0}
                        },
                        "depends_on": ["AST-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: CLI Runner & Language Server Daemon",
                "description": "Develop ultra-fast developer CLI and LSP server with incremental diagnostics caching.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "CLI-01",
                        "title": "Zero-Config CLI Runner & Config Engine",
                        "description": "Build snappy terminal interface with colorized error reporting and auto-fix capabilities.",
                        "required_skills": "Python, Click, Rich, Shell, CLI Architecture",
                        "api_route_spec": None,
                        "depends_on": ["AST-01"]
                    },
                    {
                        "task_code": "LSP-02",
                        "title": "LSP Diagnostics Daemon & Cache",
                        "description": "Implement Language Server Protocol daemon with sub-15ms incremental cache invalidation.",
                        "required_skills": "Python, AsyncIO, LSP, IPC, Caching",
                        "api_route_spec": {
                            "path": "/api/v1/daemon/status",
                            "method": "GET",
                            "summary": "LSP daemon health and cache size",
                            "response_mock": {"status": "active", "indexed_files": 142, "cache_hit_rate": 0.94}
                        },
                        "depends_on": ["GRAPH-02", "CLI-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: Webview Visualizer & Flamegraph Canvas",
                "description": "Visual dashboard rendering interactive call graphs, complexity metrics, and performance flamegraphs.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Interactive Call Graph & Dependency Canvas",
                        "description": "Interactive SVG / Canvas visualizer for symbol dependencies with zoom and filter controls.",
                        "required_skills": "React, TypeScript, D3, Canvas, TailwindCSS",
                        "api_route_spec": None,
                        "depends_on": ["GRAPH-02"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Code Diagnostics & Profiler Flamegraph",
                        "description": "Detailed inspection panel displaying lint errors, memory profile flamegraphs, and diff views.",
                        "required_skills": "React, TypeScript, TailwindCSS, Monaco Editor",
                        "api_route_spec": None,
                        "depends_on": ["UI-01", "LSP-02"]
                    }
                ]
            },
            {
                "title": "Epic 4: Performance Benchmarking & Multi-OS CI",
                "description": "Continuous benchmarking against massive repositories and cross-platform packaging.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Automated Regressions & Benchmark Harness",
                        "description": "Create automated performance benchmark testing parser throughput and memory limits.",
                        "required_skills": "Python, Pytest, Benchmarking, Linux",
                        "api_route_spec": None,
                        "depends_on": ["AST-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "Cross-Platform Packaging & Release CI",
                        "description": "GitHub Actions matrix building single-binary distributions for Linux, macOS, and Windows.",
                        "required_skills": "GitHub Actions, CI/CD, PyInstaller, Docker",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "CLI-01"]
                    }
                ]
            }
        ]

    elif domain == "mobile_iot":
        epics_data = [
            {
                "title": "Epic 1: Edge Telemetry & MQTT Broker",
                "description": "High-throughput sensor ingestion, Protobuf deserialization, and low-latency message broker.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "MQTT-01",
                        "title": "MQTT Broker Setup & Telemetry Handler",
                        "description": "Configure MQTT broker with TLS authentication and sensor payload validation.",
                        "required_skills": "MQTT, Python, Networking, IoT, Linux",
                        "api_route_spec": {
                            "path": "/api/v1/devices/telemetry",
                            "method": "POST",
                            "summary": "Ingest telemetry packet from device",
                            "response_mock": {"status": "received", "device_id": "iot_dev_01", "seq": 1024}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "PROTO-02",
                        "title": "Protobuf Decoding & Time-Series Storage",
                        "description": "Decode binary protobuf payloads and stream time-series metrics to PostgreSQL/TimescaleDB.",
                        "required_skills": "Protobuf, PostgreSQL, SQLAlchemy, Python, Time-Series",
                        "api_route_spec": {
                            "path": "/api/v1/devices/{id}/metrics",
                            "method": "GET",
                            "summary": "Fetch historical sensor telemetry",
                            "response_mock": {"device_id": "iot_dev_01", "readings_count": 60, "metric": "temperature"}
                        },
                        "depends_on": ["MQTT-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Device Fleet Management & Firmware OTA",
                "description": "Track connected devices, heartbeat monitoring, and cryptographic OTA firmware updates.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "FLEET-01",
                        "title": "Device Registry & Heartbeat Monitor",
                        "description": "Maintain real-time device connection state, offline detection, and telemetry quotas.",
                        "required_skills": "FastAPI, Redis, WebSockets, Python, Distributed Systems",
                        "api_route_spec": {
                            "path": "/api/v1/devices/registry",
                            "method": "GET",
                            "summary": "List active registered devices and connection status",
                            "response_mock": {"total": 24, "online": 22, "offline": 2}
                        },
                        "depends_on": ["MQTT-01"]
                    },
                    {
                        "task_code": "OTA-02",
                        "title": "Cryptographic Firmware OTA Pipeline",
                        "description": "Sign firmware binaries with Ed25519 and manage staggered over-the-air deployment waves.",
                        "required_skills": "Python, Cryptography, AWS S3, Security, Firmware",
                        "api_route_spec": None,
                        "depends_on": ["FLEET-01", "PROTO-02"]
                    }
                ]
            },
            {
                "title": "Epic 3: Device Fleet Map & Real-Time Telemetry",
                "description": "Interactive mobile-responsive console for field engineers to inspect live devices and sensor feeds.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Live Sensor Gauges & Real-Time Canvas",
                        "description": "React dashboard with sub-50ms WebSocket telemetry gauges, sparklines, and device controls.",
                        "required_skills": "React, TypeScript, WebSockets, Chart.js, TailwindCSS",
                        "api_route_spec": None,
                        "depends_on": ["FLEET-01", "PROTO-02"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Geofence Map & Device Alert Drawer",
                        "description": "Interactive Leaflet / Mapbox map rendering device coordinates, signal strength, and alerts.",
                        "required_skills": "React, TypeScript, Leaflet, Mapbox, TailwindCSS",
                        "api_route_spec": None,
                        "depends_on": ["UI-01"]
                    }
                ]
            },
            {
                "title": "Epic 4: Device Simulation & Embedded CI",
                "description": "Simulated hardware fleet for automated load testing and network partition recovery verification.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Virtual Sensor Fleet Emulator",
                        "description": "Dockerized sensor simulator generating realistic fluctuating telemetry for 100+ concurrent devices.",
                        "required_skills": "Docker, Python, AsyncIO, Simulation",
                        "api_route_spec": None,
                        "depends_on": ["MQTT-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "Network Partition & Jitter Resiliency CI",
                        "description": "GitHub Actions workflow simulating flaky edge connections and verifying message deduplication.",
                        "required_skills": "GitHub Actions, CI/CD, Pytest, Chaos Engineering",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "OTA-02"]
                    }
                ]
            }
        ]

    elif domain == "ecommerce_social":
        epics_data = [
            {
                "title": "Epic 1: Product Catalog & Distributed Inventory",
                "description": "Construct high-throughput product catalog, semantic search, and optimistic lock inventory decrement.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "CATALOG-01",
                        "title": "Catalog Schema & Full-Text Search",
                        "description": "Model multi-variant SKU attributes with PostgreSQL full-text search and faceted filtering.",
                        "required_skills": "PostgreSQL, SQLAlchemy, Full-Text Search, Python, Database Architecture",
                        "api_route_spec": {
                            "path": "/api/v1/products",
                            "method": "GET",
                            "summary": "Search products with faceted filters",
                            "response_mock": {"total": 48, "items": [{"id": "prod_1", "name": "Sprint Deck T-Shirt", "price_cents": 2800}]}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "STOCK-02",
                        "title": "Optimistic Locking & Flash Inventory Decrement",
                        "description": "Implement race-condition-free stock reservations using Redis distributed locks and DB versioning.",
                        "required_skills": "Redis, Python, Distributed Systems, Concurrency",
                        "api_route_spec": {
                            "path": "/api/v1/cart/reserve",
                            "method": "POST",
                            "summary": "Reserve inventory for checkout session",
                            "response_mock": {"reservation_id": "res_881", "expires_in": 600, "status": "reserved"}
                        },
                        "depends_on": ["CATALOG-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Social Graph & Activity Feed Engine",
                "description": "Build high-speed follow graphs, fan-out activity streams, and real-time social engagement.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "FEED-01",
                        "title": "Fan-Out Activity Timeline Engine",
                        "description": "Build Redis timeline cache pushing creator drops and reviews to followers in real time.",
                        "required_skills": "Redis, FastAPI, Celery, Python, Caching",
                        "api_route_spec": {
                            "path": "/api/v1/feed/home",
                            "method": "GET",
                            "summary": "Retrieve personalized social feed",
                            "response_mock": {"feed_id": "feed_01", "stories_count": 8, "unread": True}
                        },
                        "depends_on": ["CATALOG-01"]
                    },
                    {
                        "task_code": "ENGAGE-02",
                        "title": "Social Reactions & Real-Time Counters",
                        "description": "Optimized hyperloglog counters for likes, bookmarks, and live stream comments.",
                        "required_skills": "WebSockets, Redis, Python, Real-Time Data",
                        "api_route_spec": None,
                        "depends_on": ["FEED-01", "STOCK-02"]
                    }
                ]
            },
            {
                "title": "Epic 3: Storefront UI & Live Drop Checkout",
                "description": "Modern high-converting shopping experience with instant cart slide-over and live drop presence.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Dynamic Product Grid & Filter Drawer",
                        "description": "Responsive React catalog with instant debounced search, tag filtering, and infinite scroll.",
                        "required_skills": "React, TypeScript, TailwindCSS, State Management, Frontend Architecture",
                        "api_route_spec": None,
                        "depends_on": ["CATALOG-01"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Instant Checkout & Stripe Elements Integration",
                        "description": "Stripe embedded checkout modal with coupon redemption and live order confirmation.",
                        "required_skills": "React, Stripe Elements, TypeScript, TailwindCSS",
                        "api_route_spec": None,
                        "depends_on": ["UI-01", "STOCK-02"]
                    }
                ]
            },
            {
                "title": "Epic 4: Load Testing & Edge Invalidation CI",
                "description": "Simulate viral flash sales, measure database lock contention, and verify cache invalidation.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "CDN Edge Caching & Cache Invalidation",
                        "description": "Configure reverse proxy caching rules with instantaneous surrogate-key purge webhooks.",
                        "required_skills": "Nginx, Redis, DevOps, Caching, Docker",
                        "api_route_spec": None,
                        "depends_on": ["CATALOG-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "Flash-Sale Concurrency Benchmark CI",
                        "description": "Locust load testing suite simulating 500 concurrent buyers competing for 10 items without overselling.",
                        "required_skills": "GitHub Actions, CI/CD, Locust, Pytest, Python",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "UI-02"]
                    }
                ]
            }
        ]

    else:
        # General / Custom High-Velocity Architecture
        epics_data = [
            {
                "title": "Epic 1: Core Architecture & Data Modeling",
                "description": "Establish baseline system architecture, relational/document schemas, and developer authentication.",
                "order_index": 1,
                "tasks": [
                    {
                        "task_code": "CORE-01",
                        "title": "Database Schema & Migration Setup",
                        "description": f"Initialize database models, foreign keys, and migration scripts for {title}.",
                        "required_skills": "PostgreSQL, SQLAlchemy, Alembic, Database Architecture",
                        "api_route_spec": {
                            "path": "/api/v1/health",
                            "method": "GET",
                            "summary": "Health check & DB connectivity",
                            "response_mock": {"status": "healthy", "service": title, "database": "connected"}
                        },
                        "depends_on": []
                    },
                    {
                        "task_code": "CORE-02",
                        "title": "Developer Authentication & Session Guard",
                        "description": "Implement JWT session management, RBAC authorization, and API key validation.",
                        "required_skills": "FastAPI, Python, JWT, Security, Cryptography",
                        "api_route_spec": {
                            "path": "/api/v1/auth/token",
                            "method": "POST",
                            "summary": "Issue session token",
                            "response_mock": {"access_token": "mock_jwt_token_sample", "token_type": "bearer", "expires_in": 86400}
                        },
                        "depends_on": ["CORE-01"]
                    }
                ]
            },
            {
                "title": "Epic 2: Core Domain Engine & Business APIs",
                "description": "Build high-throughput CRUD pipelines, domain calculation logic, and event handlers.",
                "order_index": 2,
                "tasks": [
                    {
                        "task_code": "API-01",
                        "title": "Primary Business Logic & Resource Pipeline",
                        "description": f"Develop high-throughput REST endpoints and data transformations for {title}.",
                        "required_skills": "FastAPI, Pydantic, Python AsyncIO, REST APIs",
                        "api_route_spec": {
                            "path": "/api/v1/resources",
                            "method": "GET",
                            "summary": "Query domain resources",
                            "response_mock": {"items": [{"id": "1", "name": f"Sample {title} Entity"}], "total": 1}
                        },
                        "depends_on": ["CORE-01"]
                    },
                    {
                        "task_code": "ENG-02",
                        "title": "Async Processing & Background Queue",
                        "description": "Implement asynchronous background tasks, event broadcasting, and state caching.",
                        "required_skills": "Python, Redis, Celery/AsyncIO, Distributed Systems",
                        "api_route_spec": {
                            "path": "/api/v1/tasks/dispatch",
                            "method": "POST",
                            "summary": "Dispatch async processing job",
                            "response_mock": {"job_id": "job_88291", "status": "queued"}
                        },
                        "depends_on": ["CORE-01", "API-01"]
                    }
                ]
            },
            {
                "title": "Epic 3: Interactive Frontend & State Management",
                "description": "Construct high-density dark UI layout, reactive component hierarchy, and live state updates.",
                "order_index": 3,
                "tasks": [
                    {
                        "task_code": "UI-01",
                        "title": "Application Shell & Dark Navigation Layout",
                        "description": "Build responsive application shell with Tailwind CSS, header controls, and sidebar routing.",
                        "required_skills": "React, Vite, Tailwind CSS, TypeScript, UI/UX",
                        "api_route_spec": None,
                        "depends_on": ["CORE-02"]
                    },
                    {
                        "task_code": "UI-02",
                        "title": "Interactive Management Cockpit & Real-Time Views",
                        "description": "Develop data visualization widgets, interactive state tables, and real-time polling.",
                        "required_skills": "React, Framer Motion, TypeScript, State Management",
                        "api_route_spec": None,
                        "depends_on": ["UI-01", "API-01"]
                    }
                ]
            },
            {
                "title": "Epic 4: Infrastructure, Docker & Automated CI",
                "description": "Multi-stage container orchestration and automated GitHub Actions verification.",
                "order_index": 4,
                "tasks": [
                    {
                        "task_code": "OPS-01",
                        "title": "Docker Compose Multi-Container Orchestration",
                        "description": "Create production-ready Dockerfiles for client and server with volume caching.",
                        "required_skills": "Docker, Docker Compose, Linux, Nginx, DevOps",
                        "api_route_spec": None,
                        "depends_on": ["CORE-01"]
                    },
                    {
                        "task_code": "OPS-02",
                        "title": "GitHub Actions CI/CD Verification Workflow",
                        "description": "Configure GitHub Actions pipeline to run tests, linting, and webhook notifications on push/PR.",
                        "required_skills": "GitHub Actions, CI/CD, Pytest, Bash",
                        "api_route_spec": None,
                        "depends_on": ["OPS-01", "API-01"]
                    }
                ]
            }
        ]

    # Extract all tasks & flatten dependencies for DAG verification
    all_tasks = []
    dependencies = []
    for epic in epics_data:
        for task in epic["tasks"]:
            all_tasks.append(task)
            for prereq in task["depends_on"]:
                dependencies.append((task["task_code"], prereq))

    # Validate DAG (ensure no cycles)
    sorted_order = validate_dag(all_tasks, dependencies)
    metrics = calculate_dag_metrics(all_tasks, dependencies)
    logger.info(f"DAG validated successfully. Topological order: {sorted_order}. Metrics: {metrics}")

    return {
        "title": title,
        "description": description,
        "domain": domain,
        "epics": epics_data,
        "topological_order": sorted_order,
        "metrics": metrics
    }


def split_task_in_dag(
    original_task: dict,
    strategy: str = "frontend_backend",
    custom_subtasks: Optional[List[dict]] = None
) -> List[dict]:
    """
    Splits an existing task into two or more parallelized subtasks based on the chosen strategy.
    Strategies:
    - 'frontend_backend': Subtask A (Frontend UI) + Subtask B (Backend API Contract)
    - 'logic_testing': Subtask A (Core Implementation) + Subtask B (Test Suite & CI)
    - 'parallel_micro': Subtask A (Track Alpha) + Subtask B (Track Beta)
    - 'custom': User-defined subtask specifications
    """
    code = original_task.get("task_code", "TASK-01")
    title = original_task.get("title", "Task")
    skills = original_task.get("required_skills", "Fullstack")
    spec = original_task.get("api_route_spec")

    if strategy == "frontend_backend":
        return [
            {
                "task_code": f"{code}a",
                "title": f"[UI] {title} — Client Interface & State",
                "description": f"Build responsive front-end components, forms, and interactive views for '{title}'. Consume contract mock endpoint.",
                "required_skills": "React, TypeScript, Tailwind CSS, UI/UX, State Management",
                "api_route_spec": None,
                "depends_on": original_task.get("depends_on", [])
            },
            {
                "task_code": f"{code}b",
                "title": f"[API] {title} — Backend Endpoint & Data Schema",
                "description": f"Implement backend route, database queries, and validation schemas for '{title}'. Guarantee contract response.",
                "required_skills": "FastAPI, Python, Pydantic, Database Architecture, REST API",
                "api_route_spec": spec or {
                    "path": f"/api/v1/{code.lower().replace('-', '_')}/execute",
                    "method": "POST",
                    "summary": f"API contract for {title}",
                    "response_mock": {"status": "success", "task": code}
                },
                "depends_on": original_task.get("depends_on", [])
            }
        ]
    elif strategy == "logic_testing":
        return [
            {
                "task_code": f"{code}a",
                "title": f"[Core] {title} — Primary Implementation",
                "description": f"Core domain logic and functional execution flow for '{title}'.",
                "required_skills": skills,
                "api_route_spec": spec,
                "depends_on": original_task.get("depends_on", [])
            },
            {
                "task_code": f"{code}b",
                "title": f"[Test] {title} — Unit & Integration Test Suite",
                "description": f"Automated test coverage, edge cases, and CI assertions for '{title}'.",
                "required_skills": "Pytest, Jest, CI/CD, Quality Assurance",
                "api_route_spec": None,
                "depends_on": [f"{code}a"]
            }
        ]
    elif strategy == "custom" and custom_subtasks:
        result = []
        for idx, sub in enumerate(custom_subtasks):
            letter = chr(ord('a') + idx)
            result.append({
                "task_code": f"{code}{letter}",
                "title": sub.get("title", f"Subtask {letter.upper()}"),
                "description": sub.get("description", original_task.get("description", "")),
                "required_skills": sub.get("required_skills", skills),
                "api_route_spec": sub.get("api_route_spec"),
                "depends_on": sub.get("depends_on", original_task.get("depends_on", []))
            })
        return result
    else:  # parallel_micro
        return [
            {
                "task_code": f"{code}a",
                "title": f"[Part 1] {title} — Core Engine",
                "description": f"First parallel partition for '{title}'.",
                "required_skills": skills,
                "api_route_spec": spec,
                "depends_on": original_task.get("depends_on", [])
            },
            {
                "task_code": f"{code}b",
                "title": f"[Part 2] {title} — Extension & Integration",
                "description": f"Second parallel partition for '{title}'.",
                "required_skills": skills,
                "api_route_spec": None,
                "depends_on": original_task.get("depends_on", [])
            }
        ]


def match_best_assignee(task_skills_text: str, available_users: List[dict]) -> Optional[str]:
    """
    Matches the best suited user for a given task using cosine similarity
    between the task's required skills and the users' skill vectors.
    """
    if not available_users:
        return None

    task_vec = compute_deterministic_embedding(task_skills_text)
    best_user_id = None
    best_score = -1.0

    for user in available_users:
        user_skills = user.get("skills", [])
        user_best_score = 0.0
        for skill in user_skills:
            score = cosine_similarity(task_vec, skill.get("embedding", []))
            if score > user_best_score:
                user_best_score = score

        if user_best_score > best_score:
            best_score = user_best_score
            best_user_id = user["id"]

    return best_user_id

