import { serializeShareToken } from "@/lib/sharing/token";

export type ShareMethod = "native-share" | "copy-link";

function getSiteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

export function buildShareUrl(ids: readonly number[]): string {
  const token = serializeShareToken(ids);
  return new URL(`/share/${token}`, getSiteOrigin()).toString();
}

async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export async function shareReading(ids: readonly number[], text: string): Promise<ShareMethod> {
  const url = buildShareUrl(ids);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "미스터 타로",
        text,
        url,
      });
      return "native-share";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }

  await copyText(url);
  return "copy-link";
}
