---
name: System Redesign Plan
description: Complete redesign of skills, docs, and workflow decided 2026-03-31. Execute next session before resuming design questions.
type: project
---

# System Redesign — Execute Next Session

Everything decided on 2026-03-31. Do these changes methodically, one at a time, verify each.

---

## Skills — Final Lineup

### KEEP (with changes)

**`/resolve`** — Intelligent agent (reasons about items, not rules-based):

**Core behavior:**
- **Agent, not rigid routing.** /resolve reads items, understands their nature, and figures out where they belong — no manual tagging needed. It can tell "tier pricing discussion" is a business item and "round blocks to 5-min increments" is a scheduler feature without being told.
- Auto-reads todo.md and design-questions.md fresh every time it's invoked
- Notices priority flags (items marked "soon" or "next")
- Clusters related items ("these 3 all touch notifications — tackle together?")
- Routes items to the correct doc based on content: business items → business-model.md, design decisions → session-state, principles → project-scope.md, etc.
- Flags conflicts between new items and existing decisions in session-state or build-plan
- Cross-references todo against design-questions, session-state, and build doc for abnormalities
- Has a "Someday/Maybe" awareness — skips those unless Hannah specifically asks
- If an item is a recurring build step (security check, business checkpoint), flags it for the build doc rather than resolving it as a one-off
- Presents its reasoning: "I think this is a business decision because X — want me to route it to business-model.md?"

**`/deploy`** — Deploys Supabase edge functions only. Triggered manually or by /build wrap-up (if edge functions changed). Does NOT handle git or Vercel — those are /preview and /sync-docs.

