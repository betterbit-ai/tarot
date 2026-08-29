import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getCombinationRowsForBatch, TAROT_TOTAL_BATCHES, batchFileName } from "./shared";
import { interpretTarotV2 } from "../../src/domain/tarot/interpretation-v2";
import { getTarotCards } from "../../src/domain/tarot/cards";

const AI_TELL_PATTERNS = [
  "결론적으로",
  "요약하면",
  "정리하자면",
  "시사하는 바가 크다",
  "주목할 만하다",
  "가지고 있다",
  "에 의해",
  "되어진다",
  "을 의미합니다",
  "을 상징합니다",
  "을 나타냅니다",
  "당신만의 여정",
  "긍정적인 에너지",
  "이 조건을 실제 선택 기준으로 삼으면",
  "할 수는 있지만, 지금 방식 그대로는",
];

const wrongParticle = (text: string): string[] => {
  const findings: string[] = [];
  for (const card of getTarotCards(Array.from({ length: 78 }, (_, id) => id))) {
    const last = card.name.at(-1) ?? "";
    const code = last.charCodeAt(0);
    const digitJongseong: Record<string, boolean> = { "0": true, "1": true, "2": false, "3": true, "4": false, "5": false, "6": true, "7": true, "8": true, "9": false };
    const hasJong = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : digitJongseong[last] ?? false;
    const wrongSubject = hasJong ? "가" : "이";
    const wrongObject = hasJong ? "를" : "을";
    if (text.includes(`${card.name}${wrongSubject}`) || text.includes(`${card.name}${wrongObject}`)) findings.push(card.name);
  }
  return findings;
};

let total = 0;
let corpusRows = 0;
let corpusMismatches = 0;
let noQuestionDecisionHeadlines = 0;
let tooShort = 0;
let tooLong = 0;
const patternCounts = new Map<string, number>();
const duplicateStories = new Map<string, number>();
const particleFindings: Array<{ cards: number[]; names: string[] }> = [];
const samples: Array<{ cards: number[]; headline: string; story: string }> = [];

for (let batch = 1; batch <= TAROT_TOTAL_BATCHES; batch += 1) {
  const corpusFile = join(process.cwd(), "data", "readings", "batches", batchFileName(batch));
  const corpusLines = readFileSync(corpusFile, "utf8").trim().split("\n");
  for (const [index, row] of getCombinationRowsForBatch(batch).entries()) {
    const cards = row.cards.map((card) => card.id);
    const reading = interpretTarotV2(cards, "");
    const corpusRow = JSON.parse(corpusLines[index]) as { reading?: typeof reading };
    corpusRows += 1;
    if (JSON.stringify(corpusRow.reading) !== JSON.stringify({ headline: reading.headline, story: reading.story, advice: reading.advice, closing: reading.closing })) corpusMismatches += 1;
    const fullText = [reading.headline, reading.story, reading.advice, reading.closing].join(" ");
    total += 1;

    if (/할 수|그 선택|그쪽으로/.test(reading.headline)) noQuestionDecisionHeadlines += 1;
    if (reading.characterCount < 250) tooShort += 1;
    if (reading.characterCount > 450) tooLong += 1;

    for (const pattern of AI_TELL_PATTERNS) {
      if (fullText.includes(pattern)) patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
    }

    const wrong = wrongParticle(fullText);
    if (wrong.length > 0 && particleFindings.length < 20) particleFindings.push({ cards, names: wrong });
    duplicateStories.set(reading.story, (duplicateStories.get(reading.story) ?? 0) + 1);
    if (samples.length < 5 && cards[0] % 17 === 0 && cards[1] % 13 === 0) samples.push({ cards, headline: reading.headline, story: reading.story });
  }
}

const duplicateStoryRows = [...duplicateStories.values()].filter((count) => count > 1).length;
const report = {
  total,
  corpusRows,
  corpusMismatches,
  noQuestionDecisionHeadlines,
  tooShort,
  tooLong,
  aiTellCounts: Object.fromEntries(patternCounts),
  duplicateStoryTemplates: duplicateStoryRows,
  particleFindings,
  samples,
};

console.log(JSON.stringify(report, null, 2));

if (total !== 76076 || corpusRows !== 76076 || corpusMismatches > 0 || noQuestionDecisionHeadlines > 0 || tooShort > 0 || tooLong > 0 || patternCounts.size > 0 || particleFindings.length > 0) {
  process.exitCode = 1;
}
