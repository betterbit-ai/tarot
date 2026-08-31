# Vercel Free 운영 설정

## 보안 원칙

- `.env.local`과 실제 API key, access token, secret은 Git에 추가하지 않는다.
- Vercel의 Environment Variables, GitHub Actions Secrets, Upstash Console만 비밀값의 저장 위치다.
- 이 문서와 `.env.example`에는 변수 이름과 빈 예시만 둔다.
- `NEXT_PUBLIC_` 접두사가 있는 값은 브라우저에 노출될 수 있다. Threads, Coupang, Upstash, scheduler 비밀값에는 절대 붙이지 않는다.

## 첫 Vercel 배포

초기 Import 화면에서는 `NEXT_PUBLIC_SITE_URL`을 비워도 된다. 첫 배포가 성공한 뒤 Vercel이 부여한 `https://<project>.vercel.app` 주소를 확인하고, 아래 값을 **Production과 Preview**에 설정한 다음 재배포한다.

```dotenv
NEXT_PUBLIC_SITE_URL=https://<verified-project>.vercel.app
AFFILIATE_ENABLED=true
COUPANG_PARTNERS_URL=<verified-coupang-partners-link>
PUBLISH_MODE=review
DRY_RUN=true
THREADS_API_BASE_URL=https://graph.threads.net/v1.0
THREADS_MAX_ATTEMPTS=2
THREADS_INSIGHT_METRICS=views,likes,replies,reposts,quotes
```

`THREADS_ACCESS_TOKEN`, `THREADS_USER_ID`, `CONTENT_SCHEDULER_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, Coupang API keys는 이 시점에 아직 넣지 않아도 된다. 값이 없으면 protected Growth Engine routes는 503으로 멈추며 게시를 시도하지 않는다.

## Meta URLs

Vercel 재배포 후 아래 세 URL이 실제로 열리는 것을 확인한 뒤 Meta Basic Settings에 넣는다.

```text
https://<verified-project>.vercel.app/privacy
https://<verified-project>.vercel.app/terms
https://<verified-project>.vercel.app/data-deletion
```

## 무료 자동 발행 준비

1. Upstash에서 무료 Redis 데이터베이스를 만든다.
2. Connect → REST에서 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`을 Vercel 환경 변수에 넣는다.
3. 난수 `CONTENT_SCHEDULER_SECRET`을 Vercel에 넣는다.
4. GitHub repository Settings → Secrets and variables → Actions에서 다음을 설정한다.

```text
Secret:   GROWTH_SCHEDULER_SECRET=<Vercel CONTENT_SCHEDULER_SECRET과 동일한 값>
Variable: VERCEL_GROWTH_BASE_URL=https://<verified-project>.vercel.app
```

5. Threads OAuth가 끝난 뒤에만 Vercel에 `THREADS_ACCESS_TOKEN`과 `THREADS_USER_ID`를 넣는다.
6. 한 번의 GitHub Actions 수동 실행이 `dry-run`으로 성공한 것을 확인한다.
7. 운영자가 결과를 검토한 뒤에만 `PUBLISH_MODE=auto`와 `DRY_RUN=false`로 바꾼다.

현재 GitHub Actions schedule은 무료이며 다음을 호출한다.

- 09:05 KST: Threads token refresh
- 20:30 KST: 다음 READY 콘텐츠 publish
- 21:10 KST: Threads metrics sync

GitHub Actions의 scheduled 실행은 지연될 수 있다. publisher는 queue state와 container id를 저장하고, 불확실한 결과에서는 자동 재시도 대신 reconciliation을 요구한다.
