import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { interpretTarotV2 } from "../interpretation-v2";

type EvalCase = { id: string; question: string; cards: [number, number, number]; facet: string };

const evalCases = readFileSync(resolve(process.cwd(), "data/readings/eval/ux-v2-eval.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as EvalCase);

const BANNED = [
  "새로운 가능성이 열립니다",
  "내면의 목소리",
  "당신만의 여정",
  "우주의 메시지",
  "균형을 찾아보세요",
  "흐름을 받아들이세요",
  "긍정적인 에너지",
  "중요한 시기입니다",
  "을 의미합니다",
  "을 상징합니다",
  "을 나타냅니다",
];

describe("interpretation v2", () => {
  it("answers an entered career question directly and concretely", () => {
    const reading = interpretTarotV2([29, 67, 5], "지금 이직하는 게 맞을까요?");

    expect(reading.intent).toBe("career");
    expect(reading.story).toContain("지금 이직하는 게 맞을까요?");
    expect(reading.story).toMatch(/당장 회사를|움직일 여지/);
    expect(reading.advice).toContain("펜타클 4");
    expect(reading.closing).toContain("이유 3개");
  });

  it("uses all three cards as a relationship instead of reusable keyword prose", () => {
    const first = interpretTarotV2([44, 67, 5], "지금 결정을 내려도 될까요?");
    const second = interpretTarotV2([16, 52, 68], "지금 결정을 내려도 될까요?");

    expect(first.story).toContain("컵 9");
    expect(first.advice).toContain("펜타클 4");
    expect(first.advice).toContain("교황");
    expect(first.story).not.toBe(second.story);
    expect(first.advice).not.toBe(second.advice);
  });

  it("keeps all representative evaluations concise, specific and free of banned AI copy", () => {
    expect(evalCases).toHaveLength(30);

    for (const fixture of evalCases) {
      const reading = interpretTarotV2(fixture.cards, fixture.question);
      const fullText = [reading.headline, reading.story, reading.advice, reading.closing].join(" ");

      expect(reading.characterCount, fixture.id).toBeGreaterThanOrEqual(350);
      expect(reading.characterCount, fixture.id).toBeLessThanOrEqual(650);
      expect(reading.advice, fixture.id).toContain("가운데 놓인");
      expect(reading.closing.length, fixture.id).toBeGreaterThan(20);
      expect(fullText, fixture.id).not.toMatch(/컵가|펜타클가|\b2을 보면|\b4을 보면|\b5을 보면|\b9을 보면/);
      for (const phrase of BANNED) expect(fullText, `${fixture.id}: ${phrase}`).not.toContain(phrase);
    }
  });
});
