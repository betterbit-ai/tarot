import { describe, expect, it } from "vitest";
import { generateContentQueue, validateContentQueue } from "./generator";

describe("content generator", () => {
  it("creates a varied, ready-to-publish queue without duplicate signatures", () => {
    const queue = generateContentQueue(105, "2026-08-30T00:00:00.000Z");

    expect(queue.items).toHaveLength(105);
    expect(new Set(queue.items.map((item) => item.format)).size).toBe(6);
    expect(new Set(queue.items.map((item) => item.topic)).size).toBe(6);
    expect(queue.items.filter((item) => item.status === "READY")).toHaveLength(105);
    expect(new Set(queue.items.map((item) => item.hook)).size).toBeGreaterThanOrEqual(25);
    expect(queue.items.every((item) => item.hook.length <= 100)).toBe(true);
    expect(queue.items.filter((item) => item.format !== "CONVERSATION").every((item) => item.cardIds.length === 3)).toBe(true);
    expect(queue.items.some((item) => item.format === "ONE_CARD" || item.format === "PICK_5")).toBe(false);
    expect(validateContentQueue(queue)).toEqual([]);
  });
});
