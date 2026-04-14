---
name: Offload to-do list
description: Offload product backlog — features, fixes, and ideas that need review and placement in build plan
type: project
---

# Offload To-Do List

## Next Up
- [ ] **PRIORITY:** Demo mode vs full platform architecture — should we keep one codebase with a demo mode toggle (no auth, sample data, "sign up for more") vs full mode (auth, real data, tiers)? Need to decide: clean existing demo code into a proper demo module, what demo mode looks like (no Supabase, local/mock data, stateless Nudge), entry points (/demo vs /app or subdomains), how this affects the build plan phases. Route through /resolve. (added 2026-04-14)
- [ ] Execute system redesign — see system-redesign.md for the full 17-step plan (added 2026-03-31, updated 2026-04-13)
- [ ] Discuss risk of AI hallucinations — how do we handle Nudge potentially giving wrong info, bad schedule advice, or fabricated pattern insights? What guardrails prevent Nudge from confidently saying something incorrect? Important for trust, safety, and the wellness-not-healthcare principle. (added 2026-04-02)

## Pre-Launch
- [ ] Landing page design discussion — slogan + cinematic video + short blurb, tier cards with demo videos showing features per tier, free tier video shows main aspects, each upgrade tier shows what's added, tier selection before onboarding, onboarding is tier-dependent (added 2026-03-14, moved from decisions-pending)
- [ ] Pay for Supabase (upgrade from free tier before going live — free tier auto-pauses after 7 days inactivity)
- [ ] Beta testing program: build admin ability to grant any tier to test users for free
  - Recruit ADHD people to test each tier (Freebie, Help Me, In My Era, Full Send)
  - Gather feedback and usage data per tier before public launch
  - Make changes based on tester feedback before going live
- [ ] Landing page (replace login as homepage)
- [ ] Fix Supabase auth redirect URL (Site URL + Redirect URLs in dashboard → Authentication → URL Configuration) — currently breaks email confirmation flow

## UX Improvements
- [ ] Revisit location/address input UX — current flow is clunky for ADHD users
  - Nominatim autocomplete is inaccurate (wrong zip, missing city, no house numbers)
  - Consider: Google Places API (paid but accurate), or let chatbot handle it ("I'm going to 316 Solnae Pl")
  - Reduce friction: don't make users go to a separate Profile section to add addresses
  - Maybe infer locations from tasks/appointments instead of manual entry
  - Home + frequent locations in profile is fine, but one-off addresses should be easier
- [ ] Full UI/UX overhaul — every page needs to be redesigned for neurodivergent users

## Features
- [ ] Rebuild category/type system with broad types + optional subcategories
  - Replace current TaskType enum with 10 broad types: Appointments, School, Work, Family & Social, Health & Fitness, Self-Care, Spirituality, Chill/Recreation, Errands, General
  - Each broad type has a signature color for calendar/timeline visual identity
  - Optional subcategories under each (e.g. Family & Social → Family visit, Friend hangout, Date, Phone call)
  - Auto-suggest broad type from title keywords (existing logic), subcategory only shown if user taps to expand
  - Existing categories become subcategories — migration needed for DB enum + scheduler
  - Weekly breakdown chart: color-coded time allocation by broad type (tiered feature)
  - Subcategory detail drill-down for users who want granularity
  - New DB columns: broad_type on recurring_tasks + tasks, subcategory_id replaces category_id
  - Update scheduler to use broad types for energy/zone matching instead of category priority

