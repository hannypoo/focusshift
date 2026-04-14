---
name: Portfolio
description: Formal, interview-ready portfolio layout for Hannah's work. Screenshots, diagrams, before/after. Updated by /mother on noteworthy work.
type: reference
---

# Portfolio

Clean, formal layout for interviews and professional presentations. Each project has a structured format with space for visual evidence.

---

## Project 1: Offload — ADHD-Adaptive Daily Scheduler

### Overview
Productivity app for neurodivergent users. Builds your day dynamically based on energy, priorities, and brain state. Features an AI assistant (Nudge) woven into the core experience.

### Role
Solo designer and developer — product vision, UX design, full-stack implementation, AI architecture, workflow systems.

### Key Technical Contributions
- **Scheduler engine** — 5-stage pipeline: energy-aware task ranking, zone placement, block duration scaling (0.6x–1.4x by energy), adaptive buffer times, anchored vs movable block logic
- **Energy adjustment system** — real-time schedule reshuffling on energy change without losing completed work
- **AI architecture design** — unified assistant with capability modes, multi-layer intelligence (retrieval DB, pattern detection, behavioral tracking)
- **Development workflow** — custom skill system, document pipeline, background monitoring agent, phase-based build process

### Key Design Contributions
- Neurodivergent-first UX philosophy (the Navi Rule: if users want to turn everything off, defaults are wrong)
- 3-layer onboarding funnel (essentials hook → feature menu → AI-driven ongoing discovery)
- Tiered model where AI capability grows with tier, not just feature count
- Notification design that respects attention and reduces alert fatigue

### Tech Stack
React | TypeScript | Tailwind | Vite | Supabase (auth, DB, edge functions) | AI integration

### Screenshots & Diagrams
<!-- TODO: Add screenshots -->
- [ ] Energy modal (before/after: morning gate → compact bottom-sheet)
- [ ] Today view with reshuffled schedule
- [ ] Scheduler pipeline diagram
- [ ] Onboarding flow wireframe
- [ ] Tier comparison visual

---

## Project 2: GiveWiZe — AI-Powered Charity Discovery

### Overview
Platform that matches users to charities using AI-powered quizzes, automated charity scoring, and intelligent discovery tools.

### Role
Solo developer — full-stack implementation, AI agent design, data pipeline.

### Key Technical Contributions
- **AI quiz matcher** — multi-tier quiz with scoring algorithm that matches values to charities
- **3-agent auto-onboarding pipeline** — charities are scraped, scored, and profiled automatically on addition
- **4 AI agents** — each handles a distinct platform responsibility
- **Supabase Edge Functions** — serverless AI processing for charity data

### Key Design Contributions
- 18-page application with glassmorphic design system
- Charity profile scoring system with transparent methodology
- Quiz flow designed for engagement, not just data collection

### Tech Stack
React | TypeScript | Tailwind | Vite | Supabase | Edge Functions | AI agents

### Screenshots & Diagrams
<!-- TODO: Add screenshots -->
- [ ] Quiz flow (question → results → charity match)
- [ ] Charity profile with AI summary and score breakdown
- [ ] Platform architecture diagram
- [ ] Auto-onboarding pipeline flow

---

## Project 3: Marketing Agent (MSIS 521)

### Overview
AI agent that generates and auto-posts platform-specific social media content for GiveWiZe across LinkedIn and Instagram.

### Role
Solo developer — agent design, platform integrations, content pipeline.

### Key Technical Contributions
- Multi-platform content generation with format-specific output
- LinkedIn + Instagram API integration for automated posting
- Content type system for varied post formats

### Screenshots & Diagrams
<!-- TODO: Add screenshots -->
- [ ] Generated content examples (LinkedIn vs Instagram side-by-side)
- [ ] Agent pipeline diagram

---

## Meta: AI Agent System & Development Workflow

### Overview
Designed and built a system of 3 intelligent AI agents + 4 utility skills that manage the full development lifecycle — from raw idea to shipped product. Agents reason about project context, route information, detect conflicts, track progress, and enforce quality gates.

