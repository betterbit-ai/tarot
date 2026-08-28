# Autopilot Expanded Spec

Build the exact flow and acceptance criteria in `spec/spec.md`, using the architecture decisions under `decisions/`. The first production slice must complete the full ritual with deterministic fallback readings. The second slice adds share re-entry and offline generation tooling. The final slice completes browser, accessibility, responsive, performance, security, and data validation.

Open questions are resolved by reversible defaults:

- non-shared refresh starts a clean ritual
- question lives only in client memory
- missing exact reading uses deterministic connected fallback
- share token contains only version and ordered card ids
- reading copy stays within concise mobile length budgets
- affiliate disclosure is explicit and must receive final operator policy review
