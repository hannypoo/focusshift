---
name: Offload Design Questions
description: 17 items from the original brainstorm that need resolving — redundancies, unclear ideas, contradictions. Work through with /resolve.
type: reference
---

# Offload — Design Questions

Resolve redundancies, unclear items, and contradictions so each idea finds its proper home in the blueprint or build plan.

---

### 3. Onboarding Design [RESOLVED]
**Resolution:** 3-layer onboarding funnel:
- **Layer 1 — "The Hook"**: Automatic, everyone gets this. Fun, engaging guided walkthrough of essentials only (adding tasks, Nudge, schedule generation). Short enough for a low-spoons day. Goal: get them using the app and feeling good, not understanding everything. Video intro plays here.
- **Layer 2 — "The Menu"**: Opt-in, self-paced. After the hook: "Want to keep exploring, or get comfortable first?" Shows tier-specific feature list with playful descriptions. Features highlighted as "recommended next" based on symptom questionnaire results (what they struggle with most). Can leave anytime.
- **Layer 3 — "Ongoing Discovery"**: Passive, AI-driven. Nudge tracks unexplored features. Drops tips at optimal times based on pattern recognition of when user actually engages with Offload. Celebratory nudges ("you're slaying it!"). Contextual tips when user manually does something a feature would automate. FAQ/help always accessible. If user declines, Nudge backs off and reminds them it's always available.
- **Key principles**: Not optional (everyone gets Layer 1) but not overwhelming. No scheduled returns — Nudge watches for the right moment. Notifications only at AI-determined optimal engagement times. Everything should feel like Nudge is taking care of them, not adding homework. "This is Offload after all."
- **Symptom questionnaire placement**: Open question — before tier selection (to give honest tier recommendation) or after (as part of profile setup). See todo.md.
- **Connections**: Partially resolves #11 (ease in = Layer 1). Informs #7 (notification timing = Layer 3's AI-optimal delivery).

### 4. Countdown Timer / Seconds Warning [RESOLVED]
**Resolution:** Seconds framing is IN. Nudge uses seconds by default (e.g., "90 seconds until you need to leave") instead of minutes for urgent alerts — hits different for ND brains. Applies to anchored/time-sensitive blocks only (appointments, departures, fixed events), not every task. Users can customize: switch to minutes format and adjust the lead time (more or less) per their preference. "Have you started?" check-ins for important blocks — concept approved, but tracking mechanics deferred to #8/#15. Original countdown timer UI stays rejected — this is about Nudge's voice, not a visual timer. Alert fatigue guardrails designed in #7.
**Connections:** Informs #7 (notification rules + fatigue). Tracking mechanics deferred to #8 + #15.

### 5. Cut-Off Times vs. Productivity Zones [RESOLVED]
**Resolution:** Keep both — they do different jobs. Productivity zones = preferences (what kind of work goes where). Cut-off times = hard boundaries (no blocks past this point, period). Add morning cut-off too ("don't start before 10am"). Scheduler treats cut-offs as walls — nothing placed outside them. Wind-down buffer begins at evening cut-off. Builds trust with ND users by respecting their limits.

### 6. Chatbot — Unified or Separate? [RESOLVED]
**Resolution:** One unified Nudge with multiple capability modes — not separate bots. User always talks to one personality. Capabilities: (1) Schedule help, (2) Task creation via NL, (3) Coaching/check-ins, (4) Emotional support + impulse control, (5) App help/FAQ, (6) Talk-it-out for setup/goals. Under the hood, different prompt contexts or sub-agents power each mode, but user never sees the seams. Professor's multi-layer architecture fits perfectly underneath: retrieval/memory layer + background pattern detection AI + dopamine-aware tracking — all feeding one Nudge, gated by tier. Freebie gets basic Nudge; higher tiers unlock memory, pattern detection, deeper coaching. Partially resolves #13, #16, #17.
**Connections:** Resolves overlap with #13 (AIs = Nudge capabilities), #16 (habit bot = coaching mode), #17 (lesser of two evils = scheduling mode). Professor's infra advice (todo.md) is the backend architecture, not a separate bot.