## Uncategorized Ideas
- [ ] Nudge autonomy preference: ask "Would you like me to make changes on my own, or run them by you first?" Two modes: (1) "Just handle it" — Nudge makes decisions automatically, only asks about big changes (2) "Run it by me" — Nudge proposes changes and waits for approval. Default should be "just handle it" because decision paralysis is the whole problem. Key insight: asking too many questions IS the problem for neurodivergent users. Fewer decisions = better. (added 2026-03-17)
- [ ] Smarter block classification for Nudge — it needs to understand which blocks are truly movable vs anchored. Not just `is_fixed`, but prep chains too (shower → get ready → drive) that are tied to a fixed event should be treated as a unit. When compacting or rescheduling, Nudge needs to decide: should a displaced block be shortened to fit the remaining time, or moved to another day entirely? This is a core scheduling intelligence problem. (added 2026-03-21)
- [ ] Collaborative schedule adjustment — after Nudge proposes changes (e.g., compressing blocks to fit a grocery trip), let the user specify which blocks to reduce/keep. Requires: natural language parsing of user preferences ("keep beardies full, reduce call mom"), constraint solver to hit the exact time target with user's preferred reductions, fallback to proportional if preferences don't add up. Build on top of the current proportional compression logic in demoActions.ts. (added 2026-03-22)
- [ ] Smart follow-ups on unclear situations — when the user says something vague like "I'm behind" or "everything's a mess," Nudge should ask clarifying questions to understand the scope before acting. E.g., "How far behind are we talking?" or "What's the most urgent thing right now?" This makes Nudge feel like it actually listens instead of just reacting. Different from autonomy preference — this is about Nudge gathering enough context to make good decisions. (added 2026-03-22)
- [ ] Emotional unload mode — let users dump everything that's overwhelming them (personal problems, stress, life chaos) and have Nudge respond meaningfully: acknowledge what they're going through, help triage what's actually actionable today vs what can wait, give schedule tips accordingly (e.g., "you need a lighter day"), and offer emotional regulation techniques (breathing, grounding, etc.). Emotional regulation features probably belong in the top tier. The key insight: sometimes the biggest barrier to executive function isn't the schedule — it's the emotional flood blocking you from even starting. Nudge should be able to meet you there. (added 2026-03-22)
- [ ] Round compressed block durations to clean 5-minute increments (e.g., 28→25 or 30, not 28) when Nudge reallocates time. ADHD users need simple, scannable numbers — not precise-but-confusing ones. Apply to grocery compression, energy crash compaction, and any future reallocation logic. (added 2026-03-22)
- [ ] Symptom questionnaire placement: should it come BEFORE tier selection (so it can give an honest tier recommendation based on symptoms, then show all tier benefits with a personalized suggestion) or AFTER tier selection (as part of profile creation)? If before: the app guides them to the right tier instead of upselling. If after: simpler flow but they might pick wrong. Needs discussion. (added 2026-03-24)
- [ ] Preview video placement — where do demo/preview videos live? On the landing page per tier? Inside onboarding? In the feature menu? Need to decide placement and whether videos are tier-specific or general. (added 2026-03-24)
- [ ] Make sure people are able to have their schedules set to the correct time zone (added 2026-03-29)
- [ ] Brainstorm: how to accommodate users who have no interest in checking in throughout the day — the periodic checklist is great for some, but what's the alternative experience for people who just want to set-and-forget? (added 2026-03-31)
- [ ] Rewards system deep dive — this is a major feature that needs its own design pass. Adaptive rewards, user-defined rewards, how it ties into checklist + goals + habits, how rewards scale (more when struggling, spaced out as user improves), fixed vs Nudge-managed. What counts as an accomplishment? How granular? How do we avoid it feeling like a chore or a game that loses novelty? (added 2026-03-31)
- [ ] Wellness vs healthcare line — where exactly is the boundary? Rewards system tracks accomplishments, emotional support helps productivity, pattern detection notices trends. How do we frame all of this so it's clearly wellness/productivity and doesn't create healthcare/regulatory exposure? May need legal input eventually. Important for marketing, terms of service, and feature naming. (added 2026-03-31)
- [ ] Notification settings UI — needs its own design pass. Must be really clean, not overwhelming. Users can customize what they're notified about and how, but the defaults (Navi Rule defaults) should be so good most people never touch it. This feels like its own feature/design challenge. (added 2026-03-31)
- [ ] Welcome page / home screen layout — what do users see when they log in? Idea: screen split into 3 sections: (1) Checklist, (2) Today's schedule, (3) Quick access to settings, schedule creator, goals, habits, etc. Needs design discussion. (added 2026-03-31)
- [ ] Nudge daily rundown — option to have Nudge give you a summary of your day at the beginning of the day. "Here's what's on your plate today..." Could be in-app when you first open, or push if user opts in. (added 2026-03-31)
- [ ] Tab-based navigation — separate tabs for different core experiences: Scheduler, Goals, Habit Changer, Emotional Support/Community (more tabs TBD). Each tab should feel engaging and make you *want* to participate — names and framing matter. Not just utility screens, but spaces that pull you in. Tab names to be workshopped later. (added 2026-03-30)
- [ ] Discuss business plan details — what should the business-model.md doc contain? At minimum: tier pricing strategy, revenue model, launch strategy, target market, competitive landscape, cost structure (Supabase, AI API costs, hosting). Some of these are already scattered across todo — consolidate into business-model.md through resolve. (added 2026-03-31)
- [ ] Launch strategy — how does launching actually work? Questions to decide: (1) Should there be a permanent demo people can play with before signing up? (2) Should it be free initially? (3) Should early access be limited to people with neurodivergencies for feedback + people in Hannah's network/LinkedIn who might be interested or connected to companies? (4) How do we get it in front of the right people? (5) What's the difference between beta testing (todo: pre-launch) and a public soft launch? (added 2026-03-31)
- [ ] Tier pricing — what do the tiers actually cost? Research comparable apps (Structured, Tiimo, Routinery, etc.). Consider: monthly vs annual, student discount, free tier limitations that encourage upgrading without feeling punitive. (added 2026-04-13)
- [ ] Target market definition — who exactly is this for? Primary: adults with ADHD/executive dysfunction. Secondary: neurotypical people who struggle with time management. Tertiary: parents/caregivers managing neurodivergent family members' schedules? Need to define for marketing, messaging, and feature prioritization. (added 2026-04-13)
- [ ] Competitive landscape — what exists, what's missing, where does Offload win? Apps to research: Structured, Tiimo, Routinery, Focusmate, Goblin Tools, Motion, Reclaim. Key differentiator is probably the AI + emotional support + neurodivergent-first design. (added 2026-04-13)
- [ ] Cost structure — what does it actually cost to run Offload? Supabase (current free tier, what paid tier?), AI API calls per user (Claude/OpenAI pricing × estimated usage), Vercel hosting, domain, any other services. Need real numbers to set tier pricing. (added 2026-04-13)
- [ ] Pick the chatbot name — Nudgely, Noodle, or Squirrel? Or keep "Nudge" as default with nickname system later? (added 2026-04-13, see business-model.md)
- [ ] Professor's advice — behavioral tracking AI infrastructure: (1) Store every single conversation with Nudge, use a retrieval system with a specialized database (vector DB?) so the AI can refer back to past conversations. (2) Second AI layer that goes through conversations to detect patterns and make small notes automatically. (3) THE ELEPHANT IN THE ROOM: how do we track what users have and haven't done in a way that gives them a dopamine hit and doesn't feel like work? Essential for pattern tracking — task completion tracking needs to feel rewarding, not like a chore. (4) All data feeds into the tracking database — conversations, task completions, logged energy entries, everything. All of it is training data for the pattern learning engine. (added 2026-03-18, from professor feedback)

