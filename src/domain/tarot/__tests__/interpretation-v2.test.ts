import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createQuestionProfile, createReadingSkeleton, interpretTarotV2 } from "../interpretation-v2";
import { getTarotCards } from "../cards";

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
  it("separates question action from card-derived intent", () => {
    const job = createQuestionProfile("지금 이직하는 게 맞을까요?", getTarotCards([29, 67, 5]));
    const debt = createQuestionProfile("빚을 먼저 갚는 게 맞을까요?", getTarotCards([64, 65, 4]));
    const genericDecision = createQuestionProfile("지금 결정을 내려도 될까요?", getTarotCards([44, 67, 5]));

    expect(job).toMatchObject({ intent: "career", questionType: "decision", action: "change-job" });
    expect(debt).toMatchObject({ intent: "money", questionType: "decision", action: "repay-debt" });
    expect(genericDecision.questionType).toBe("decision");
  });

  it("takes a clear but non-prophetic position on the marriage regression", () => {
    const reading = interpretTarotV2([41, 35, 13], "결혼해도 되나요?");

    expect(reading.questionType).toBe("decision");
    expect(reading.intent).toBe("love");
    expect(reading.headline).toContain("결혼 자체를 말리는 조합은 아니에요");
    expect(reading.headline).toContain("서두르는 건 조금 걸려요");
    expect(reading.story).toContain("컵 6");
    expect(`${reading.story} ${reading.advice}`).toContain("완드 킹");
    expect(reading.advice).toContain("죽음");
    expect(reading.closing).toContain("미뤄둔 문제");
  });

  it("keeps canonical combination data while binding selection order into the skeleton", () => {
    const first = createReadingSkeleton([41, 35, 13]);
    const reordered = createReadingSkeleton([13, 35, 41]);

    expect(first.canonicalKey).toBe(reordered.canonicalKey);
    expect(first.orderedCardIds).not.toEqual(reordered.orderedCardIds);
    expect(first.direction).toBe("release");
    expect(reordered.direction).not.toBe(first.direction);
  });

  it("uses an open reflective headline when no question was asked", () => {
    const reading = interpretTarotV2([3, 43, 74]);
    const fullText = [reading.headline, reading.story, reading.advice, reading.closing].join(" ");

    expect(reading.questionType).toBe("open");
    expect(reading.headline).not.toMatch(/할 수는 있지만|그쪽으로 움직여도/);
    expect(fullText).not.toMatch(/여황제이|컵 8가|펜타클 페이지을/);
    expect(reading.closing).toContain("돈과 시간을");
  });

  it("returns the editorial reading layers used by the result page", () => {
    const reading = interpretTarotV2([51, 6, 54], "그 사람이 신경쓰여");

    expect(reading.cardSummary).toBe("뽑은 카드: 소드 2 · 연인 · 소드 5");
    expect(reading.majorSummary).toContain("메이저 카드 1장");
    expect(reading.cardInsights).toHaveLength(3);
    expect(reading.cardInsights[1]?.visualEvidence).toContain("서로를 마주 봐요");
    expect(reading.flow).not.toMatch(/소드 5이|소드 2가|연인가/);
    expect(reading.application).toContain("상대의 마음");
    expect(reading.mindset).toContain("실제로 오간 말과 행동");
  });

  it("keeps all representative evaluations concise, specific and free of banned AI copy", () => {
    expect(evalCases).toHaveLength(51);

    for (const fixture of evalCases) {
      const reading = interpretTarotV2(fixture.cards, fixture.question);
      const fullText = [reading.headline, reading.story, reading.advice, reading.closing].join(" ");

      expect(reading.characterCount, fixture.id).toBeGreaterThanOrEqual(250);
      expect(reading.characterCount, fixture.id).toBeLessThanOrEqual(450);
      expect(reading.labels.story, fixture.id).not.toBe("카드를 같이 보면");
      expect(reading.labels.advice, fixture.id).not.toBe("특히 걸리는 건");
      expect(reading.closing.length, fixture.id).toBeGreaterThan(20);
      expect(reading.story, fixture.id).not.toContain(`${reading.headline}\n`);
      expect(fullText, fixture.id).not.toMatch(/컵가|펜타클가|\b2을 보면|\b4을 보면|\b5을 보면|\b9을 보면/);
      for (const phrase of BANNED) expect(fullText, `${fixture.id}: ${phrase}`).not.toContain(phrase);
    }
  });
});