**`/sync-docs`** — Expanded role. The "finalize and merge" skill:
- Adds README/description to the repo
- Stages, commits, and pushes all changes (code + docs) to GitHub
- Merges branch to main (with Hannah's confirmation)
- All project docs go to GitHub (including blueprint) — git is the cloud backup
- Triggered automatically by /build wrap-up (after /preview confirmation)
- Can also be triggered manually or whenever any skill modifies a doc
- One private GitHub repo for now

**`/explain`** — Keep as-is. ELI5 mode during building.

**`/learned`** — Keep as-is. Log learning in Hannah's own words.

**`/doc`** — Keep as-is. Generate reference docs for built features.

### CREATE NEW

**`/build`** — Phase-based build agent (NOT rules-based — reasons about dependencies, adapts to new info):

**Core behavior:**
- **Agent, not rigid workflow.** /build reasons about what goes in which phase, understands dependencies between features, and explains its thinking.
- **Refreshes every invocation.** Every time Hannah says `/build`, the agent re-reads session-state and todo for anything new, compares against current build-plan, surfaces what changed, then picks up where we left off. Doesn't matter if she finished one task or three phases last time.
- Draws from session-state to create/update build-plan.md
- Each phase has tasks, each task is a step
- Progress tracked in a **sister doc** (build-progress.md) that mirrors the phase structure
- During a phase: log decisions, code changes, notes under that phase's section

**How sessions work:**
- `/build` opens the session — agent reads state, shows where we are, what's new, current phase
- Then Hannah works naturally. Small changes happen in conversation. No rigid gates during active work.
- If a change is big enough to affect other phases, flag it: "This touches Phase X — route through /resolve or just make the change?"
- Phase wrap-up only kicks in when Hannah says the phase is done.

**Revision tasks (handling changes to already-built work):**
- If a future /resolve touches something already built, /build flags it: "This affects Phase N which is already complete."
- Creates a **revision task** — scoped fix that goes into the next upcoming phase (or its own mini-phase if big enough)
- Tracked in build-progress as a revision, not original work: "Phase 2 built onboarding v1, Phase 5 revised onboarding based on resolve #14"
- Build plan stays forward-moving but absorbs changes to past work.

**Phase wrap-up sequence** (its own coordinated flow at end of each phase):
  1. **Review** everything built in this phase
  2. **Building essentials** — security, privacy, pitfalls, business checkpoint (if applicable). Any issues found get added back to phase tasks, fix them, re-run essentials. Issues worked through here get logged in build-progress.
  3. **`/deploy`** edge functions (if any changed this phase — Supabase only)
  4. **`/preview`** — pushes branch to GitHub, Vercel auto-deploys preview, gives Hannah the preview URL
  5. **HARD STOP** — Hannah interacts with the Vercel preview
     - **"Fix these things"** → issues added back to phase tasks, loop to step 1
     - **"Good enough for now, ship it"** → continue with known rough edges noted in build-progress, polish items added to todo.md
     - **"I'm happy, move forward"** → continue
     - **"Scrap this phase"** → abandon branch, nothing merges, back to build-plan
  6. **`/mother`** active mode — updates all docs (blueprint, portfolio, showcase, end-to-end, etc.)
  7. **`/sync-docs`** finalizes — stages, commits, pushes, merges branch to main, pushes all docs

- **MVP flag**: build monitors criteria and alerts when MVP is ready to go public (core scheduling works, auth smooth, UI polished, security passed)
- **Business checkpoints**: woven into relevant phases, not one big flag
  - Phase with auth/onboarding → tier pricing finalized?
  - Phase with core features → MVP readiness?
  - Phase with community → moderation policy, ToS?
- **Changing decisions during build**: small tweaks = change in conversation. Design-level changes = route through /resolve (talk it through, catch downstream conflicts). /build flags when something is big enough to need /resolve.
- **Future ideas during build**: go to todo.md Someday/Maybe section, NOT into build

**`/preview`** — Pushes current branch to GitHub so Vercel auto-deploys a preview:
- Ensures changes are committed on the branch
- Pushes branch to GitHub
- Vercel automatically creates a preview URL for the branch
- Gives Hannah the URL to interact with
- Usable anytime — mid-phase to check progress, or at wrap-up for formal review
- Does NOT merge to main — that's /sync-docs' job after confirmation

**`/mother`** — Background agent (NOT a skill), always passively monitoring:
- **Passive (always on):** Notices inconsistencies, flags them in conversation. No changes without Hannah knowing.
- **Active (on invocation or auto):** Actually updates docs — removes stale info, syncs cross-references, cleans up.
- **Chain of truth:** blueprint (finalized) > build-plan (in progress) > session-state (staging) > todo (backlog)
- **Insight routing (passive):** During any session, mother notices when Hannah makes decisions or has insights, and routes them to the right place:
  - Design decisions → session-state (staging)
  - Process insights → end-to-end-flow.md or project-scope.md
  - Noteworthy work/achievements → portfolio.md + professional-showcase.md
  - New feature ideas → todo.md
  - Business decisions → business-model.md
- **Docs mother watches and updates:**
  - todo.md — flag stale items, remove completed, catch duplicates
  - session-state.md — keep current, archive processed items
  - build-plan.md + build-progress.md — keep in sync
  - blueprint.md — flag conflicts with recent decisions
  - ai-systems.md, scheduler.md, business-model.md — cross-doc consistency
  - architecture.md, database.md, pages.md, ui-ux.md — during build
  - **Professional showcase doc** — update whenever something noteworthy or professionally impressive happens
  - **Portfolio doc** — update with noteworthy work, add screenshot/diagram notes, append to evolution timeline
  - **End-to-end flow doc** — update when skills, docs, or process changes
- **Auto-activates** whenever working on Offload. No manual invocation needed for passive mode.

### KILL

- **`/idea`** — Unnecessary. Hannah just says "add this to todo" and it gets added. No skill needed.
- **`/guardrails`** — Baked into /build's phase wrap-up as "building essentials" checks. Items added via todo → resolve flags them as recurring build steps.
- **`/session`** — Replaced by /mother (passive monitoring + doc hygiene). Status check functionality absorbed into how /resolve and /build open.
- **`/backup`** — Replaced by auto sync-docs to GitHub repo. Git IS the cloud backup. OneDrive becomes optional/redundant.

---

## Documents — Changes

### DELETE
- `decisions-pending.md` — redundant with todo.md
- `offload-session-log.md` — unclear purpose, remove
- `hannahs-notes.md` — replaced by end-to-end flow doc

### MERGE
- `feedback_safety_privacy_first.md` + `feedback_wellness_not_healthcare.md` → **`project-scope.md`** — single doc for principles, boundaries, guardrails (wellness not healthcare, privacy-first, etc.)

### DELETED (originally planned as archive, decided to delete — git has history if needed)
- `ideas-review.md` — original brainstorm source (active backlog in todo.md)
- `offload-ai-roadmap.md` — original AI features source (active in ai-systems.md)
- `offload-project.md` — original architecture source (active in architecture.md)
- Evolution story captured in portfolio.md timeline instead of keeping stale docs

### BAKE INTO BUILD (content absorbed, doc purpose changes)
- `pitfalls.md` — becomes build warnings. During each phase, build references relevant pitfalls and flags them. Keep the doc as the reference source, but it's consumed by build, not read standalone.
- `project_launch_urgency.md` — becomes build's MVP flag. "Professor says ship ASAP" is baked into the MVP readiness criteria. Can delete this doc after baking in.

### CREATE NEW
- **`end-to-end-flow.md`** — Replaces hannahs-notes.md. Clean, organized reference showing: full pipeline, what skills handle what, what docs feed where, how everything connects. Updated by mother whenever process changes. Hannah's navigation doc.
- **`professional-showcase.md`** — Everything Hannah has done, clearly organized for explaining to people. Workflow design, skills/agents built, features, technical architecture, exciting aspects. Written for conversations, interviews, networking. Updated by mother on noteworthy work.
- **`portfolio.md`** — Cleaner, formal layout. Interview-ready. Instructions for screenshots, diagrams, before/after. Updated by mother on noteworthy work.
- **`build-progress.md`** — Sister doc to build-plan.md. Mirrors phase structure. Tracks actual work done, decisions made during building, notes. Phase sections marked complete but kept for history.
- **`project-scope.md`** — Merged from feedback files. Principles, boundaries, guardrails.

### UPDATE (don't wipe, clean up)
- **`session-state.md`** — Remove outdated top section (March 14 plan that's been redesigned). Keep essential decisions, resolve history, source file refs. Archive processed items, don't delete them.
- **`todo.md`** — Add "Someday / Maybe" section at bottom. Items land there after discussion. Resolve skips unless Hannah asks. Add business plan discussion items.
- **`blueprint.md`** — NEW RULE: only gets info after a phase is finalized and deployed. Currently has some pre-build decisions — those stay, but going forward it's shipped-reality only.
- **`business-model.md`** — Fill through resolve. Content: tier pricing, revenue model, launch strategy, target market, competitive landscape, cost structure. Resolve flags business items and routes here.

### DOC HEALTH RULES
- All doc changes trigger sync-docs (push to repo)
- One private GitHub repo for now. Split public/private when ready to launch.
- Git is the cloud backup. OneDrive optional.
- Mother checks all docs for consistency, staleness, and cross-reference accuracy

---

## Key Process Decisions

### Data Flow
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

### Session State
- Staging area between resolve and build
- Gets archived (not wiped) when drawn into build
- "Archived" section at bottom for processed items
- Active section = only current/new items

### Resolve → Build Handoff
- Resolve does NOT flow directly into build
- Build re-reads session-state on EVERY invocation (not just at phase boundaries)
- Clean separation via session-state as handoff point

### Branching Strategy (locked in 2026-04-13)
- **Always branch from main, merge back.** No stacking branches.
- Each phase: branch from main → build → wrap-up → merge to main → next phase branches from updated main
- If a resolve forces changes to past work: branch from main, fix, merge back. No cascade.
- Pre-launch, main is just the "current best version" — merging doesn't lock anything in permanently. Can always branch and redo.
- Post-launch, changes to shipped features need more care (user impact). That's a future concern.

### Changing Decisions During Build
- Small tweaks: change in conversation, no workflow needed
- Design-level changes: route through /resolve (talk it through, catch conflicts)
- /build flags when something is big enough to need /resolve
- Resolve flags if a change conflicts with recurring build steps

### Business Plan
- business-model.md filled through resolve
- Business checkpoints woven into build phases
- No separate business skill needed — resolve routes business items, build includes business checkpoints

### Skills vs Agents
- **Skills** (interactive, in conversation): /explain, /learned, /doc
- **Agents** (intelligent, reason about work): /resolve (item processing + routing), /build (phase management), /mother (background monitoring + doc routing)
- **Utility skills** (triggered manually or by agents): /deploy (Supabase edge functions), /sync-docs (git + merge + doc push), /preview (branch push for Vercel preview)

---

## Execution Order

1. ~~Delete: decisions-pending.md, offload-session-log.md, hannahs-notes.md~~ — DONE (2026-04-02)
2. ~~Create: project-scope.md (merge feedback files)~~ — DONE (2026-04-02)
3. ~~Create: end-to-end-flow.md (thorough, clean, organized)~~ — DONE (2026-04-02)
4. ~~Create: professional-showcase.md + portfolio.md~~ — DONE (2026-04-02)
5. ~~Mark archive docs as archive~~ — DONE, then CHANGED: deleted instead of archiving. Git has history. Evolution captured in portfolio.md timeline. (2026-04-13)
6. ~~Update session-state.md (clean, keep essentials + build roadmap)~~ — DONE (2026-04-13)
7. ~~Add Someday/Maybe section to todo.md~~ — DONE (2026-04-13)
8. ~~Add business discussion items to todo.md~~ — DONE (2026-04-13)
9. ~~Build /resolve agent (upgraded from skill to intelligent agent)~~ — DONE (2026-04-13)
10. ~~Build /build agent + build-progress.md (agent-based, not rules)~~ — DONE (2026-04-13)
11. ~~Build /preview skill (branch push for Vercel preview)~~ — DONE (2026-04-13)
12. ~~Build /mother agent~~ — DONE (2026-04-13)
13. ~~Remove /idea, /guardrails, /session, /backup skills~~ — DONE (2026-04-13)
14. ~~Bake pitfalls + launch urgency into build~~ — DONE (2026-04-13). Pitfalls restructured by category. Launch urgency baked into MVP monitoring. project_launch_urgency.md deleted.
15. ~~Update README.md, MEMORY.md, end-to-end-flow.md to reflect all changes~~ — DONE (2026-04-13). Also cleaned up parent-level redundant files (project_offload_scope.md, feedback_uiux_priority.md). Repo renamed to hannypoo/offload.
16. Sync everything to repo
17. Resume design questions (#8+)
