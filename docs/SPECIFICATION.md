# Daedalus AI: Complete System & Website Architecture Specification

This document provides the exhaustive specification for **Daedalus AI**, covering the design system, branding, React Router DOM v6 structure, developer-centric landing page blueprint, and core component specifications.

---

## 1. Design System & Immersion Specification

### A. Color Palette & Theming Tokens

| Token Name | Hex / RGBA | Role & Application |
| :--- | :--- | :--- |
| `--bg-space-950` | `#060911` | Deepest foundation, terminal backdrop, dropdown wells |
| `--bg-space-900` | `#0B0F19` | Primary viewport background (Deep Space Slate) |
| `--bg-space-850` | `#101524` | Elevated surfaces, floating panels, tooltips |
| `--surface-glass` | `rgba(255, 255, 255, 0.03)` | Frosted glass cards, Kanban columns, side drawers |
| `--border-glass` | `rgba(255, 255, 255, 0.08)` | Default 1px borders for cards and dividers |
| `--border-glass-hover` | `rgba(0, 240, 255, 0.35)` | Active/hover state border glow |
| `--accent-cyan` | `#00F0FF` | Electric Cyan: Primary action CTA, links, laser vectors |
| `--accent-violet` | `#8B5CF6` | Neon Violet: Epic hubs, secondary accents, AI triggers |
| `--status-green` | `#00FF88` | Neon Green: CI Passed, complete status, online telemetry |
| `--status-amber` | `#FFB800` | Cyber Amber: In-review status, warnings, compiler logs |
| `--status-rose` | `#FF3366` | Neon Rose: Blocked dependencies, CI failure, syntax errors |

### B. Glassmorphism CSS Architecture

```css
/* Glass Layer Level 1: Standard Card */
.glass-surface {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45);
}

/* Glass Layer Level 2: Interactive Floating Panel */
.glass-surface-elevated {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.6), 0 0 24px -4px rgba(0, 240, 255, 0.12);
}

/* Conic Border Animation for Primary CTAs */
.conic-border-glow {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  padding: 1.5px;
}
.conic-border-glow::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(transparent, #00F0FF, #8B5CF6, transparent 45%);
  animation: spin 3.5s linear infinite;
}
```

### C. Typography Rules
- **UI & Display Headers**: `Plus Jakarta Sans` or `Geist` (`300`, `500`, `700`, `800` weights). Strict tracking `-0.02em` for headlines to achieve the dense, mechanical look seen in Linear and Vercel.
- **Monospace Elements**: `JetBrains Mono` (`400`, `500`, `600` weights). Strictly enforced for:
  - Task codes (e.g., `CORE-01`, `API-04`)
  - Git commit hashes (e.g., `a1b2c3d`)
  - Route specifications (e.g., `GET /api/v1/auth/login`)
  - Terminal logs and metric percentages.

---

## 2. Logo & Favicon Concepts

### Concept 1: "The Isometric DAG Vertex" (The Labyrinth Node)
- **Concept**: Daedalus is the mythological master builder who engineered the Cretan Labyrinth. In computer science, a conflict-free project plan is a **Directed Acyclic Graph (DAG)**. This logo depicts an isometric 3D coordinate node where three directional paths intersect at a glowing terminal vertex.
- **Metaphor**: A single source of truth routing multiple parallel engineering tasks.
- **Vector Code**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="48" height="48">
  <defs>
    <linearGradient id="dagCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Isometric Hex Grid Background -->
  <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" fill="rgba(11,15,25,0.85)" />
  <!-- Three Converging Laser DAG Edges -->
  <line x1="24" y1="4" x2="24" y2="24" stroke="url(#dagCyan)" stroke-width="2.5" stroke-linecap="round" />
  <line x1="42" y1="34" x2="24" y2="24" stroke="url(#dagCyan)" stroke-width="2.5" stroke-linecap="round" />
  <line x1="6" y1="34" x2="24" y2="24" stroke="url(#dagCyan)" stroke-width="2.5" stroke-linecap="round" />
  <!-- Central Glowing Vertex Node -->
  <circle cx="24" cy="24" r="5" fill="#00F0FF" filter="url(#nodeGlow)" />
  <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
</svg>
```

### Concept 2: "The Syntax Monogram" (`//>` and `_`)
- **Concept**: Combines developer code comments (`//`), compiler terminal prompts (`>`), and the active cursor underscore (`_`) into an abstract glyph forming the letter **'D'**.
- **Favicon Vector (32x32)**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="32" height="32">
  <rect width="32" height="32" rx="8" fill="#060911" />
  <path d="M7 6L14 26" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" />
  <path d="M12 6L19 26" stroke="#00F0FF" stroke-width="3" stroke-linecap="round" />
  <path d="M19 16L25 21L19 26" stroke="#00FF88" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="27" cy="11" r="2" fill="#00F0FF" />
