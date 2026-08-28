# 오늘의 타로 Project Map

## PROJECT GOAL

운영 가능한 한국어 모바일 우선 3카드 타로 리추얼을 제공한다. 사용자 계약은 `docs/PRODUCT_SPEC.md`의 전체 흐름이다.

## SOURCE OF TRUTH

코드, `spec/`, `docs/`, `decisions/`, `learnings/`, `data/`, `generation/`, Git 기록이 작업 상태의 근거다. 대화 기억에 의존하지 않는다.

## ARCHITECTURE DOCS

- 제품: `docs/PRODUCT_SPEC.md`
- 구조: `docs/ARCHITECTURE.md`
- 디자인: `docs/DESIGN_SYSTEM.md`
- 타로 도메인: `docs/TAROT_SPEC.md`
- 데이터: `docs/DATA_ARCHITECTURE.md`
- 결정: `decisions/`

## CODING RULES

- 도메인 로직은 프레임워크와 분리한다.
- 질문 원문은 URL, 공유 토큰, 분석 이벤트에 넣지 않는다.
- 일반 리딩에 런타임 LLM을 사용하지 않는다.
- 새 의존성은 실제 복잡도를 줄일 때만 추가한다.
- 작은 변경 단위로 구현하고 검증한다.

## DESIGN RULES

- 한국어 모바일 우선, 한 화면에 주 행동 하나.
- AI SaaS, 챗봇, 보라색 글로우, 과한 스파클을 금지한다.
- transform/opacity 모션을 우선하고 reduced motion을 지원한다.
- 사용자에게 보이는 문구에 em dash 또는 en dash를 쓰지 않는다.

## TEST COMMANDS

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm tarot:validate`, `pnpm tarot:status`

## CURRENT HANDOFF LOCATION

`docs/HANDOFF.md`

## RESUME PROTOCOL

`AGENTS.md` -> `docs/HANDOFF.md` -> `docs/ARCHITECTURE.md` -> `docs/tasks/active/` -> `git status` -> 최근 `git log` 순서로 읽고, 완료된 작업을 반복하지 않는다.

<!-- CODEX-PROJECT-HARNESS:START -->
## Codex Project Harness

### Lifecycle

- Define or update `spec/mission.md` with `$harness-interview` before major
  product-direction work.
- Define the active feature in `spec/spec.md` with `$harness-spec` before
  implementation.
- Implement only the approved scope with `$harness-implement`.
- Run `$harness-verify`, then `$harness-review`, before
  `$harness-ship`.
- Use `$harness-help` when the next step is unclear.

### Working agreements

- Read active decisions and relevant learnings before changing related code.
- Keep changes small, reviewable, and reversible.
- Preserve existing behavior with regression tests before risky refactors.
- Do not claim completion until the configured checks pass.
- Record reusable debugging lessons in `learnings/` and material choices in
  `decisions/`.
- Prefer the simplest design that satisfies the current spec.

### Verification commands

Run through `node .codex-harness/scripts/verify-project.mjs`:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check`

### Completion evidence

Final reports must state changed files, checks run and results, known gaps, and
remaining risks.
<!-- CODEX-PROJECT-HARNESS:END -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
