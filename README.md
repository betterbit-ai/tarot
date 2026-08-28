# 오늘의 타로

한국어 모바일 우선 3카드 타로 리추얼입니다. 사용자가 질문을 떠올리고 78장 중 세 장을 직접 고른 뒤, Public Domain Rider-Waite-Smith 카드와 하나로 연결된 리딩을 보고 공유할 수 있습니다.

## Run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment

```dotenv
NEXT_PUBLIC_SITE_URL=https://example.com
AFFILIATE_ENABLED=false
COUPANG_PARTNERS_URL=
```

`AFFILIATE_ENABLED=true`이고 server-only 쿠팡 URL이 유효할 때 결과 직전 제휴 안내가 나타납니다. URL이 없어도 항상 건너뛰고 결과를 볼 수 있습니다. 운영 전 실제 URL과 파트너스 정책 문구를 최종 확인해야 합니다.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm tarot:validate
pnpm tarot:status
```

전체 프로젝트 검증:

```bash
node .codex-harness/scripts/verify-project.mjs
```

## Reading data

일반 사용자 흐름은 runtime LLM을 호출하지 않습니다. 현재는 네 장의 sample override와 모든 조합에 동작하는 deterministic fallback을 사용합니다.

```bash
pnpm tarot:status
pnpm tarot:generate -- --resume
pnpm tarot:generate -- --from 1 --to 20
pnpm tarot:retry-failed -- --dry-run
```

전체 76,076개 외부 모델 생성은 아직 시작하지 않았습니다. 생성 파이프라인은 200개 단위 batch, lock, temp validation, atomic rename, resume, retry를 지원합니다.

## Tarot assets

78장 앞면은 Wikimedia Commons의 Public Domain Pam-A Rider-Waite-Smith scan set을 600px WebP로 로컬 저장합니다. 자세한 source/license/checksum은 [docs/TAROT_ASSETS.md](docs/TAROT_ASSETS.md)와 `data/tarot/rws-assets.json`에 있습니다.

자산을 재현하려면 `cwebp`가 설치된 환경에서 다음을 실행합니다.

```bash
pnpm tarot:assets
```

## Project memory

작업을 재개할 때는 `AGENTS.md`, `docs/HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/tasks/active/`, `git status`, 최근 Git log 순서로 확인합니다.