### 7. Alerts / Nudges / Notifications System [RESOLVED]
**Resolution:** Unified under the **Navi Rule** — if a user's first instinct is to turn everything off, the defaults are wrong. Most things default OFF or in-app only. Core system:
- **Time-sensitive alerts** — "90 seconds until..." for anchored blocks. The one thing that SHOULD interrupt. Default ON.
- **Periodic Checklist** — replaces "task transition" pings. Clean to-do list pops up on phone periodically. Users check off what they did (dopamine hit). Celebratory moments baked INTO the checklist. If done early, Nudge offers to rearrange or give free time. If user opts out of push checklist, the in-app checklist still exists with celebratory built in.
- **Rewards System** — its own feature, not a notification. Users input what makes them feel rewarded. Nudge grants rewards for accomplishments (hard task on time, daily habits, staying on task, completing X of Y tasks). Adaptive: more rewards when struggling, spaced out as user improves. Fixed schedule OR Nudge-managed. Goal completion = auto reward. Habit milestones = bigger/special reward. Ties into checklist and goals.
- **Discovery** — in-app ONLY, never push. Pattern-based smart discovery = Full Send only. Lower tiers = contextual suggestions when user is already in that area.
- **Check-ins** — in-app only when user opens Offload. No unsolicited push. Light touch: "how's today going?"
- **Emotional support** — NOT a notification category. It's a response mode — Nudge responds to user's emotional needs and considers how it affects near/extended-term productivity. User-initiated (they come to Nudge), not pushed.
- **Essential reminders** — user-defined only ("remind me to take meds at 9am"). User explicitly asked to be interrupted.
- **Defaults** — Hannah's discussed settings are the automatic defaults. Users can customize everything in a clean notification settings area, choosing what to be notified about and how.
- **Design principle: Wellness, not healthcare.** Offload is a productivity and wellness app. We track patterns and support emotional needs, but we do NOT cross into medical/healthcare territory. Frame everything as productivity + wellness.
**Connections:** Informs #4 (seconds alerts = time-sensitive category). Rewards system is a new major feature. Notification settings UI needs its own design pass (see todo.md).

### 8. Automatic Time Tracking
**Status:** Unresolved
**The mess:** AI Learning Loop (analyzeCompletionPatterns) already landed. New: tracking what people are doing for auto-check-off, auto time calculation. Same system or different?

### 9. Habits vs. Goals
**Status:** Unresolved
**The mess:** Weekly goals landed (shower 2x/week, see son X days). New: "Habit changer" — explicitly different from goals. Need example to clarify difference.

### 10. "Magic Button"
**Status:** Unresolved
**The mess:** "Specify what the magic button is" — completely undefined. Need clarification or shelve.

### 11. "Option to ease in" [RESOLVED — via #3]
**Resolution:** This IS Layer 1 of the onboarding funnel. The "ease in" is the Hook — essentials only, short, low-pressure. Users graduate to Layer 2 (feature menu) and Layer 3 (ongoing discovery) at their own pace. No separate feature needed.

### 12. Sign-In Process
**Status:** Unresolved
**The mess:** "Where should the sign in process happen? At" — sentence cut off. Need to clarify.

### 13. "Create AI's"
**Status:** Unresolved
**The mess:** Which AIs beyond the 4 planned? Chatbot sub-agents?

### 14. Current Goals → Slow Increase
**Status:** Unresolved
**The mess:** "What they currently do for goals - slow increase" — baseline then ramp up?

### 15. Task Completion — Timer vs. Check-Off
**Status:** Unresolved
**The mess:** "Are we calculating when it's done based on checking it off?" — how do tasks end?

### 16. Habit Bot + Bad Ideas Handler
**Status:** Unresolved
**The mess:** Bot for habit questions, "bad ideas" get "let's sleep on it" — impulse control coach? Overlaps with chatbot (#6).

### 17. Lesser of Two Evils
**Status:** Unresolved
**The mess:** Decision paralysis helper — present 2 tasks, pick one? Standalone feature or chatbot capability?

### 18. Hobbies Space
**Status:** Unresolved
**The mess:** "Leave space for hobbies because ADHD people tend to be crafters" — a category? A tracker? A scheduling rule?

### 19. Hyperfocus Detection
**Status:** Unresolved
**The mess:** Detect extended blocks, warn about missed tasks, offer reshuffle. Clear concept but needs scoping — how does it detect? Timer-based? Manual?
