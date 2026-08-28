import { SHARE_TOKEN_VERSION, asCardTriple, type CardTriple } from "./types";

const SHARE_TOKEN_PATTERN = /^v1(?:\.\d{2}){3}$/;

export function encodeShareToken(cardIds: readonly number[]): string {
  const orderedCards = asCardTriple(cardIds);
  return `${SHARE_TOKEN_VERSION}.${orderedCards.map((cardId) => String(cardId).padStart(2, "0")).join(".")}`;
}

export function isShareToken(token: string): boolean {
  return SHARE_TOKEN_PATTERN.test(token);
}

export function decodeShareToken(token: string): CardTriple {
  if (!isShareToken(token)) {
    throw new RangeError(`Invalid share token: ${token}`);
  }

  const [, ...segments] = token.split(".");
  return asCardTriple(segments.map((segment) => Number(segment)));
}
