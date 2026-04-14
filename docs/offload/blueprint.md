---
name: Offload Core Blueprint
description: Shipped-reality spec for Offload — only contains what's actually built, deployed, and established. Updated after each build phase is finalized.
type: reference
---

# Offload — Core Blueprint

*This doc contains ONLY what's built and shipped. Design decisions live in session-state and build-plan until they're implemented and deployed.*

## Vision
ADHD-adaptive daily scheduler that tells you what to do NOW. Your brain works differently — your tools should too.

## What's Built

### Scheduler Engine
- Energy-aware task ranking and block duration scaling
- Mid-day energy adjustment (compact modal, not morning gate)
- Reshuffle logic for remaining blocks on energy change
- Anchored vs movable block classification
- Buffer time scaling by energy level
- Phase-based daily schedule generation

### Auth & Infrastructure
- Supabase auth (email — redirect URL needs fix, see todo)
- Supabase database with task/schedule/recurring tables
- Vite + React + TypeScript frontend
- Deployed via Supabase
