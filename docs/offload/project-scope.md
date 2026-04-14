---
name: Offload Project Scope
description: Product principles, boundaries, and guardrails — wellness not healthcare, privacy-first, and other non-negotiable rules that shape every design and build decision
type: reference
---

# Offload — Project Scope & Principles

Non-negotiable rules that apply across all design, build, and product decisions.

---

## Wellness, Not Healthcare

Offload is a productivity and wellness app, NOT a healthcare app.

**Why:** Hannah wants to track patterns, support emotional needs, and adapt to how users are doing — but doesn't want to enter "healthcare" territory. This matters for: how features are framed (wellness vs medical), what data we collect and how we label it (behavioral patterns vs health records), regulatory exposure (HIPAA doesn't apply if we're not a healthcare provider), and user expectations.

**How to apply:** When designing features that touch emotions, habits, energy, or behavioral patterns — frame as productivity/wellness, not clinical.
- "Nudge notices you've been skipping workouts" = wellness
- "Nudge diagnoses your depression pattern" = healthcare
- Rewards system tracks accomplishments, not symptoms
- Emotional support is "helping you get back on track," not "therapy"

This line matters for legal, regulatory, and product identity reasons.

---

## Safety & Privacy at Every Step

Address security and privacy as they arise — don't defer to a single checkpoint at the end.

**Why:** Offload stores sensitive data: conversations with Nudge, behavioral patterns, emotional unloads, community messages, health-adjacent symptom data. Deferring security to a single audit at the end risks baking in problems that are expensive to fix. With community features and AI pattern tracking, privacy decisions shape the architecture.

**How to apply:** During /resolve and build work — flag privacy and security implications as they come up. Examples:
- Data retention policies for Nudge conversations
- Community moderation/anonymity
- What tier-gated data is stored vs discarded for free users
- HIPAA-adjacent considerations for symptom data
- Encryption at rest for emotional unloads

Treat these as design decisions, not afterthoughts.

---

## Other Principles

- **Navi Rule:** If a user's first instinct is to turn everything off, the defaults are wrong.
- **One Nudge:** One unified AI personality, many capabilities. No separate bots.
- **UI/UX is #1:** The whole app needs a visual/UX overhaul for neurodivergent users.
- **Don't restart:** The scheduler engine and backend are solid. Just the UI/UX layer needs rebuilding.
- **Ship it:** Get it out there ASAP — it's novel and could attract big-company interest. Don't let perfect be the enemy of shipped.
- **Blueprint = shipped reality only:** Design decisions stay in session-state/build-plan until built and deployed.
