---
name: Professional Showcase
description: Everything Hannah has built and designed — organized for conversations, interviews, and networking. Updated by /mother on noteworthy work.
type: reference
---

# Professional Showcase

What Hannah has done, written for explaining to real people. Use this for conversations, interviews, LinkedIn, networking.

---

## Offload — ADHD-Adaptive Daily Scheduler

**What it is:** A productivity app designed specifically for neurodivergent brains. Instead of a static calendar, it builds your day dynamically based on your energy, priorities, and how your brain actually works.

**What makes it special:**
- **Energy-aware scheduling** — the app adapts in real-time when you crash or lock in. No morning energy quiz that gates your whole day. Just tap "I'm crashing" and your schedule reshuffles around you.
- **Nudge AI assistant** — one unified AI personality with multiple capabilities (scheduling, coaching, emotional support, task creation). Not a chatbot bolted on — it's woven into the core experience.
- **Designed FOR neurodivergent users, not adapted after the fact.** Every UX decision filters through "does this reduce decision paralysis?" Big tap targets, clean numbers, defaults so good you never touch settings (the Navi Rule).
- **3-layer onboarding funnel** — not a 20-screen setup wizard. Layer 1 hooks you with essentials, Layer 2 lets you explore features at your own pace, Layer 3 has Nudge drip tips over time at AI-determined optimal moments.
- **Tiered model** (Freebie → Help Me → In My Era → Full Send) — each tier unlocks more AI capability, not just more features.

**What Hannah built:**
- Scheduler engine: 5-stage pipeline with energy scaling, zone-aware task placement, anchored vs movable blocks, buffer time that adapts to energy level
- Mid-day energy adjustment system (replaced morning gate with compact modal)
- Reshuffle logic — completed blocks stay, remaining slots re-fill on energy change
- Supabase backend (auth, database, edge functions)
- React + TypeScript + Vite frontend

**What Hannah designed:**
- Complete product vision and design system for neurodivergent UX
- 17 design questions resolved through structured product thinking
- Tier model with progressive AI capability unlocking
- AI architecture: unified Nudge with capability modes, multi-layer intelligence (retrieval + pattern detection + behavioral tracking)
- Full workflow management system with custom skills, background agents, and a document pipeline that tracks decisions from idea → backlog → staging → build → shipped reality
- Notification philosophy (the Navi Rule) — defaults should be so good users never need to configure

**Tech stack:** React, TypeScript, Tailwind, Vite, Supabase (auth, DB, edge functions), AI integration

---

## GiveWiZe — AI-Powered Charity Discovery Platform

**What it is:** A platform that helps people find charities that match their values using AI-powered matching, scoring, and discovery tools.

**What Hannah built:**
- AI quiz matcher — multi-tier quiz that matches users to charities based on values, interests, and giving style
- Charity profiles with automated scoring and AI-generated summaries
- 3-agent auto-onboarding pipeline — charities get scraped, scored, and profiled automatically
- 4 AI agents handling different parts of the platform
- Supabase Edge Functions for serverless AI processing
- Full React + TypeScript + Tailwind frontend (18 pages)

**Tech stack:** React, TypeScript, Tailwind, Vite, Supabase, AI agents

---

## Marketing Agent — AI Social Media Content Generator (MSIS 521)

**What it is:** An AI agent that generates and auto-posts social media content for GiveWiZe across LinkedIn and Instagram.

**What Hannah built:**
- Content generation pipeline for multiple content types
- LinkedIn + Instagram auto-posting integration
- Platform-specific content formatting

---

## AI Agent System — Custom Development Workflow

One of the most impressive things Hannah has built isn't a product feature — it's an **AI-powered development workflow** with intelligent agents that manage the entire lifecycle from idea to shipped product.

### The Big Picture

Hannah designed and built a system of 3 intelligent agents + 4 utility skills that orchestrate her entire development process. Ideas flow through a structured pipeline — from raw backlog to staged decisions to phased build to shipped reality — with agents handling routing, tracking, quality control, and deployment at each stage.

This isn't drag-and-drop project management. These are reasoning agents that understand the project context, make intelligent decisions about where information belongs, detect conflicts between decisions, and adapt when plans change.

### The Agents

