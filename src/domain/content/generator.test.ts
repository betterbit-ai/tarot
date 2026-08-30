import { describe, expect, it } from "vitest";
import { generateContentQueue, validateContentQueue } from "./generator";

describe("content generator", () => {
  it("creates a varied, ready-to-publish queue without duplicate signatures", () => {
    const queue = generateContentQueue(105, "2026-08-30T00:00:00.000Z");

    expect(queue.items).toHaveLength(105);
    expect(new Set(queue.items.map((item) => item.format)).size).toBe(8);
    expect(new Set(queue.items.map((item) => item.topic)).size).toBe(6);
    expect(queue.items.filter((item) => item.status === "READY")).toHaveLength(105);
    expect(validateContentQueue(queue)).toEqual([]);
  });
});
