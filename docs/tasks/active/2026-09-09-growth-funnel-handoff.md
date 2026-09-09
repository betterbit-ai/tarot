# Growth Funnel / Scene Hook Handoff

작성 시각: 2026-09-09 KST

## Objective

1. 참고 Threads 글의 원칙을 예약 콘텐츠 전체에 적용한다.
2. 매일 Threads 성과, 미스터 타로 유입, 리딩 진행, 쿠팡 클릭을 한 화면에서 본다.
3. 가장 큰 이탈 구간을 데이터로 찾아 다음 훅과 퍼널을 개선한다.
4. 질문 원문이나 개인 식별자를 수집하지 않는다.

참고 글: <https://www.threads.com/share/BATpsElbiQ/>

## What Was Read From the Reference Thread

공유 글의 본문과 7개 연속 답글을 Chrome에서 모두 읽었다. 작성자가 보고한 핵심 실험은 다음과 같다.

- 본문은 같고 첫 줄만 바꿨을 때, 추상적인 `여름에 잠 못 자시죠`는 조회 380, `새벽 3시에 깨서 에어컨 1도 내린 적 있으신 분`은 1만 이상이었다.
- `손 건조하신 분`보다 `설거지하고 핸드크림을 발랐는데 10분 만에 다시 갈라진 적` 같은 장면형 문장이 저장에서 더 강했다.
- 정보를 바로 준 문장보다 독자가 이미 생각한 답을 먼저 지우고 정보를 늦게 준 문장의 완독률이 두 배 이상이었다.
- 글이 정리한 원칙은 숫자로 시간을 박기, 정보를 늦게 주기, 설명 대신 기억을 꺼내는 순간 쓰기다.

## Completed in This Session

### Durable spec and decision

- `spec/spec.md` 맨 위에 `Scene hook + daily funnel observability` active iteration을 추가했다.
- `decisions/2026-09-09-first-party-funnel-analytics.md`에 개인정보 경계와 Upstash aggregate-counter 결정을 기록했다.
- Commit: `9f046f8 Make the growth funnel measurable without tracking people`

### Scene-driven hook library

- `src/domain/content/generator.ts`의 기존 추상 훅을 주제별 30개 구체 장면 훅으로 교체했다.
- 모든 훅은 숫자/시간과 관찰 가능한 행동을 포함해야 한다.
- `hookQualityError`가 숫자·시간 또는 행동 장면이 없는 문장을 거부한다.
- 105개 queue와 PNG/SVG를 전부 재생성했다.
- 다음 예약 글부터 예: `답장을 7번 고쳐 쓰고도 보내기 버튼을 누르지 못했다면.` 같은 첫 줄을 사용한다.
- `pnpm content:validate`: 105 READY, validation pass.
- Commit: `3a21a9b Make every scheduled hook recall a concrete moment`

### Anonymous daily funnel implementation

- `src/lib/analytics/events.ts`
  - Threads CTA의 validated `utm_content=mr-tarot-####`만 sessionStorage에 보존한다.
  - 같은 세션의 같은 단계는 한 번만 전송한다.
  - 질문 원문·카드 배열은 전송하지 않는다.
- `src/app/api/analytics/event/route.ts`
  - same-origin POST만 허용한다.
  - 허용된 이벤트와 source queue에 존재하는 content id만 받는다.
  - Upstash가 없으면 204로 fail-open하여 리추얼을 막지 않는다.
- `src/lib/analytics/funnel.ts`
  - KST 일자별 total/content hash counter를 120일 보관한다.
  - landing, ritual start, card confirm, result, affiliate view/skip/click, share를 집계한다.
- `src/lib/content/upstash-store.ts`
  - raw REST `HINCRBY + EXPIRE`를 `/multi-exec` transaction으로 처리한다.
  - `HGETALL`의 array/object 응답을 모두 읽는다.
- `src/app/threads/page.tsx`, `src/components/threads-content-client.tsx`
  - source queue에 live Upstash runtime status를 적용한다.
  - 최근 7일 `Threads → 타로 → 쿠팡` 표를 표시한다.
  - 날짜별 콘텐츠 id, Threads 누적 조회, 사이트 유입, 시작, 결과, 쿠팡 클릭, 전환율을 분리해 표시한다.
- `src/features/ritual/ritual-shell.tsx`
  - `landing_view`, `result_viewed`를 추가했다.