### Role
Sole architect and builder — designed the agent behaviors, the document pipeline, the state management system, the git workflow, and the wrap-up sequence.

### The Agents I Built

**`/resolve` — Intelligent Item Resolution Agent**
- Loads 15+ project docs on every invocation to build complete context
- Reasons about each item: what type of decision is it, where does it belong, does it conflict with existing decisions
- Auto-routes without manual tagging — understands "tier pricing" is a business item without being told
- Clusters related items, flags contradictions, cross-references across the full doc system

**`/build` — Intelligent Build Agent**
- Reasons about feature dependencies to organize work into phases
- Refreshes full project state every invocation — detects changes, adjusts plan, surfaces new info
- Auto-logs completed tasks and decisions to a progress doc in real-time
- Creates revision tasks when new decisions affect already-built work
- 7-step phase wrap-up: review → security/privacy checks (loops until clean) → edge function deploy → Vercel preview deploy → **human confirmation on live preview** → doc health updates → git merge to main
- MVP readiness monitoring with automated alerts

**`/mother` — Document Health & Insight Routing Agent**
- Passive: during any session, detects decisions/insights and routes to correct docs automatically
- Active: full audit — chain of truth validation, cross-doc consistency, stale reference detection, portfolio updates
- Enforces chain of truth: shipped (blueprint) > planned (build-plan) > staged (session-state) > backlog (todo)

### Technical Architecture

| Layer | Implementation |
|---|---|
| **Skill definitions** | Markdown + YAML frontmatter. Structured instructions that guide AI reasoning, not rigid code. |
| **State management** | File-based persistence via markdown docs. Each doc has a defined role in the chain of truth. Git provides versioning. |
| **Agent reasoning** | Full context loading (15+ docs) on every invocation. Agents explain reasoning so human can correct. |
| **Git workflow** | Branch-from-main. Each phase = branch. Periodic pushes for backup. Merge only after wrap-up with human approval. |
| **Deployment** | Vercel (frontend, auto-deploys on push) + Supabase (backend/edge functions via /deploy skill) |
| **Quality gates** | Security, privacy, pitfalls, business checkpoints baked into every phase wrap-up |

### Key Design Decisions
- **Agents over rules** — agents reason about context, not follow static routing tables. This means they adapt when the project changes.
- **Human-in-the-loop** — agents suggest and track, but every decision is Hannah's. Hard stop at preview = nothing ships without human approval on a live version.
- **Chain of truth** — strict hierarchy prevents doc drift. Higher-level docs override lower-level ones.
- **Save immediately** — agents write after every decision, not in batches. If a session crashes, work is preserved.

### Why This Matters
This isn't project management tooling — it's a designed system that enforces decision quality, prevents scope creep, adapts to changing plans, and creates a complete audit trail from idea to shipped feature. The development process itself is a product.

### Screenshots & Diagrams
<!-- TODO: Add visuals -->
- [ ] End-to-end pipeline diagram
- [ ] Agent interaction flow (resolve → session-state → build → wrap-up → blueprint)
- [ ] Wrap-up sequence diagram (7 steps)
- [ ] Before/after: old workflow (5 skills, manual routing) vs new (3 agents, intelligent routing)

---

## Project Evolution — How We Got Here

The journey matters as much as the result. This section tracks how each project evolved — pivots, breakthroughs, and the thinking behind major changes. /mother appends here whenever something shifts.

### Offload Timeline

