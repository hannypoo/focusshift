---
name: Offload Scheduler
description: 5-stage scheduling pipeline deep dive — ANCHOR, TRAVEL, BUFFER, FILL, OVERLAP. Energy system, reshuffling logic.
type: reference
---

# Offload — Scheduler Engine

*Being filled as design questions are resolved.*

## Cut-Off Times (from design question #5)
- **Hard boundaries** the scheduler cannot place blocks past — separate from productivity zones
- **Evening cut-off**: "After 8pm I'm done" — no blocks scheduled past this. Wind-down buffer begins here.
- **Morning cut-off**: "Don't start before 10am" — nothing placed before this.
- **User-configurable**: set your own walls per your rhythm
- **Distinct from productivity zones**: zones say *what kind* of work goes where (preference). Cut-offs say *where work stops entirely* (boundary).
- **Implementation**: scheduler already has wake/wind-down in ANCHOR phase — cut-offs formalize when those kick in
