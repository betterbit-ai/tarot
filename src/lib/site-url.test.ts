import { describe, expect, it } from "vitest";
import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  it("uses the local origin when the configured value is missing or blank", () => {
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
    expect(getSiteUrl("   ").toString()).toBe("http://localhost:3000/");
  });

  it("preserves a valid deployed origin", () => {
    expect(getSiteUrl("https://tarot.example.com").toString()).toBe("https://tarot.example.com/");
  });

  it("fails closed to a build-safe origin for invalid values", () => {
    expect(getSiteUrl("not a url").toString()).toBe("http://localhost:3000/");
  });
});
