export type AffiliateConfig = {
  enabled: boolean;
  outHref: string | null;
};

const ALLOWED_COUPANG_HOSTS = new Set(["link.coupang.com", "www.coupang.com"]);

function flagEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function getAffiliateConfig(): AffiliateConfig {
  const enabled = flagEnabled(process.env.AFFILIATE_ENABLED);
  const target = resolveAffiliateTarget();

  return {
    enabled,
    outHref: enabled && target ? "/out/coupang" : null,
  };
}

export function resolveAffiliateTarget(): string | null {
  const enabled = flagEnabled(process.env.AFFILIATE_ENABLED);
  const target = process.env.COUPANG_PARTNERS_URL?.trim();

  if (!enabled || !target) {
    return null;
  }

  try {
    const parsedTarget = new URL(target);
    if (parsedTarget.protocol !== "https:" || !ALLOWED_COUPANG_HOSTS.has(parsedTarget.hostname)) {
      return null;
    }
    return parsedTarget.toString();
  } catch {
    return null;
  }
}