| When | What Happened | Why It Mattered |
|------|--------------|-----------------|
| Early 2026 | Started as **FocusShift** — a class project (MSIS 522) with a team | Original concept: ADHD scheduling app with basic energy tracking |
| Mar 1 | **Energy system redesign** — ripped out the morning energy gate | The old design forced a full-screen "how's your energy?" check at 8am. ADHD brains can't gauge energy in advance. Replaced with a compact mid-day modal: tap "I'm crashing" anytime and the schedule reshuffles around you. This was the first moment the app started thinking like its users. |
| Mar 14 | **Offload becomes independent** — no longer scoped to MSIS 522 | Hannah decided this has real product potential. Renamed from FocusShift to Offload. New rule: design first, build second. No more hacking features in — plan the whole thing. |
| Mar 14 | **UI/UX declared #1 priority** | The backend/scheduler engine is solid. But the frontend was built for a class demo, not real neurodivergent users. Everything needs to be redesigned through that lens. |
| Mar 15 | **Doc system created** — 16 planning docs + 3 custom skills | Built /resolve, /session, /idea to structure the design process. Created blueprint, build-plan, design-questions, todo, and 12 other docs. This was when "plan first" became a real system, not just an intention. |
| Mar 17–31 | **Resolved 7 of 17 design questions** | Each one shaped the product: 3-layer onboarding funnel, unified Nudge AI (not separate bots), notification philosophy (the Navi Rule), energy zones + cut-offs, seconds-based countdown framing. Captured 9 new ideas along the way. |
| Mar 24 | **Onboarding funnel designed** | The breakthrough: onboarding isn't a setup wizard you endure — it's a 3-layer funnel. Layer 1 hooks you fast. Layer 2 lets you explore. Layer 3 has Nudge drip features over time. This became a signature design decision. |
| Mar 30 | **One Nudge, not many bots** | Resolved the chatbot question: one unified AI personality with capability modes (scheduling, coaching, emotional support, task creation). Professor's multi-layer architecture (retrieval + pattern detection + behavioral tracking) powers it underneath. Tier-gated intelligence. |
| Mar 30 | **Safety & privacy principle established** | After designing community features and AI tracking, realized privacy can't be an afterthought. Made it a standing rule: flag security/privacy implications at every design and build step. |
| Mar 31 | **Full system redesign** | Audited the entire workflow. Killed 4 skills that weren't pulling their weight, redesigned 2, designed 3 new ones (/build, /mother, upgraded /resolve). Restructured 15+ docs. Defined a 16-step execution plan. This was the moment the development process itself became a designed system. |
| Apr 2 | **Executing the redesign (doc phase)** | Cleaned blueprint to shipped-reality only, created project-scope.md, built the end-to-end flow doc, created portfolio and showcase docs. Deleted 3 files, merged 2, restructured session-state with build roadmap. |
| Apr 13 | **Build system architecture session** | Designed how the entire build process actually works: /build as an intelligent agent (not rigid rules), /preview for Vercel preview deploys before merging, phase wrap-up as a 7-step coordinated sequence with a hard stop for Hannah to interact with the output. Locked in branching strategy (branch from main, merge back — no stacking). Defined how /mother routes insights mid-session. This session turned "we have a plan" into "we have an architecture." |

### GiveWiZe Timeline

| When | What Happened | Why It Mattered |
|------|--------------|-----------------|
| Early 2026 | Built as a class project — AI-powered charity discovery | Full-stack React + Supabase app with AI quiz matching |
| Ongoing | **4 AI agents + 3-agent onboarding pipeline** | Charities get auto-scraped, scored, and profiled. This was Hannah's first multi-agent system. |
| MSIS 521 | **Marketing agent added** | Extended GiveWiZe with automated social media content generation for LinkedIn + Instagram |

### What to Tell People

When someone asks "how did you build this?" — the answer isn't just the tech stack. The story is:

1. **Started as a class project, saw real potential, took it independent.** That's entrepreneurial instinct.
2. **Stopped coding and redesigned the process.** Most people would keep hacking. Hannah stopped, designed a proper workflow, and only then resumed building. That's engineering maturity.
3. **Every design decision was deliberate.** 17 design questions, each resolved through structured discussion, with downstream implications tracked. Not "I built what felt right" — "I built what survived scrutiny."
4. **The development system itself is a product.** Custom skills, doc pipeline, background monitoring agent. This isn't just an app — it's a demonstration of how to build software thoughtfully.
5. **Personal connection drives the product.** Offload exists because Hannah lives the problem. That authenticity shows in every UX decision.

---

*Updated by /mother whenever noteworthy work happens. Last updated: 2026-04-13.*
