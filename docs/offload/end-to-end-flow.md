---
name: End-to-End Flow
description: Hannah's navigation doc — full pipeline, what skills handle what, what docs feed where, how everything connects. Updated by /mother on process changes.
type: reference
---

# Offload — End-to-End Flow

How everything connects. Updated whenever the process changes.

---

## The Pipeline

```
Hannah adds items ──→ todo.md (backlog)
                          │
                    /resolve processes
                          │
                          ▼
                    session-state.md (staging)
                          │
                    /build reads on every invocation
                          │
                          ▼
                    build-plan.md ←──→ build-progress.md
                          │
                    phase wrap-up sequence
                          │
            ┌───────┬─────┼──────────┬──────────┐
            ▼       ▼     ▼          ▼          ▼
        essentials  /deploy  /preview   /mother   /sync-docs
        (loop)    (edge fn)  (Vercel)  (all docs)  (merge+push)
                               │
                          HARD STOP
                      Hannah confirms
```

**Chain of truth:** blueprint (finalized) > build-plan (in progress) > session-state (staging) > todo (backlog)

### Phase Wrap-Up Sequence (detailed)
1. **Review** everything built
2. **Building essentials** — security, privacy, pitfalls, business. Issues → back to phase, fix, re-run.
3. **`/deploy`** edge functions (if applicable — Supabase only)
4. **`/preview`** — push branch to GitHub → Vercel preview URL → Hannah interacts
5. **HARD STOP** — Hannah decides: fix (loop) / good enough (ship with notes) / happy (continue) / scrap (abandon branch)
6. **`/mother`** — updates all docs (blueprint, portfolio, showcase, end-to-end, etc.)
7. **`/sync-docs`** — stages, commits, pushes, merges branch to main

---

## Skills — What Each Does

| Skill | Type | What It Does | Triggers |
|-------|------|-------------|----------|
| `/resolve` | Agent | Intelligent item processor. Reads items, understands their nature, routes to correct doc without manual tagging. Clusters related items, flags conflicts with existing decisions, cross-references across docs. Skips Someday/Maybe unless asked. | Manual |
| `/build` | Agent | Phase-based build agent. Reasons about dependencies, adapts to new info. Refreshes from session-state every invocation. Opens session context, then Hannah works naturally. Wrap-up sequence at phase end. | Manual (`/build` to start/resume) |
| `/explain` | Interactive | ELI5 mode — plain English explanations during building. | Manual |
| `/learned` | Interactive | Log a learning in Hannah's own words. | Manual |
| `/doc` | Interactive | Generate reference docs for built features. | Manual |
| `/preview` | Utility | Pushes branch to GitHub → Vercel auto-deploys preview URL. Usable anytime (mid-phase checks or formal wrap-up review). Does NOT merge. | Manual or auto (build wrap-up step 4) |
| `/deploy` | Utility | Deploy Supabase edge functions only. | Manual or auto (build wrap-up step 3) |
| `/sync-docs` | Utility | Stages, commits, pushes all changes (code + docs). Merges branch to main. All docs go to GitHub including blueprint. | Auto (build wrap-up step 7) or manual |
| `/mother` | Background agent | Passive: flags inconsistencies, routes insights to correct docs. Active: updates all docs, removes stale info, syncs cross-references. | Always on (passive), auto-activated in wrap-up step 6 |

**Not skills** (killed in redesign): ~~/idea~~ (just say "add to todo"), ~~/guardrails~~ (baked into /build wrap-up), ~~/session~~ (absorbed by /mother + /resolve + /build), ~~/backup~~ (git is the backup)

### All skills built. /resolve, /build, /preview, /mother created during system redesign (April 2026). /explain, /learned, /doc, /deploy, /sync-docs carried over from previous system.

---

## Docs — What Each Contains & What Feeds It

### Active Docs

| Doc | Purpose | Fed By | Feeds Into |
|-----|---------|--------|------------|
| **todo.md** | Product backlog. Has Someday/Maybe section. | Hannah, /resolve flags | /resolve |
| **session-state.md** | Staging area. Resolved decisions live here until built. | /resolve output | /build |
| **design-questions.md** | 17 design items to resolve before building. | Original brainstorm | /resolve → session-state |
| **build-plan.md** | Phased build order. Each phase = tasks + steps. | /build draws from session-state | build-progress, blueprint |
| **build-progress.md** | Mirrors build-plan. Tracks actual work, decisions, notes per phase. | /build during work | History |
| **blueprint.md** | **Shipped reality ONLY.** What's actually built and deployed. | /build wrap-up (after phase finalized) | Reference |
| **project-scope.md** | Non-negotiable principles & boundaries. Wellness not healthcare, privacy-first, Navi Rule, etc. | Design decisions | Everything |
| **business-model.md** | Tiers, pricing, revenue, launch strategy, costs. | /resolve routes business items here | /build (business checkpoints) |
| **ai-systems.md** | Nudge capabilities, notification design, AI architecture. | /resolve, /build | Reference |
| **scheduler.md** | 5-stage scheduling pipeline, zones, cut-offs, energy. | /resolve, /build | Reference |
| **architecture.md** | Tech stack, repo structure, deployment. | /build, /doc | Reference |
| **database.md** | Tables, columns, relationships. | /build, /doc | Reference |
| **pages.md** | Every page/route. | /build, /doc | Reference |
| **ui-ux.md** | Design system, brand, neurodivergent UX. | /build | Reference |
| **pitfalls.md** | Known gotchas. Build references relevant ones per phase. | Experience | /build (warnings) |
| **seo-analytics.md** | SEO + analytics. | /build | Reference |
| **professional-showcase.md** | What Hannah has done — for conversations, interviews, networking. | /mother on noteworthy work | External |
| **portfolio.md** | Formal, interview-ready layout. Screenshots, diagrams. | /mother on noteworthy work | External |

### Deleted Docs (git has history if needed)
- ideas-review.md, offload-ai-roadmap.md, offload-project.md — original sources, superseded by active docs. Evolution captured in portfolio.md timeline.

---

## Key Rules

- **Blueprint = shipped reality only.** Decisions stay in session-state until built and deployed.
- **Session-state = staging.** Gets archived (not wiped) when drawn into build. Active section = current items only.
- **Resolve does NOT flow directly into build.** Session-state is the handoff point.
- **Build refreshes every invocation.** Re-reads session-state for new info, surfaces changes, picks up where left off.
- **Branch from main, merge back.** No stacking branches. Each phase merges to main before next phase starts.
- **Preview before merge.** Hannah interacts with Vercel preview and confirms before anything merges to main.
- **Small tweaks during build** → change in conversation. **Design-level changes** → route through /resolve.
- **Future ideas during build** → todo.md Someday/Maybe, NOT into build.
- **All doc changes** → trigger /sync-docs (push to GitHub). All docs including blueprint go to GitHub.
- **Git is the cloud backup.** OneDrive is optional.

---

## Where Things Live

| What | Where |
|------|-------|
| Code repo | `C:\Users\hanna\offload\` |
| All Offload docs | `memory/offload/` |
| Design questions | offload/design-questions.md (use /resolve) |
| Feature backlog + ideas | offload/todo.md |
| Where we left off | offload/session-state.md |
| Product principles | offload/project-scope.md |
| What's actually built | offload/blueprint.md |
| Business plan | offload/business-model.md |
| AI features | offload/ai-systems.md |
| Scheduler rules | offload/scheduler.md |
| This doc (you are here) | offload/end-to-end-flow.md |
