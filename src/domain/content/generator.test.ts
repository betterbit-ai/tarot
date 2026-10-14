import { describe, expect, it } from "vitest";
import { generateCommercePilot, generateContentQueue, hookQualityError, readingThreadValidationError, validateContentQueue } from "./generator";

describe("content generator", () => {
  it("creates a varied, ready-to-publish queue without duplicate signatures", () => {
    const queue = generateContentQueue(105, "2026-08-30T00:00:00.000Z");

    expect(queue.items).toHaveLength(105);
    expect(new Set(queue.items.map((item) => item.format)).size).toBe(5);
    expect(new Set(queue.items.map((item) => item.topic)).size).toBe(6);
    expect(queue.items.filter((item) => item.status === "READY")).toHaveLength(105);
    expect(new Set(queue.items.map((item) => item.hook)).size).toBeGreaterThanOrEqual(25);
    expect(queue.items.every((item) => item.hook.length <= 100)).toBe(true);
    expect(queue.items.every((item) => item.cardIds.length === 3 && item.replies.length === 4)).toBe(true);
    expect(validateContentQueue(queue)).toEqual([]);
  });

  it("rejects a vague first line without a concrete scene", () => {
    expect(hookQualityError("요즘 고민이 있으신가요?")).toBe("hook must contain a concrete number or time");
  });

  it("creates 12 complete three-set commerce readings without deprecated choices", () => {
    const pilot = generateCommercePilot("2026-10-15T00:00:00.000Z");

    expect(pilot).toHaveLength(12);
    expect(pilot[0]?.id).toBe("mr-tarot-0047");
    expect(pilot.at(-1)?.id).toBe("mr-tarot-0058");
    expect(pilot.every((item) => item.format === "THREE_CARD_SETS")).toBe(true);
    expect(pilot.every((item) => item.cardIds.length === 9 && item.readingSets?.length === 3)).toBe(true);
    expect(pilot.every((item) => readingThreadValidationError(item) === null)).toBe(true);
    expect(pilot.every((item) => ![item.mainPost, ...item.replies].join(" ").includes("NOT YET"))).toBe(true);
  });
});