</svg>
```

---

## 3. App Architecture & Routing Structure

### Routing Architecture (React Router v6+)

```tsx
// src/router.tsx
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { PublicLayout } from './layouts/PublicLayout';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';

// Route Code Splitting
const LandingPage = lazy(() => import('./routes/LandingPage'));
const AuthPage = lazy(() => import('./routes/AuthPage'));
const OnboardingWizard = lazy(() => import('./routes/OnboardingWizard'));
const Dashboard = lazy(() => import('./routes/Dashboard'));
const ProjectWorkspace = lazy(() => import('./routes/project/ProjectWorkspace'));
const ProfileSettings = lazy(() => import('./routes/ProfileSettings'));

// Route Protection Guard
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = Boolean(localStorage.getItem('daedalus_user_id'));
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Suspense fallback={<div className="p-8"><SkeletonLoader variant="card" /></div>}>
      <Outlet />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  // 1. Public Routes
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <AuthPage /> },
    ],
  },
  // 2. Protected Routes (Strictly NO API Keys on onboarding)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingWizard /> },
      {
        element: <WorkspaceLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/project/:id', element: <ProjectWorkspace /> },
          { path: '/profile', element: <ProfileSettings /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
```

### Complete Project File Tree

```
frontend/
├── src/
│   ├── assets/                 # SVGs, noise texture png, brand marks
│   ├── components/
│   │   ├── common/
│   │   │   ├── MagneticButton.tsx      # Spring physics magnetic attraction
│   │   │   ├── GlassCard.tsx           # Glassmorphism panel with backdrop blur
│   │   │   ├── SkeletonLoader.tsx      # Shimmering data-shaped placeholder
│   │   │   └── ConfettiBurst.tsx       # Particle celebration engine
│   │   ├── landing/
│   │   │   ├── HeroInteractiveCLI.tsx  # Live mini-terminal + mini-DAG visualizer
│   │   │   ├── TechMarquee.tsx         # Infinite scrolling hardware & stack marquee
│   │   │   ├── BentoGrid.tsx           # 4-card CSS grid high-density feature matrix
│   │   │   └── ClimaxCTA.tsx           # Full-bleed magnetic terminal entry
│   │   ├── wizard/
│   │   │   ├── TerminalInput.tsx       # Stagger-reveal profile ingestion engine
│   │   │   └── SkillNetworkGraph.tsx   # Canvas/SVG 384-D neural skill topology
│   │   ├── decomposer/
│   │   │   ├── IdeaEditor.tsx          # Code-editor hero input with line numbers
│   │   │   ├── NodeGraphView.tsx       # Interactive SVG/React Flow DAG with laser edges
│   │   │   └── TaskSidePanel.tsx       # Sliding drawer for editing task specs & assignees
│   │   ├── scaffolding/
│   │   │   ├── BuildSequence.tsx       # Cascading checkmarks terminal runner
│   │   │   └── ZippingFolder3D.tsx     # 3D zipping folder with spring physics ZIP download
│   │   └── dashboard/
│   │       ├── SprintGrid.tsx          # Linear-style dense Kanban board
│   │       ├── TaskCard.tsx            # Frosted glass card with neon pulse & CI badge
│   │       ├── WebhookSimulator.tsx    # HMAC-SHA256 GitHub event test bench
│   │       └── TeammateAvatar.tsx      # Real-time timezone & active branch tooltip
│   ├── layouts/
│   │   ├── PublicLayout.tsx            # Sticky glass nav, footer, noise background
│   │   └── WorkspaceLayout.tsx         # App shell, command bar (Cmd+K), teammate stack
│   ├── routes/
│   │   ├── LandingPage.tsx             # High-conversion developer landing page
│   │   ├── AuthPage.tsx                # GitHub OAuth / Instant developer token
│   │   ├── OnboardingWizard.tsx        # Terminal boot-up skill scanner
│   │   ├── Dashboard.tsx               # Projects grid & active sprints
│   │   ├── project/
│   │   │   └── ProjectWorkspace.tsx    # Tabs: Decomposer, Scaffolder, SprintGrid
│   │   └── ProfileSettings.tsx         # Teammate skills, vector status, git settings
│   ├── services/
│   │   ├── api.ts                      # Fetch client to FastAPI endpoints
│   │   └── websocket.ts                # Auto-reconnecting WebSocket stream
│   ├── types/
│   │   └── index.ts                    # TypeScript types for all models
│   ├── App.tsx                         # Core provider layout & state orchestrator
│   ├── index.css                       # Design tokens, fonts, custom keyframes
│   └── main.tsx                        # DOM mount
```

---

## 4. Landing Page Blueprint (Developer-Centric)

### Section 1: Sticky Navigation Bar
- **Left**: `[🏛️ DAEDALUS]` Isometric DAG Node Icon + `DAEDALUS AI` monogram.
- **Center**: Status badge: `<div className="w-2 h-2 rounded-full bg-neon-green animate-ping" /> ALL SYSTEMS OPERATIONAL`.
- **Right**:
  - GitHub Stars Counter badge (`★ 1,420 stars`).
  - Secondary Link: `"Documentation"`.
  - Magnetic CTA Button: `[ > Boot Session ]` linking to `/onboarding`.

### Section 2: The Interactive Hero ("The Zero-Friction Sandbox")
- **Headline**:
  ```
  Execute Hackathons Without
  Merge Conflicts or Stack Mismatches.
  ```
- **Subheadline**:
  *Autonomous multi-agent orchestration that ingests team skill vectors, compiles raw ideas into verified DAG roadmaps, synthesizes boilerplate repositories in-memory, and gates tasks behind GitHub Actions.*
- **The Interactive Hero CLI Playground**:
  - A massive, interactive terminal window mounted directly inside the Hero.
  - Three clickable pre-loaded prompt pills:
    1. `[DeFi Flash-Loan Arbitrage Bot]`
    2. `[Real-Time Multiplayer Whiteboard with CRDTs]`
    3. `[Autonomous Medical Records RAG Pipeline]`
  - An interactive terminal input: The user types or clicks a pill, presses `Enter`, and watches the right side of the window dynamically shoot out a mini SVG node-graph breakdown live on the landing page!

### Section 3: The Infinite Tech Marquee
- A high-speed, dual-direction horizontal scrolling track featuring the exact production stacks synthesized by Daedalus:
  `[FastAPI 0.111]` • `[React 18 & TypeScript]` • `[PostgreSQL 16]` • `[pgvector HNSW]` • `[Docker & Compose]` • `[GitHub Actions CI]` • `[TailwindCSS]` • `[WebSockets]` • `[Uvicorn]` • `[Alembic]`

### Section 4: Bento Box Feature Grid (CSS Grid, Glassmorphic)

```
+-------------------------------------------------------+-----------------------------+
| Card 1: 384-D Neural Skill Vector Ingestion          | Card 2: Acyclic DAG Engine  |
| Visual: Interactive force graph showing team skills   | Visual: Circular dependency |
| clustered by cosine similarity with 0% stack mismatch | detected & auto-healed      |
+-------------------------------------------------------+-----------------------------+
| Card 3: GitHub Actions CI Gatekeeper                 | Card 4: In-Memory Scaffolder|
| Visual: Animated PR cards only marked COMPLETED when  | Visual: 0s disk I/O counter |
| check_run passes. Fails trigger amber retry state.   | Streaming ZIP from RAM      |
+-------------------------------------------------------+-----------------------------+
```

### Section 5: The Climax CTA
- Full-bleed glass panel with animated cyan/violet radial backdrop glow.
- Terminal prompt title: `daedalus://launch-sprint`.
- **Massive Magnetic Button**:
  - Glowing animated conic spinning border.
  - Text: `INITIALIZE YOUR HACKATHON TEAM [ > ]`
  - Subtext: *100% Free & Open Source for Student Developers. Zero API Keys Required.*

---

## 5. Core Component Specifications

### 1. The Setup Wizard (`TerminalInput.tsx`)
- **UI State**: Command-line prompt styled like a high-end Linux shell.
- **Micro-Interaction**: User drops their GitHub profile or resume link.
- **Animation Choreography**:
  1. Terminal logs stagger-reveal at 350ms intervals (`> Querying public repositories...`, `> Analyzing commit velocity...`, `> Projecting 384-dimensional pgvector embeddings...`).
  2. Input collapses smoothly.
  3. The interactive `SkillNetworkGraph` fades in, displaying an orbital node network of the student's skills connected by glowing cyan lasers to a central user hub.

### 2. The Idea Decomposer (`IdeaEditor.tsx` + `NodeGraphView.tsx`)
- **Split Screen**:
  - **Left (40% width)**: Code editor textarea with line numbers, syntax accents, and ambient glow.
  - **Right (60% width)**: Interactive SVG Node Graph with pulsing Epic hubs shooting laser connecting lines (`linearGradient #8A2BE2 -> #00F0FF`) to Task nodes.
- **Interaction**: Clicking any task node slides open the glass `TaskSidePanel`, displaying the assigned teammate (matched by cosine similarity), the autogenerated mock API contract (`GET /api/v1/items`), and dependency requirements.

### 3. The Scaffolding Engine (`ZippingFolder3D.tsx`)
- **UI State**: Central stage with the conic-spinning "Generate Infrastructure" button.
- **Build Sequence**: Cascading checkmarks progress through FastAPI setup, mock route generation, React bundling, Dockerfile creation, and GitHub Actions workflow wiring.
- **The Climax**: A 3D-styled folder icon smoothly zips shut with an animated zipper seam, bounces with spring physics (`stiffness: 300, damping: 15`), drops into the download tray, and automatically triggers an in-memory `.zip` file download.
