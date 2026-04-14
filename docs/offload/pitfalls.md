---
name: Offload Pitfalls
description: Common gotchas and platform-building issues — things that waste time if you don't know about them. Checked by /build during wrap-up. Any agent can add here.
type: reference
---

# Offload — Pitfalls

Common gotchas when building platforms. Not project-specific bugs — general knowledge that saves time. /build checks relevant sections during phase wrap-up.

**How items get here:**
- We hit a problem during building and it's general enough to happen again → add it
- /resolve identifies a gotcha during design discussion → routes here
- /mother notices something recurring in build-progress → promotes it here

**When items leave:**
- Permanently fixed (e.g., upgraded a tool) → delete
- No longer relevant (e.g., switched away from that tech) → delete
- Offload-specific one-time issue → belongs in build-progress, not here

---

## Environment / Tooling
- Windows: use `npx.cmd` not `npx`
- Git line endings can cause phantom diffs on Windows — configure `.gitattributes`

## Supabase
- Writes need `service_role` key, reads use `anon` key
- Free tier auto-pauses after 7 days of inactivity — upgrade before going live
- RLS policies block everything by default — if reads return empty, check policies first
- Auth redirect URLs must be configured in dashboard (Authentication → URL Configuration) — easy to forget after deploy

## Git / GitHub / Deployment
- GitHub push can fail with "Internal Server Error" — retry usually works
- Vercel preview deploys take 1-2 minutes — don't panic if the URL shows "building"
- Branch names with special characters can break Vercel preview URLs — keep them simple (lowercase, hyphens)

## API Keys / Security
- Never put API keys in client-side code — they're visible in the browser bundle
- Environment variables prefixed with `VITE_` are exposed to the client in Vite projects — only prefix public keys
- Supabase anon key is meant to be public, service_role key must NEVER be client-side

## React / TypeScript / Vite
- TypeScript strict mode flags unused variables — clean them before deploy or build fails (TS6133)
- Vite dev server and production build can behave differently — always test the production build before deploying

## UI/UX
- *(filled as we build)*

## Scheduler / AI
- *(filled as we build)*
