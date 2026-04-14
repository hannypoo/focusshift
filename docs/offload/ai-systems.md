---
name: Offload AI Systems
description: Overview of all AI features in Offload — chatbot, coaching, nudges, NL tasks, energy prediction. How each works, prompts, edge functions, fallbacks.
type: reference
---

# Offload — AI Systems

*Being filled as design questions are resolved.*

## Nudge — Alert Behaviors

### Seconds Framing (from design question #4)
- **Default:** Nudge uses seconds for urgent alerts (e.g., "90 seconds until you need to leave for your appointment")
- **Why:** ND brains respond to seconds with more urgency than equivalent minutes. "90 seconds" triggers action; "a couple minutes" doesn't.
- **Applies to:** Anchored/time-sensitive blocks only — appointments, departures, fixed events. NOT every task.
- **Customizable:** Users can switch to minutes format and adjust the lead time (more or less time) in either format. Seconds is the default because it works better for most ND users.
- **"Have you started?" check-ins:** For important blocks, Nudge can ask if the user has begun. Tracking mechanics (how Nudge knows user state) TBD — see #8/#15.
- **Alert fatigue:** Governed by the Navi Rule (see Notification System below). Not every block gets this treatment.

## Notification System — The Navi Rule (from design question #7)

**Core principle: "If a user's first instinct is to turn everything off, the defaults are wrong."**

Offload is NOT an app that spam-pings you. Most notifications default OFF or in-app only.

### Notification Categories

| Category | Delivery | Default | Notes |
|----------|----------|---------|-------|
| Time-sensitive | Push | ON | "90 seconds until..." for anchored blocks. The one interruption that's justified. |
| Periodic Checklist | Push (opt-in) | ON | Clean to-do list pops up a few times/day. Check off = dopamine. Celebratory baked in. If opted out of push, in-app checklist still exists. |
| Essential reminders | Push | ON | User-defined only ("remind me to take meds"). User explicitly asked for this. |
| Discovery | In-app only | ON | Feature tips when user is already in that area. Smart/pattern-based = Full Send only. Never push. |
| Check-ins | In-app only | ON | Light "how's today going?" when user opens app. Never unsolicited push. |
| Emotional support | N/A | N/A | Not a notification — a response mode. User comes to Nudge, Nudge responds and considers productivity impact. |

### Key Behaviors
- **Checklist early completion:** When user checks off something early, Nudge responds — "I rearranged things, want me to fill the time or do you want free time?"
- **Smart throttling:** Nudge batches nearby alerts. Never 5 pings in 10 minutes.
- **Fatigue detection:** If user ignores notifications, Nudge backs off. Pattern AI feeds this (higher tiers).
- **Customizable:** Clean notification settings area where users choose what + how. Hannah's defaults are the automatic setting.

## Nudge — Unified Chatbot Architecture (from design question #6)

### User-Facing: One Nudge, Many Capabilities
Nudge is ONE personality the user builds a relationship with. No separate bots. Capabilities:
1. **Schedule help** — "squeeze this in," reschedule, what's next
2. **Task creation** — natural language ("add dentist Thursday at 2")
3. **Coaching/check-ins** — habit questions, "have you started?", energy check
4. **Emotional support** — unload mode, impulse control ("let's sleep on it")
5. **App help** — FAQ, feature discovery, "how do I..."
6. **Talk-it-out** — symptom setup, goal setting, thinking out loud

Under the hood: different prompt contexts or sub-agents per mode. User never sees the seams.

### Backend: Professor's Multi-Layer Architecture
1. **Nudge (conversational AI)** — all user-facing interaction. Every message stored.
2. **Retrieval layer (vector DB)** — Nudge pulls from past conversations for continuity ("remember when you said Thursdays are hard?").
3. **Pattern detection AI** — separate background AI reads conversation history + task completions + energy logs. Writes notes Nudge can reference. ("User skips workouts on Mondays", "energy crashes after back-to-back meetings").
4. **Dopamine-aware tracking** — task completions and check-ins feed the system in ways that feel rewarding, not like homework. THE core UX problem to solve.

### Tier Gating
All tiers talk to the same Nudge — capabilities expand with tier:
- **Freebie:** Basic schedule help, task creation, FAQ. Nudge is stateless (no memory).
- **Help Me:** + coaching, "squeeze this in." Short-term memory (this week). Basic pattern detection.
- **In My Era:** + emotional support, talk-it-out, impulse control. Longer memory. Habit patterns + behavioral insights.
- **Full Send:** Everything. Full conversation history. Proactive suggestions. Deep analytics.

Upgrade incentive is natural — users notice Nudge doesn't remember or catch patterns, and *want* more. Not a paywall, a genuine "oh, I want that" moment.
