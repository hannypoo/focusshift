---
name: Offload session state
description: Staging area between /resolve and /build — current status, active design decisions, and archived resolve history
type: project
---

## Current Status (2026-04-13)

**Executing system redesign** — steps 1–15 complete, currently on step 16 (sync to repo).
After redesign: resume design questions starting at **#8 Automatic Time Tracking**.
10 design questions remain (#8–#10, #12, #14–#15, and parts of #13, #16, #17).

See system-redesign.md for the full 17-step plan and end-to-end-flow.md for how everything connects.

**Local folder rename pending:** `focusshift` → `offload` (GitHub already renamed. Close apps using the folder, then rename in File Explorer.)

---

## Build Roadmap

The path from where we are to shipped product. /build draws from this to create phased work.

### What's solid (don't restart)
The scheduler engine, hooks, AI integration, and types are all working. The backend/data layer is sound. **Only the UI/UX layer needs rebuilding** — everything else is enhancement on top of a working foundation.

### Sequence
1. ~~Build skills + create planning docs~~ — DONE
2. ~~System redesign~~ — NEARLY COMPLETE (step 16 of 17, sync to repo remaining)
3. **Resolve remaining 10 design questions** (using /resolve) — next up after redesign
4. **Fill build-plan.md from session-state** — /build takes all staged decisions and organizes them into phases with tasks and steps
5. **Build: UI/UX overhaul first** — this is the #1 priority. Every page redesigned for neurodivergent users. Branch-based.
6. **Build: Core features per phase** — onboarding funnel, Nudge integration, tier system, notifications, etc. Each phase has wrap-up checks (security, privacy, business).
7. **Security checkpoint** — woven into each phase wrap-up, PLUS a full audit before any public deploy (OWASP Top 10, Supabase RLS, API keys, auth flows, input validation, edge functions, dependency audit, env variables, CORS/CSP)
8. **MVP deploy** — ship when: core scheduling works, auth/onboarding smooth, UI/UX polished enough to demo, security passed. Does NOT need every tier feature or perfect polish.

### Key constraints
- **Design first, build second.** Every idea gets resolved before it enters a build phase.
- **UI/UX is #1.** The first build phase is the visual/UX overhaul.
- **Branch from main, merge back.** Each phase: branch from main → build → wrap-up → merge to main → next phase branches from updated main. No stacking branches. (Locked in 2026-04-13)
- **Tier placement happens AFTER all design questions are resolved.** One dedicated pass to sort everything into Freebie / Help Me / In My Era / Full Send once the full feature picture is clear.
- **Ship it.** Professor says get it out there ASAP — novel product, big-company interest potential. Don't let perfect be the enemy of shipped.
- **Build is an agent.** Reasons about dependencies and phase ordering — not a rigid ruleset. Refreshes from session-state every invocation. (Locked in 2026-04-13)
- **Preview before merge.** Every phase wrap-up pushes to Vercel preview. Hannah confirms on the live preview before anything merges to main. (Locked in 2026-04-13)

---

## Staged Design Decisions (move to blueprint after each is built)

- **Onboarding funnel**: 3-layer system. Layer 1 "The Hook" (essentials walkthrough, everyone gets it), Layer 2 "The Menu" (opt-in feature discovery, tier-specific, leave anytime), Layer 3 "Ongoing Discovery" (Nudge drips tips at AI-optimal times)
- **Tier selection happens BEFORE onboarding** (not during or after)
- **Onboarding is tier-dependent** — fewer steps for Freebie, full experience for Full Send
- **Tier names**: Freebie / Help Me / In My Era / Full Send
- **Unified Nudge AI** — one personality, capability modes (schedule, task creation, coaching, emotional support, FAQ, talk-it-out). Multi-layer architecture underneath. Tier-gated intelligence.
- **Seconds framing** — Nudge uses seconds for time-sensitive blocks ("90 seconds until..."). Users can switch to minutes.
- **Zones + Cut-offs** — zones = preferences (what work goes where), cut-offs = hard walls (morning + evening). Both kept.
- **Navi Rule for notifications** — time-sensitive = push ON, periodic checklist = push + celebratory, discovery = in-app only, check-ins = in-app on open, emotional support = response mode only, essential reminders = user-defined
- **Open question:** Symptom questionnaire before or after tier selection? (see todo.md)

---

## Build Readiness

**Security checkpoint** — baked into /build phase wrap-ups (not a single gate):
- OWASP Top 10, Supabase RLS, API key exposure, auth flows, input validation, edge function security, dependency audit, env variable hygiene, CORS/CSP

**MVP bar** — /build monitors and alerts when ready:
- Core scheduling works reliably
- Auth & onboarding flow is smooth
- UI/UX polished enough to demo
- Security checks passed
- Does NOT need: every tier feature, every AI integration, perfect polish

---

## Source Files

- `C:\Users\hanna\offload\` — The code repo (clean, on master)
- `C:\Users\hanna\OneDrive\Documents\MSIS522_Offload\` — Original class materials (reference only)

---

## Archived — Resolve History

Decisions made during design question resolution. Kept for traceability.

### Resolved 2026-03-24
- **#3 Onboarding Design** → 3-layer funnel (Hook → Menu → Ongoing Discovery)
  1. **Layer 1 "The Hook"** — automatic essentials walkthrough (adding tasks, Nudge, schedule). Short, fun, everyone gets it. Video intro plays here.
  2. **Layer 2 "The Menu"** — opt-in feature discovery. Tier-specific feature list with playful descriptions. "Recommended next" highlights driven by symptom questionnaire results. Leave anytime.
  3. **Layer 3 "Ongoing Discovery"** — Nudge passively tracks unexplored features and drops tips/suggestions at AI-determined optimal engagement times. Contextual ("hey, did you know...") and celebratory ("you're slaying it!"). Always backs off gracefully.
- **#11 "Option to ease in"** → Resolved via #3. Layer 1 IS the ease-in. No separate feature needed.
- **#7 Notifications** — connection noted. Layer 3's AI-optimal timing informs notification design.
- 3 new ideas captured in todo.md: symptom questionnaire placement, preview video placement, higher-tier trial option.

### Resolved 2026-03-25
- **#4 Countdown Timer / Seconds Warning** → Seconds framing is IN as default. "Have you started?" check-ins approved in concept, tracking mechanics deferred to #8/#15. Alert fatigue guardrails deferred to #7. Written to ai-systems.md.

### Resolved 2026-03-26
- **#5 Cut-Off Times vs. Productivity Zones** → Keep both. Zones = preferences, cut-offs = hard walls. Written to scheduler.md.

### Resolved 2026-03-30
- **#6 Chatbot — Unified or Separate?** → One unified Nudge with capability modes. Tier-gated intelligence. Partially resolves #13, #16, #17. Written to ai-systems.md.
- New principle established: safety & privacy at every step (now in project-scope.md).

### Resolved 2026-03-31
- **#7 Alerts / Nudges / Notifications System** → The Navi Rule. Written to ai-systems.md.
- New principle established: wellness, not healthcare (now in project-scope.md).
- 4 new ideas captured in todo.md.
