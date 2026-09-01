import { exchangeThreadsOAuthCode, getThreadsOAuthConfig } from "@/lib/content/threads-oauth";
import { createUpstashJsonStore, UPSTASH_TOKEN_STATE_KEY } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

function page(title: string, body: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title></head><body><main><h1>${title}</h1><p>${body}</p></main></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return page("Threads 연결을 취소했어요", "권한 승인이 취소되었거나 거부되었습니다.", 400);
  const code = url.searchParams.get("code");
  if (!code) return page("Threads 연결에 실패했어요", "권한 코드가 전달되지 않았습니다.", 400);
  const tokenStore = createUpstashJsonStore();
  if (!tokenStore) return page("Threads 연결 준비가 필요해요", "Upstash Redis 환경 변수를 먼저 설정해 주세요.", 503);

  try {
    const exchange = await exchangeThreadsOAuthCode(code, getThreadsOAuthConfig());
    await tokenStore.set(UPSTASH_TOKEN_STATE_KEY, exchange.token);
    return page("Threads 연결이 완료됐어요", "장기 액세스 토큰을 서버 전용 저장소에 보관했습니다. 아직 게시 모드는 review 상태입니다.");
  } catch {
    return page("Threads 연결에 실패했어요", "토큰 교환을 완료하지 못했습니다. Meta 앱의 redirect URI와 Threads App Secret을 확인해 주세요.", 502);
  }
}
