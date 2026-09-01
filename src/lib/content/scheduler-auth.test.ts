import { describe, expect, it } from "vitest";
import { schedulerRequestIsAuthorized } from "./scheduler-auth";

describe("schedulerRequestIsAuthorized", () => {
  it("fails closed for missing and mismatched secrets", () => {
    expect(schedulerRequestIsAuthorized(new Request("https://example.com"), {})).toBe(false);
    expect(schedulerRequestIsAuthorized(new Request("https://example.com", { headers: { "x-mr-tarot-scheduler": "wrong" } }), { CONTENT_SCHEDULER_SECRET: "right" })).toBe(false);
  });

  it("accepts only the configured server-side header", () => {
    expect(schedulerRequestIsAuthorized(new Request("https://example.com", { headers: { "x-mr-tarot-scheduler": "right" } }), { CONTENT_SCHEDULER_SECRET: "right" })).toBe(true);
  });

});