---

## Someday / Maybe

*Items below are interesting but not MVP-critical. /resolve skips these unless Hannah specifically asks. Revisit after launch.*

- [ ] Nudge nickname system: let users pick or create their own name for the AI assistant. Default "Nudge" but opt into fun names like Nudgely, Nudgelstine, etc. App encourages it: "I go by Nudge, but my friends call me all kinds of things." Different voice options (warm, playful, calm). On native app, train custom wake words for each nickname variant. The "-ly" suffix is very neurodivergent speech — keep it as a beloved option, just not the only one. Non-native English speakers may struggle with made-up words, so default stays simple. (added 2026-03-17)
- [ ] Transit-aware travel: ferry schedules, bus/train/light rail departure times. Users who take ferries (e.g. Bremerton-Seattle), trains, light rail need schedule-aware travel. System should know: departure times, travel duration, which locations require transit. Should work backwards from departure time (e.g. "ferry at 3:10 = leave house by 2:30"). Consider transit API integration (GTFS feeds, Google Directions transit mode). Interim: let users manually set "transit departure times" per route. (added 2026-03-14)
- [ ] Community channel / social hub — Offload hosts themed community sections where users can chat, share tips, stay in contact, and message each other. Could include: topic-based rooms (productivity hacks, emotional support, habit wins), direct messaging between users, a feedback section where an AI agent constantly analyzes user feedback and generates improvement suggestions backed by data/numbers. Could live inside the Emotional Support tab as a combined "Support & Community" section — so it's both personal (Nudge emotional support) and social (peer community). Privacy and moderation are big considerations. (added 2026-03-30)
- [ ] Higher-tier trial option — should we offer a time-limited trial of a higher tier so users can experience premium features, then choose to continue or drop down? Could reduce tier selection anxiety and let the product sell itself. (added 2026-03-24)
