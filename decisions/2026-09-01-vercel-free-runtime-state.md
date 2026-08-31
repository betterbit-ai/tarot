---
date: 2026-09-01
scope: project
status: active
source: operator-request
supersedes: 2026-08-31-github-actions-publish-trigger.md
---

# Use Vercel routes and Upstash REST for free-tier deployment portability

## Decision

Host the Next.js application and protected Growth Engine endpoints on Vercel. Keep GitHub Actions as the daily scheduler, and store the small mutable Threads runtime state in Upstash Redis through its server-side REST API.

## Context and constraints

The Netlify team paused production deploys after exhausted deploy-capable credits. The user explicitly requires a free Vercel setup and does not want a paid plan. Vercel Hobby can deploy the Next.js site, but Netlify Blobs cannot accompany it. The project only needs a tiny one-writer state document plus a token record, and already isolates that contract behind `ContentStateStore`.

GitHub Actions has the existing daily trigger and can call three protected Vercel routes. This avoids depending on free-plan cron timing precision. Upstash REST uses HTTPS and native `fetch`, so the serverless adapter needs no new runtime package.

## Alternatives considered

- Keep Netlify Blobs and host only the UI on Vercel: rejected because the production platform is paused and would retain an active Netlify dependency.
- Use Vercel KV: rejected because Vercel KV has been sunset.
- Use Vercel Cron for all work: rejected because free-plan execution timing can drift by up to an hour and the project already has GitHub Actions schedules.
- Put runtime queue state in Git commits: rejected because scheduled mutations would create noisy commits and race with normal development.

## Reversibility

The legacy Netlify adapters remain until Vercel routes pass dry-run deployment verification. The publisher domain contract and source queue remain unchanged, so a different JSON-capable state store can replace the Upstash edge adapter later.

## Revisit when

Revisit if GitHub scheduled workflows prove unreliable, traffic exceeds the free Upstash allowance, multiple publishers require a transactional lock, or Vercel Hobby terms no longer fit the operator's use.
