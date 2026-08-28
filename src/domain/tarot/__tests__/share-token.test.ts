import { describe, expect, it } from "vitest";

import { decodeShareToken, encodeShareToken, isShareToken } from "../share-token";

describe("tarot share token", () => {
  it("roundtrips a versioned token with ordered card ids only", () => {
    const question = "이직을 해도 될까요?";
    const token = encodeShareToken([0, 7, 77]);

    expect(token).toBe("v1.00.07.77");
    expect(token).not.toContain(question);
    expect(isShareToken(token)).toBe(true);
    expect(decodeShareToken(token)).toEqual([0, 7, 77]);
  });

  it("rejects malformed or privacy-unsafe token values", () => {
    expect(isShareToken("v2.00.07.77")).toBe(false);
    expect(() => decodeShareToken("v1.00.07")).toThrow(/invalid share token/i);
    expect(() => decodeShareToken("v1.00.07.99")).toThrow(/invalid card id/i);
    expect(() => decodeShareToken("v1.00.07.07")).toThrow(/duplicate/i);
  });
});