- `src/app/privacy/page.tsx`, `docs/DATA_ARCHITECTURE.md`
  - 익명 집계와 120일 보존을 문서화했다.
- `.github/workflows/sync-threads-metrics.yml`
  - 게시 전 21:10에서 게시 후 23:30 KST로 이동했다.
- Commit: `be07788 Show where the Threads funnel loses people`

## Verification Already Completed

- `pnpm content:generate --count 105`: pass
- `pnpm content:images`: 105 generated
- `pnpm content:validate`: pass
- `pnpm test`: 34 files, 99 tests pass
- `pnpm typecheck`: pass
- `pnpm lint`: pass
- `pnpm build --webpack`: compiled and generated routes successfully
- `pnpm tarot:validate`: pass during harness verification
- `pnpm tarot:status`: pass during harness verification
- `git diff --check`: pass before the commits
- Official Upstash REST documentation was checked for REST response types, `HINCRBY`, `HGETALL`, and `/multi-exec` transactions.

## Current Git State

- Branch: `main`
- Remote tracking state at handoff creation: `main` is ahead of `origin/main` by 3 commits.
- Uncommitted before this handoff commit: `docs/content/THREADS_HOOK_RESEARCH.md` only.
- The research document has been updated with the supplied 80K-view experiment and the exact current 30-hook production library.
- No `.env` or secret values were added.

## Remaining Work, in Order

### 1. Review and ship current commits

- Run `git status -sb` and inspect `git diff origin/main...HEAD` plus any current doc diff.
- Run the `harness-review` profiles: code, product, infrastructure, QA, security, design.
- Pay special attention to:
  - public aggregate endpoint abuse risk;
  - same-origin behavior on the Vercel custom domain;
  - Upstash raw `HGETALL` shape and `/multi-exec` response;
  - `/threads` being public but `robots: noindex`;
  - provider cumulative metrics not being confused with first-party daily counters.
- Commit this handoff/research document if still uncommitted.
- Push `main` to `origin/main` and wait for Vercel deployment.

### 2. Mandatory production UI/runtime check

- Use `powerplay-ui-final-check` because `/threads` and `/privacy` changed.
- Check:
  - `https://mr-tarot.vercel.app/threads` desktop and 390×844;
  - table internal horizontal scrolling without page overflow;
  - live PUBLISHED/READY statuses from Upstash;
  - Threads cumulative metrics labels;
  - empty funnel state before first attributed visit;
  - `https://mr-tarot.vercel.app/privacy` updated date and anonymous analytics section;
  - browser console and Vercel/runtime errors.

### 3. Production event smoke test

- Use a real current content id that has already been published. Do not invent a key.
- Open its exact CTA URL with `utm_source=threads&utm_medium=social&utm_campaign=growth-engine&utm_content=<id>`.
- Confirm `/api/analytics/event` accepts `landing_view` without sending question/card data.
- Start one ritual and verify `ritual_started` increments once even if React re-renders.
- Do not click Coupang merely for a test unless the operator explicitly wants a real outbound click counted.
- Refresh `/threads` and confirm the current KST row updates.

### 4. Sync and inspect real Threads metrics

- After deploy, run `gh workflow run sync-threads-metrics.yml`.
- Inspect the run body; it should report `mode: synced` and an updated count.
- Refresh `/threads` and record views/likes/replies for the latest published posts.
- If the sync silently skips individual posts, improve `MetricsSyncResult` to include failed ids/count and make the workflow surface partial failure.

### 5. Add actionable diagnosis after real data exists

- Once at least 3 attributed visits exist, add or confirm a simple “largest drop” callout:
  - low `ritual_started / landing_view`: Threads CTA and first-screen promise mismatch;
  - low `result_viewed / ritual_started`: ritual/selection/reveal friction;
  - low `affiliate_clicked / result_viewed`: product relevance, image or copy problem.
- Do not auto-edit future hooks from tiny samples. Compare at least several posts and preserve provider metrics as cumulative values.

### 6. Coupang orders/commission follow-up

- Current implementation measures only outbound `affiliate_clicked` events. This is not a sale.
- To show actual orders/cancels/commission, inspect the operating account's official Partners report API response shapes and date limits using server-only keys already in Vercel.
- Implement protected scheduled report ingestion only after that contract is verified.
- Never expose AccessKey/SecretKey, raw responses containing sensitive fields, or infer purchases from clicks.

