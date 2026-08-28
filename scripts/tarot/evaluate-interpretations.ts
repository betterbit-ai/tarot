import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { interpretTarotV2, type InterpretationV2 } from "../../src/domain/tarot/interpretation-v2";

type EvalCase = { id: string; question: string; cards: [number, number, number]; facet: string };
type FailureReason =
  | "VAGUE"
  | "NO_POSITION"
  | "CARD_DICTIONARY"
  | "TEMPLATE_REPETITION"
  | "GENERIC_ADVICE"
  | "QUESTION_IGNORED"
  | "OVERLONG"
  | "AI_PHRASE"
  | "OVERCONFIDENT"
  | "CARD_RELATIONSHIP_MISSING"
  | "UNNATURAL_KOREAN";

const BANNED = ["가능성이 열립니다", "내면의 목소리", "당신만의 여정", "균형을 찾아보세요", "긍정적인 에너지", "중요한 시기입니다", "을 의미합니다", "을 상징합니다", "을 나타냅니다"];
const OVERCONFIDENT = ["무조건", "확실히", "100%", "틀림없이"];

function scoreReading(reading: InterpretationV2, fixture: EvalCase, previousLabels: Set<string>) {
  const fullText = [reading.headline, reading.story, reading.advice, reading.closing].join(" ");
  const failures: FailureReason[] = [];
  const directness = reading.questionType === "open" ? 4 : reading.headline.length > 8 ? 5 : 3;
  const specificity = fixture.question && fullText.includes(fixture.question.slice(0, 8)) ? 5 : 4;
  const cardCoherence = reading.story.includes("첫 카드") && reading.advice.length > 50 ? 5 : 3;
  const humanness = BANNED.some((phrase) => fullText.includes(phrase)) ? 2 : 5;
  const position = reading.questionType === "decision" || reading.questionType === "other-person" ? (reading.headline.includes("쪽") || reading.headline.includes("어려워") || reading.headline.includes("카드는") ? 5 : 3) : 4;
  const nonTemplated = previousLabels.has(reading.story) ? 3 : 5;
  const clarity = reading.characterCount <= 450 ? 5 : 3;
  const restraint = OVERCONFIDENT.some((phrase) => fullText.includes(phrase)) ? 2 : 5;

  if (directness < 4) failures.push("NO_POSITION");
  if (specificity < 4) failures.push("QUESTION_IGNORED");
  if (cardCoherence < 4) failures.push("CARD_RELATIONSHIP_MISSING");
  if (humanness < 4) failures.push("AI_PHRASE");
  if (nonTemplated < 4) failures.push("TEMPLATE_REPETITION");
  if (clarity < 4) failures.push("OVERLONG");
  if (restraint < 4) failures.push("OVERCONFIDENT");
  if (/카드는 .*의미|카드는 .*상징|카드는 .*나타/.test(fullText)) failures.push("CARD_DICTIONARY");
  if (/해보세요|확인해보세요|생각해보세요/.test(reading.closing) && reading.questionType === "open") failures.push("GENERIC_ADVICE");

  const scores = { directness, specificity, cardCoherence, humanness, position, nonTemplated, clarity, restraint };
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
  previousLabels.add(reading.story);
  return { id: fixture.id, scores, total: Number(total.toFixed(2)), failures };
}

const fixtures = readFileSync(resolve(process.cwd(), "data/readings/eval/ux-v2-eval.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as EvalCase);
const previousLabels = new Set<string>();
const results = fixtures.map((fixture) => scoreReading(interpretTarotV2(fixture.cards, fixture.question), fixture, previousLabels));
const average = (key: keyof (typeof results)[number]["scores"]) => results.reduce((sum, result) => sum + result.scores[key], 0) / results.length;
const failureDistribution = results.flatMap((result) => result.failures).reduce<Record<string, number>>((counts, failure) => {
  counts[failure] = (counts[failure] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  cases: results.length,
  average: Number((results.reduce((sum, result) => sum + result.total, 0) / results.length).toFixed(2)),
  dimensions: Object.fromEntries((Object.keys(results[0]?.scores ?? {}) as Array<keyof (typeof results)[number]["scores"]>).map((key) => [key, Number(average(key).toFixed(2))])),
  failureDistribution,
  failures: results.filter((result) => result.failures.length > 0),
}, null, 2));