**`/resolve` — Intelligent Item Resolution Agent**
- Reads the entire project state (15+ docs) on every invocation to build a complete picture
- Pulls the next unresolved item and *reasons about it*: what type of decision is it? Where does it belong? Does it conflict with anything already decided? Are there related items that should be tackled together?
- Routes decisions to the correct doc automatically — no manual tagging or categorization. It reads "tier pricing discussion" and knows that's a business-model item without being told.
- Clusters related items: "These 3 all touch notifications — want to tackle them together?"
- Flags conflicts: "This contradicts what we decided about onboarding in design question #3"
- Cross-references across the entire doc system to catch redundancies, contradictions, and gaps

**`/build` — Intelligent Build Agent**
- Manages phased construction of the app, reasoning about what should be built in which order based on feature dependencies
- Refreshes from the full project state on every invocation — detects what's changed since the last session, surfaces new information, adjusts the plan
- During active work: tracks progress automatically, logs every completed task and decision to a progress doc in real-time
- Creates revision tasks when a new decision affects already-built work (keeps the build moving forward while absorbing changes)
- Phase wrap-up is a 7-step coordinated sequence:
  1. Review all work done
  2. Security/privacy/pitfall checks (loops until clean)
  3. Deploy edge functions (Supabase)
  4. Push branch for Vercel preview deployment
  5. **Hard stop** — human interacts with the live preview and decides: fix, ship with notes, approve, or scrap
  6. Document health agent updates all project docs
  7. Git merge to main + doc sync to GitHub
- Monitors MVP readiness criteria and alerts when the product is ready to ship
- Pause mode: pushes to GitHub for backup when stepping away, logs exactly where to pick up

**`/mother` — Document Health & Insight Routing Agent**
- **Passive mode** (always active): during any work session, notices when decisions are made or insights emerge, and routes them to the correct doc — design decisions to session-state, business decisions to business-model, new ideas to the backlog, noteworthy achievements to the portfolio
- **Active mode** (on invocation): full audit of every project doc — checks chain of truth (blueprint > build-plan > session-state > todo), cross-doc consistency, stale references, duplicate items, portfolio currency
- Enforces the "chain of truth": shipped reality (blueprint) overrides in-progress plans (build-plan), which override staging (session-state), which overrides raw backlog (todo). If lower-level docs contradict higher-level ones, /mother flags it.
- Called by /build during wrap-up to update blueprint, portfolio, showcase, and end-to-end flow docs

### The Utility Skills

| Skill | What It Does |
|---|---|
| `/preview` | Pushes branch to GitHub → Vercel auto-deploys preview. Lets you see and interact with changes before merging. Safe — never touches main. |
| `/deploy` | Deploys Supabase edge functions. Triggered manually or by /build wrap-up. |
| `/sync-docs` | Stages, commits, pushes all changes to GitHub. Merges branch to main. All docs (including blueprint) backed up to git. |
| `/doc` | Auto-generates reference documentation by reading actual source code. |

### The Pipeline

```
Ideas → todo.md → /resolve → session-state → /build → phases
                                                         ↓
                                              code + progress tracking
                                                         ↓
                                              phase wrap-up sequence
                                                         ↓
                                    essentials → preview → confirm → merge
```

### Technical Architecture

- **Skill definitions:** Markdown files with YAML frontmatter defining name, description, allowed tools, and argument hints. The body is structured instructions that guide the AI's reasoning.
- **State management:** File-based using markdown docs as the persistence layer. Each doc has a defined role in the chain of truth. No database — git history provides versioning.
- **Agent reasoning:** Agents load full project context (15+ docs) on every invocation to make informed decisions. They explain their reasoning so Hannah can correct them.
- **Git workflow:** Branch-from-main strategy. Each build phase is a branch. Periodic pushes for backup. Merge only after full wrap-up with human confirmation on a live preview.
- **Deployment pipeline:** Vercel for frontend (auto-deploys on branch push), Supabase for backend/edge functions (deployed via /deploy skill).

### Why This Matters

This system solves real problems:
- **Decision traceability** — every design decision is tracked from idea through discussion to implementation. Nothing gets lost or forgotten.
- **Quality gates** — security, privacy, and business checks are baked into every phase, not bolted on at the end.
- **Human-in-the-loop** — the agents track, suggest, and flag, but Hannah makes every decision. The hard stop at preview means nothing ships without human approval on a live version.
- **Adaptive planning** — when new information changes the plan, the system absorbs it (revision tasks) instead of breaking.
- **No context loss** — portfolio and showcase docs are automatically updated, so Hannah can always articulate what she's built and why.

---

*Updated by /mother whenever noteworthy work happens. Last updated: 2026-04-13.*