## User Help That May Be Needed

- No help is needed for the first-party funnel deployment if the existing Vercel/Upstash/GitHub credentials remain valid.
- For actual Coupang orders and commission, the user may need to confirm that the operating Partners account has report API permission or show the non-secret response/error status from API Playground. Do not ask for the AccessKey or SecretKey; they are already configured server-side.
- If the user wants a private metrics dashboard rather than the current public noindex `/threads`, obtain a choice of authentication approach before changing access.
- If the user wants a daily notification rather than checking `/threads`, ask which destination is desired. The dashboard itself requires no additional choice.

## Paste-Ready Prompt for the Next Terra Conversation

```text
이 프로젝트는 `/Users/joelonsw/Desktop/tarot`의 미스터 타로 서비스다. 새로 만들지 말고 현재 checkpoint에서 이어서 진행해.

먼저 반드시 읽어라:
1. AGENTS.md
2. docs/HANDOFF.md
3. docs/tasks/active/2026-09-09-growth-funnel-handoff.md
4. spec/spec.md 맨 위 `Scene hook + daily funnel observability`
5. decisions/2026-09-09-first-party-funnel-analytics.md
6. docs/content/THREADS_HOOK_RESEARCH.md
7. git status, git diff, 최근 git log

현재까지 완료된 핵심:
- 전달한 Threads 글과 7개 답글을 모두 읽고 “구체 시간/숫자 + 관찰 가능한 장면 + 정보 지연” 원칙을 추출했다.
- 105개 예약 콘텐츠를 30개 주제별 장면 훅으로 재생성했다.
- 익명 UTM 퍼널 수집과 최근 7일 `/threads` 대시보드를 구현했다.
- 질문 원문, 카드 배열, IP, User-Agent, 쿠키/지속 식별자는 저장하지 않는다.
- 관련 커밋은 `9f046f8`, `3a21a9b`, `be07788`이며 현재 main은 origin/main보다 앞서 있을 수 있다.
- `docs/content/THREADS_HOOK_RESEARCH.md`와 이 handoff 문서가 아직 커밋되지 않았을 수 있으니 절대 버리지 마라.

이제 해야 할 일:
1. current diff와 세 커밋을 code/product/infrastructure/QA/security/design 관점에서 리뷰하고 문제를 수정한다.
2. full harness verify를 다시 실행한다.
3. docs/content/THREADS_HOOK_RESEARCH.md와 handoff를 커밋한다.
4. main을 push하고 Vercel 배포 완료를 확인한다.
5. powerplay-ui-final-check로 production `/threads`와 `/privacy`를 desktop/390px에서 확인한다.
6. 실제 published content id의 UTM 링크로 landing/start 이벤트가 Upstash에 한 번씩 집계되는지 확인하되 질문/카드 데이터가 전송되지 않는지 검증한다.
7. `sync-threads-metrics.yml`을 수동 실행해 실제 Threads metrics를 동기화하고 `/threads`에서 수치를 확인한다.
8. 실데이터가 있으면 가장 큰 이탈 구간과 즉시 개선 가능한 점을 적용한다. 표본이 없으면 추측으로 자동 최적화하지 않는다.
9. Coupang outbound click은 측정하지만 주문/수수료로 부르지 마라. 실제 주문·수수료는 공식 Partners report API 권한과 응답 contract를 확인한 뒤 후속 구현한다.
10. 의미 있는 단위마다 테스트 → diff 검토 → docs/HANDOFF.md 업데이트 → Lore 형식 commit을 남긴다.

절대 하지 말 것:
- .env나 토큰/키를 Git 또는 채팅에 노출
- 기존 uncommitted changes 삭제/reset/restore/clean
- 질문 원문 또는 개인 식별 정보 수집
- 아직 없는 실데이터를 추정해서 성과라고 보고
- 이미 끝난 타로 V1이나 76,076 해석을 재생성

질문으로 멈추지 말고 안전하게 가능한 부분부터 계속 구현·검증·배포해. 사용자 도움이 꼭 필요한 항목만 마지막에 정확한 페이지/권한/입력값으로 정리해.
```

## Exact Next Command

```bash
git status -sb && git diff --check && git diff origin/main...HEAD --stat
```
