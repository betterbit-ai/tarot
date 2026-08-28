# Architecture Proposal

Selected: Next.js App Router with one interactive client ritual, thin server share/OG/affiliate edges, framework-light domain modules, static reading data, and no database. Full reasoning and rejected options are in `docs/ARCHITECTURE.md` and `decisions/0001-application-architecture.md`.

The stable seams are `lookupReading()`, versioned share tokens, typed analytics events, and a validated affiliate redirect. These allow object storage, a database, or a vendor analytics adapter to be introduced later without coupling the ritual UI.
