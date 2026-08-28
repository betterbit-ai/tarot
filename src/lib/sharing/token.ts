import { decodeShareToken, encodeShareToken } from "@/domain/tarot";

export function serializeShareToken(ids: readonly number[]): string {
  return encodeShareToken(ids);
}

export function parseShareToken(token: string): [number, number, number] | null {
  try {
    return [...decodeShareToken(token)] as [number, number, number];
  } catch {
    return null;
  }
}
