import { describe, expect, it } from "vitest";
import { loadReadingSkeleton } from "@/lib/tarot/skeleton-store";

describe("reading skeleton store", () => {
  it("loads the canonical offline skeleton for any selected order", async () => {
    const skeleton = await loadReadingSkeleton([41, 35, 13]);

    expect(skeleton.canonicalKey).toBe("13-35-41");
    expect(skeleton.orderedCardIds).toEqual([13, 35, 41]);
    expect(skeleton.relationships.length).toBeGreaterThan(0);
  });
});
