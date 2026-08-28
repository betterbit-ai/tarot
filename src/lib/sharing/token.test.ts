import { describe, expect, it } from "vitest";
import { parseShareToken, serializeShareToken } from "@/lib/sharing/token";

describe("share token", () => {
  it("roundtrips ordered card ids", () => {
    const token = serializeShareToken([3, 11, 77]);

    expect(token).toBe("v1.03.11.77");
    expect(parseShareToken(token)).toEqual([3, 11, 77]);
  });

  it("rejects duplicates and out of range ids", () => {
    expect(parseShareToken("v1.03.03.77")).toBeNull();
    expect(parseShareToken("v1.03.11.88")).toBeNull();
  });
});
