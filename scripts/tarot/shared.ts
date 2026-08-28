import { appendFile, copyFile, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export const TAROT_CARD_COUNT = 78;
export const TAROT_BATCH_SIZE = 200;
export const TAROT_TOTAL_COMBINATIONS = 76076;
export const TAROT_TOTAL_BATCHES = Math.ceil(
  TAROT_TOTAL_COMBINATIONS / TAROT_BATCH_SIZE,
);
export const SAMPLE_READING_VERSION = 1;
export const DEFAULT_PROMPT_VERSION = "local-v1";
export const DEFAULT_PROVIDER = "deterministic-local";
export const DEFAULT_MODEL = "built-in";
export const DEFAULT_STALE_LOCK_MS = 15 * 60 * 1000;

const MAJOR_LIGHT = [
  "가벼운 시작",
  "선명한 의지",
  "조용한 통찰",
  "충분한 돌봄",
  "안정된 기준",
  "배운 원칙",
  "마주 보는 선택",
  "움직일 힘",
  "차분한 용기",
  "속도를 늦춘 성찰",
  "전환의 흐름",
  "균형 감각",
  "관점의 전환",
  "끝내고 여는 힘",
  "알맞은 조율",
  "묶인 욕망의 자각",
  "거짓 기반의 붕괴",
  "멀리 보는 희망",
  "불안의 그림자",
  "환한 확신",
  "다시 듣는 부름",
  "완성의 감각",
];

const MAJOR_SHADOW = [
  "방향 없는 충동",
  "과한 통제",
  "답을 미루는 침묵",
  "달콤한 방심",
  "굳은 권위",
  "남의 기준 의존",
  "머뭇거리는 마음",
  "밀어붙이는 조급함",
  "버티기만 하는 완강함",
  "고립된 시선",
  "흐름 탓으로 미루기",
  "계산된 차가움",
  "움직이지 못하는 정지",
  "놓지 못하는 집착",
  "중간을 잃은 흔들림",
  "익숙한 얽힘",
  "갑작스러운 균열",
  "희망 과잉",
  "막연한 불안",
  "눈부심 뒤의 소진",
  "미뤄 둔 판단",
  "마침표 앞의 망설임",
];

const MAJOR_NAMES = [
  "바보",
  "마법사",
  "여사제",
  "여황제",
  "황제",
  "교황",
  "연인",
  "전차",
  "힘",
  "은둔자",
  "운명의 수레바퀴",
  "정의",
  "매달린 사람",
  "죽음",
  "절제",
  "악마",
  "탑",
  "별",
  "달",
  "태양",
  "심판",
  "세계",
];

const SUIT_META = {
  wands: { ko: "완드", light: "의지", shadow: "성급함" },
  cups: { ko: "컵", light: "감정", shadow: "과민함" },
  swords: { ko: "소드", light: "판단", shadow: "날카로움" },
  pentacles: { ko: "펜타클", light: "현실감", shadow: "경직됨" },
} as const;

const MINOR_RANKS = [
  { code: "ace", ko: "에이스", light: "문을 여는 기회", shadow: "막연한 기대" },
  { code: "2", ko: "2", light: "균형 맞추기", shadow: "갈팡질팡함" },
  { code: "3", ko: "3", light: "호흡 맞추기", shadow: "흩어지는 집중" },
  { code: "4", ko: "4", light: "기반 다지기", shadow: "정체" },
  { code: "5", ko: "5", light: "문제 직시", shadow: "소모전" },
  { code: "6", ko: "6", light: "주고받는 흐름", shadow: "기울어진 교환" },
  { code: "7", ko: "7", light: "자기 입장 지키기", shadow: "방어적 긴장" },
  { code: "8", ko: "8", light: "속도를 붙이기", shadow: "쫓기듯 움직임" },
  { code: "9", ko: "9", light: "마무리 직전의 집중", shadow: "혼자 짊어짐" },
  { code: "10", ko: "10", light: "한 단락의 완성", shadow: "과부하" },
  { code: "page", ko: "페이지", light: "새 감각의 등장", shadow: "미숙한 반응" },
  { code: "knight", ko: "나이트", light: "전진하는 추진력", shadow: "과한 돌진" },
  { code: "queen", ko: "퀸", light: "성숙한 돌봄", shadow: "감정적 개입" },
  { code: "king", ko: "킹", light: "안정된 주도권", shadow: "경직된 통제" },
] as const;

const EVAL_BATCHES = [
  1, 3, 7, 11, 19, 23, 29, 31, 37, 43, 47, 53, 59, 61, 67, 71, 79, 83, 89,
  97, 101, 107, 109, 113, 127,
] as const;

export type MinorSuit = keyof typeof SUIT_META;

export interface TarotCard {
  id: number;
  key: string;
  name: string;
  arcana: "major" | "minor";
  suit: MinorSuit | null;
  rank: string | null;
  light: string;
  shadow: string;
}

export interface CardSummary {
  id: number;
  key: string;
  name: string;
  arcana: "major" | "minor";
  suit: MinorSuit | null;
  rank: string | null;
}

export interface ReadingRecord {
  combination: string;
  cards: CardSummary[];
  reading: {
    headline: string;
    story: string;
    advice: string;
    closing: string;
  };
  version: number;
  generation: {
    provider: string;
    model: string;
    promptVersion: string;
    batch: number;
    generatedAt: string;
  };
}

export interface EvalRecord {
  combination: string;
  cards: CardSummary[];
}

export interface FailedBatchRecord {
  batch: number;
  attemptedAt: string;
  provider: string;
  error: string;
}

export interface TarotPaths {
  root: string;
  readingsRoot: string;
  samplesFile: string;
  evalFile: string;
  batchesDir: string;
  failedLogFile: string;
  manifestFile: string;
  locksDir: string;
  tempDir: string;
  checkpointsDir: string;
  providerCheckpointFile: string;
}

export interface GenerateBatchOptions {
  root: string;
  batch: number;
  generatedAt?: string;
  resume?: boolean;
  dryRun?: boolean;
  staleLockMs?: number;
  providerName: string;
  providerModel: string;
  promptVersion: string;
  buildReading: (cards: TarotCard[], combination: string) => ReadingRecord["reading"];
}

export interface GenerateBatchResult {
  batch: number;
  status: "generated" | "skipped" | "locked" | "dry-run";
  rowCount: number;
  file?: string;
}

export interface GenerationRunResult {
  targetedBatches: number[];
  generated: GenerateBatchResult[];
  skipped: number[];
  locked: number[];
  dryRun: number[];
}

export interface StatusManifest {
  version: number;
  generatedAt: string;
  totals: {
    cards: number;
    combinations: number;
    batches: number;
    batchSize: number;
  };
  files: {
    sampleOverrides: number;
    evalRows: number;
    batchFiles: number;
    generatedRows: number;
    failedAttempts: number;
    unresolvedFailedBatches: number;
    tempFiles: number;
    activeLocks: number;
  };
  coverage: {
    completedBatches: number;
    remainingBatches: number;
    generatedRows: number;
    remainingRows: number;
  };
  providers: string[];
  completeBatches: number[];
  missingBatches: number[];
  unresolvedFailedBatches: number[];
}

export interface ValidateSummary {
  totals: {
    cards: number;
    combinations: number;
    batches: number;
  };
  samples: number;
  evalRows: number;
  batchFiles: number;
  generatedRows: number;
}

const tarotCards = buildTarotCards();
const cardsById = new Map(tarotCards.map((card) => [card.id, card]));

function buildTarotCards(): TarotCard[] {
  const cards: TarotCard[] = [];

  MAJOR_NAMES.forEach((name, index) => {
    cards.push({
      id: index,
      key: toTwoDigitKey(index),
      name,
      arcana: "major",
      suit: null,
      rank: null,
      light: MAJOR_LIGHT[index],
      shadow: MAJOR_SHADOW[index],
    });
  });

  const suits = ["wands", "cups", "swords", "pentacles"] as const;

  suits.forEach((suit, suitIndex) => {
    MINOR_RANKS.forEach((rank, rankIndex) => {
      const id = 22 + suitIndex * MINOR_RANKS.length + rankIndex;
      const suitMeta = SUIT_META[suit];
      cards.push({
        id,
        key: toTwoDigitKey(id),
        name: `${suitMeta.ko} ${rank.ko}`,
        arcana: "minor",
        suit,
        rank: rank.ko,
        light: `${suitMeta.light}의 ${rank.light}`,
        shadow: `${suitMeta.shadow}이 만든 ${rank.shadow}`,
      });
    });
  });

  return cards;
}

export function getProjectRoot(cwd = process.cwd()): string {
  return resolve(cwd);
}

export function getTarotPaths(root = getProjectRoot()): TarotPaths {
  const readingsRoot = join(root, "data", "readings");
  const checkpointsDir = join(root, "generation", "checkpoints");
  return {
    root,
    readingsRoot,
    samplesFile: join(readingsRoot, "samples", "sample-readings.jsonl"),
    evalFile: join(readingsRoot, "eval", "eval-set-v1.jsonl"),
    batchesDir: join(readingsRoot, "batches"),
    failedLogFile: join(readingsRoot, "failed", "failed-batches.jsonl"),
    manifestFile: join(readingsRoot, "manifest.json"),
    locksDir: join(root, "generation", "locks"),
    tempDir: join(root, "generation", "temp"),
    checkpointsDir,
    providerCheckpointFile: join(checkpointsDir, "local-provider-v1.json"),
  };
}

export function listTarotCards(): TarotCard[] {
  return tarotCards.map((card) => ({ ...card }));
}

export function getTarotCardById(id: number): TarotCard {
  const card = cardsById.get(id);
  if (!card) {
    throw new Error(`Unknown tarot card id: ${id}`);
  }
  return { ...card };
}

export function toCardSummary(card: TarotCard): CardSummary {
  return {
    id: card.id,
    key: card.key,
    name: card.name,
    arcana: card.arcana,
    suit: card.suit,
    rank: card.rank,
  };
}

export function toTwoDigitKey(id: number): string {
  return String(id).padStart(2, "0");
}

export function createCanonicalCombinationKey(ids: number[]): string {
  const normalized = [...ids].sort((left, right) => left - right);
  if (normalized.length !== 3) {
    throw new Error(`Expected 3 card ids, received ${normalized.length}`);
  }
  const unique = new Set(normalized);
  if (unique.size !== 3) {
    throw new Error(`Combination must contain 3 unique card ids: ${ids.join(",")}`);
  }
  normalized.forEach((id) => {
    if (!Number.isInteger(id) || id < 0 || id >= TAROT_CARD_COUNT) {
      throw new Error(`Card id out of range: ${id}`);
    }
  });
  return normalized.map((id) => toTwoDigitKey(id)).join("-");
}

export function parseCombinationKey(key: string): number[] {
  const ids = key.split("-").map((segment) => Number.parseInt(segment, 10));
  const normalized = createCanonicalCombinationKey(ids);
  if (normalized !== key) {
    throw new Error(`Combination key is not canonical: ${key}`);
  }
  return ids;
}

export function isCanonicalCombinationKey(value: string): boolean {
  try {
    parseCombinationKey(value);
    return true;
  } catch {
    return false;
  }
}

export function* enumerateCanonicalCombinations(): Generator<{
  index: number;
  ids: [number, number, number];
  combination: string;
}> {
  let index = 0;
  for (let first = 0; first < TAROT_CARD_COUNT - 2; first += 1) {
    for (let second = first + 1; second < TAROT_CARD_COUNT - 1; second += 1) {
      for (let third = second + 1; third < TAROT_CARD_COUNT; third += 1) {
        const ids = [first, second, third] as [number, number, number];
        yield {
          index,
          ids,
          combination: createCanonicalCombinationKey(ids),
        };
        index += 1;
      }
    }
  }
}

export function getExpectedRowCount(batch: number): number {
  assertBatchNumber(batch);
  const start = (batch - 1) * TAROT_BATCH_SIZE;
  return Math.min(TAROT_BATCH_SIZE, TAROT_TOTAL_COMBINATIONS - start);
}

export function getCombinationRowsForBatch(batch: number): EvalRecord[] {
  assertBatchNumber(batch);
  const start = (batch - 1) * TAROT_BATCH_SIZE;
  const end = Math.min(start + TAROT_BATCH_SIZE, TAROT_TOTAL_COMBINATIONS);
  const rows: EvalRecord[] = [];

  for (const row of enumerateCanonicalCombinations()) {
    if (row.index < start) {
      continue;
    }
    if (row.index >= end) {
      break;
    }
    rows.push({
      combination: row.combination,
      cards: row.ids.map((id) => toCardSummary(getTarotCardById(id))),
    });
  }

  return rows;
}

export function selectEvalSet(): EvalRecord[] {
  const rows: EvalRecord[] = [];
  const seen = new Set<string>();

  for (const batch of EVAL_BATCHES) {
    const batchRows = getCombinationRowsForBatch(batch);
    const picks = [0, 4, 8, 12];
    for (const pick of picks) {
      const row = batchRows[pick];
      if (row && !seen.has(row.combination)) {
        rows.push(row);
        seen.add(row.combination);
      }
    }
  }

  for (const row of enumerateCanonicalCombinations()) {
    if (rows.length >= 100) {
      break;
    }
    const majorCount = row.ids.filter((id) => id < 22).length;
    const cards = row.ids.map((id) => getTarotCardById(id));
    const distinctSuits = new Set(cards.map((card) => card.suit).filter(Boolean));
    if (majorCount >= 1 || distinctSuits.size >= 2) {
      if (!seen.has(row.combination)) {
        rows.push({
          combination: row.combination,
          cards: cards.map((card) => toCardSummary(card)),
        });
        seen.add(row.combination);
      }
    }
  }

  if (rows.length !== 100) {
    throw new Error(`Eval set must contain 100 rows, received ${rows.length}`);
  }

  return rows;
}

export async function ensureStaticArtifacts(root = getProjectRoot()): Promise<void> {
  const paths = getTarotPaths(root);
  await mkdir(paths.batchesDir, { recursive: true });
  await mkdir(dirname(paths.failedLogFile), { recursive: true });
  await mkdir(dirname(paths.evalFile), { recursive: true });
  await mkdir(dirname(paths.samplesFile), { recursive: true });
  await mkdir(paths.locksDir, { recursive: true });
  await mkdir(paths.tempDir, { recursive: true });
  await mkdir(paths.checkpointsDir, { recursive: true });

  await ensureFile(
    paths.evalFile,
    serializeJsonLines(selectEvalSet()),
  );

  await ensureFile(
    paths.providerCheckpointFile,
    `${JSON.stringify(
      {
        provider: DEFAULT_PROVIDER,
        model: DEFAULT_MODEL,
        promptVersion: DEFAULT_PROMPT_VERSION,
        generatedAt: "2026-08-27T00:00:00.000Z",
        notes: "Deterministic local provider checkpoint for offline tarot corpus tooling.",
      },
      null,
      2,
    )}\n`,
  );

  await ensureFile(paths.failedLogFile, "");
}

async function ensureFile(filePath: string, content: string): Promise<void> {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    const typed = error as NodeJS.ErrnoException;
    if (typed.code !== "ENOENT") {
      throw error;
    }
    await writeFile(filePath, content, "utf8");
  }
}

export function serializeJsonLines<T>(rows: T[]): string {
  return rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length > 0 ? "\n" : "");
}

export async function readJsonLines<T>(filePath: string): Promise<T[]> {
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    const typed = error as NodeJS.ErrnoException;
    if (typed.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return parseJsonLines<T>(content, filePath);
}

export function parseJsonLines<T>(content: string, filePath = "jsonl"): T[] {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return [];
  }

  return trimmed.split("\n").map((line, index) => {
    try {
      return JSON.parse(line) as T;
    } catch {
      throw new Error(`Invalid JSON in ${filePath} at line ${index + 1}`);
    }
  });
}

export async function writeJsonFileAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  const tempFile = `${filePath}.tmp`;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempFile, filePath);
}

export async function listBatchFiles(paths: TarotPaths): Promise<string[]> {
  const entries = await readdir(paths.batchesDir, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    },
  );

  return entries
    .filter((entry) => entry.isFile() && /^batch-\d{4}\.jsonl$/.test(entry.name))
    .map((entry) => join(paths.batchesDir, entry.name))
    .sort();
}

export function parseBatchNumber(fileNameOrPath: string): number {
  const match = basename(fileNameOrPath).match(/^batch-(\d{4})\.jsonl$/);
  if (!match) {
    throw new Error(`Invalid batch filename: ${fileNameOrPath}`);
  }
  const batch = Number.parseInt(match[1], 10);
  assertBatchNumber(batch);
  return batch;
}

export function batchFileName(batch: number): string {
  assertBatchNumber(batch);
  return `batch-${String(batch).padStart(4, "0")}.jsonl`;
}

export function lockFileName(batch: number): string {
  return batchFileName(batch).replace(/\.jsonl$/, ".lock");
}

export function tempFileName(batch: number): string {
  return batchFileName(batch).replace(/\.jsonl$/, ".tmp");
}

export async function deriveManifest(root = getProjectRoot()): Promise<StatusManifest> {
  await ensureStaticArtifacts(root);
  const paths = getTarotPaths(root);
  const sampleRows = await readJsonLines<ReadingRecord>(paths.samplesFile);
  sampleRows.forEach((row, index) => validateReadingRecord(row, 0, paths.samplesFile, index + 1));

  const evalRows = await readJsonLines<EvalRecord>(paths.evalFile);
  validateEvalRows(evalRows, paths.evalFile);

  const batchFiles = await listBatchFiles(paths);
  const completeBatches: number[] = [];
  const providers = new Set<string>();
  let generatedRows = 0;

  for (const filePath of batchFiles) {
    const batch = parseBatchNumber(filePath);
    const rows = await validateBatchFile(filePath, batch);
    completeBatches.push(batch);
    generatedRows += rows.length;
    rows.forEach((row) => providers.add(row.generation.provider));
  }

  const failedRows = await readJsonLines<FailedBatchRecord>(paths.failedLogFile);
  failedRows.forEach((row, index) => validateFailedBatchRecord(row, paths.failedLogFile, index + 1));

  const tempFiles = await listFiles(paths.tempDir, /\.tmp$/);
  const activeLocks = await listFiles(paths.locksDir, /\.lock$/);
  const missingBatches = range(1, TAROT_TOTAL_BATCHES).filter(
    (batch) => !completeBatches.includes(batch),
  );
  const unresolvedFailedBatches = getRetryableFailedBatches(failedRows, completeBatches);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      cards: TAROT_CARD_COUNT,
      combinations: TAROT_TOTAL_COMBINATIONS,
      batches: TAROT_TOTAL_BATCHES,
      batchSize: TAROT_BATCH_SIZE,
    },
    files: {
      sampleOverrides: sampleRows.length,
      evalRows: evalRows.length,
      batchFiles: batchFiles.length,
      generatedRows,
      failedAttempts: failedRows.length,
      unresolvedFailedBatches: unresolvedFailedBatches.length,
      tempFiles: tempFiles.length,
      activeLocks: activeLocks.length,
    },
    coverage: {
      completedBatches: completeBatches.length,
      remainingBatches: TAROT_TOTAL_BATCHES - completeBatches.length,
      generatedRows,
      remainingRows: TAROT_TOTAL_COMBINATIONS - generatedRows,
    },
    providers: [...providers].sort(),
    completeBatches,
    missingBatches,
    unresolvedFailedBatches,
  };
}

async function listFiles(dirPath: string, pattern: RegExp): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    },
  );

  return entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => join(dirPath, entry.name))
    .sort();
}

export async function validateProjectData(root = getProjectRoot()): Promise<ValidateSummary> {
  await ensureStaticArtifacts(root);
  const paths = getTarotPaths(root);

  const cards = listTarotCards();
  if (cards.length !== TAROT_CARD_COUNT) {
    throw new Error(`Card catalog must contain ${TAROT_CARD_COUNT} cards`);
  }
  const uniqueCardIds = new Set(cards.map((card) => card.id));
  if (uniqueCardIds.size !== TAROT_CARD_COUNT) {
    throw new Error("Card catalog contains duplicate ids");
  }

  let enumeratedCount = 0;
  const seenCombinations = new Set<string>();
  for (const row of enumerateCanonicalCombinations()) {
    enumeratedCount += 1;
    if (seenCombinations.has(row.combination)) {
      throw new Error(`Duplicate combination enumerated: ${row.combination}`);
    }
    seenCombinations.add(row.combination);
  }

  if (enumeratedCount !== TAROT_TOTAL_COMBINATIONS) {
    throw new Error(
      `Expected ${TAROT_TOTAL_COMBINATIONS} combinations, received ${enumeratedCount}`,
    );
  }

  const evalRows = await readJsonLines<EvalRecord>(paths.evalFile);
  validateEvalRows(evalRows, paths.evalFile);

  const samples = await readJsonLines<ReadingRecord>(paths.samplesFile);
  samples.forEach((row, index) => validateReadingRecord(row, 0, paths.samplesFile, index + 1));

  const batchFiles = await listBatchFiles(paths);
  let generatedRows = 0;
  for (const filePath of batchFiles) {
    const batch = parseBatchNumber(filePath);
    const rows = await validateBatchFile(filePath, batch);
    generatedRows += rows.length;
  }

  const manifest = await deriveManifest(root);
  await writeJsonFileAtomic(paths.manifestFile, manifest);

  return {
    totals: {
      cards: TAROT_CARD_COUNT,
      combinations: enumeratedCount,
      batches: TAROT_TOTAL_BATCHES,
    },
    samples: samples.length,
    evalRows: evalRows.length,
    batchFiles: batchFiles.length,
    generatedRows,
  };
}

export function validateEvalRows(rows: EvalRecord[], filePath: string): void {
  if (rows.length !== 100) {
    throw new Error(`Eval set must contain exactly 100 rows in ${filePath}`);
  }
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    validateCardsAgainstCombination(row.cards, row.combination, filePath, index + 1);
    if (seen.has(row.combination)) {
      throw new Error(`Duplicate eval combination ${row.combination} in ${filePath}`);
    }
    seen.add(row.combination);
  });
}

export function validateReadingRecord(
  row: ReadingRecord,
  expectedBatch: number,
  filePath: string,
  lineNumber: number,
): void {
  if (!row || typeof row !== "object") {
    throw new Error(`Invalid reading record object in ${filePath} at line ${lineNumber}`);
  }
  if (!isCanonicalCombinationKey(row.combination)) {
    throw new Error(`Invalid combination key ${row.combination} in ${filePath} at line ${lineNumber}`);
  }
  validateCardsAgainstCombination(row.cards, row.combination, filePath, lineNumber);

  const textFields = ["headline", "story", "advice", "closing"] as const;
  for (const field of textFields) {
    const value = row.reading?.[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Missing reading.${field} in ${filePath} at line ${lineNumber}`);
    }
  }

  if (row.version !== SAMPLE_READING_VERSION) {
    throw new Error(`Unsupported reading version ${row.version} in ${filePath} at line ${lineNumber}`);
  }
  if (typeof row.generation?.provider !== "string" || row.generation.provider.length === 0) {
    throw new Error(`Missing generation.provider in ${filePath} at line ${lineNumber}`);
  }
  if (typeof row.generation?.model !== "string" || row.generation.model.length === 0) {
    throw new Error(`Missing generation.model in ${filePath} at line ${lineNumber}`);
  }
  if (
    typeof row.generation?.promptVersion !== "string" ||
    row.generation.promptVersion.length === 0
  ) {
    throw new Error(`Missing generation.promptVersion in ${filePath} at line ${lineNumber}`);
  }
  if (!Number.isInteger(row.generation?.batch)) {
    throw new Error(`Invalid generation.batch in ${filePath} at line ${lineNumber}`);
  }
  if (expectedBatch !== undefined && row.generation.batch !== expectedBatch) {
    throw new Error(
      `Expected generation.batch ${expectedBatch}, received ${row.generation.batch} in ${filePath} at line ${lineNumber}`,
    );
  }
  if (Number.isNaN(Date.parse(row.generation.generatedAt))) {
    throw new Error(`Invalid generatedAt in ${filePath} at line ${lineNumber}`);
  }
}

export function validateFailedBatchRecord(
  row: FailedBatchRecord,
  filePath: string,
  lineNumber: number,
): void {
  if (!Number.isInteger(row.batch) || row.batch < 1 || row.batch > TAROT_TOTAL_BATCHES) {
    throw new Error(`Invalid failed batch number in ${filePath} at line ${lineNumber}`);
  }
  if (typeof row.provider !== "string" || row.provider.length === 0) {
    throw new Error(`Missing provider in ${filePath} at line ${lineNumber}`);
  }
  if (typeof row.error !== "string" || row.error.length === 0) {
    throw new Error(`Missing error in ${filePath} at line ${lineNumber}`);
  }
  if (Number.isNaN(Date.parse(row.attemptedAt))) {
    throw new Error(`Invalid attemptedAt in ${filePath} at line ${lineNumber}`);
  }
}

export async function validateBatchFile(
  filePath: string,
  batch: number,
): Promise<ReadingRecord[]> {
  const rows = await readJsonLines<ReadingRecord>(filePath);
  const expectedCount = getExpectedRowCount(batch);
  if (rows.length !== expectedCount) {
    throw new Error(
      `Batch ${batch} must contain ${expectedCount} rows, received ${rows.length} in ${filePath}`,
    );
  }

  const expectedRows = getCombinationRowsForBatch(batch);
  rows.forEach((row, index) => {
    validateReadingRecord(row, batch, filePath, index + 1);
    const expectedCombination = expectedRows[index]?.combination;
    if (row.combination !== expectedCombination) {
      throw new Error(
        `Unexpected combination order in ${filePath} at line ${index + 1}: expected ${expectedCombination}, received ${row.combination}`,
      );
    }
  });

  return rows;
}

function validateCardsAgainstCombination(
  cards: CardSummary[],
  combination: string,
  filePath: string,
  lineNumber: number,
): void {
  if (!Array.isArray(cards) || cards.length !== 3) {
    throw new Error(`Expected 3 cards in ${filePath} at line ${lineNumber}`);
  }
  const ids = cards.map((card) => {
    if (!card || typeof card !== "object") {
      throw new Error(`Invalid card object in ${filePath} at line ${lineNumber}`);
    }
    if (!Number.isInteger(card.id)) {
      throw new Error(`Invalid card id in ${filePath} at line ${lineNumber}`);
    }
    const source = getTarotCardById(card.id);
    if (card.key !== source.key || card.name !== source.name) {
      throw new Error(`Card summary mismatch for id ${card.id} in ${filePath} at line ${lineNumber}`);
    }
    return card.id;
  });
  const expectedKey = createCanonicalCombinationKey(ids);
  if (expectedKey !== combination) {
    throw new Error(
      `Cards do not match combination ${combination} in ${filePath} at line ${lineNumber}`,
    );
  }
}

export async function writeFailedBatchRecord(
  root: string,
  record: FailedBatchRecord,
): Promise<void> {
  const paths = getTarotPaths(root);
  await mkdir(dirname(paths.failedLogFile), { recursive: true });
  await appendFile(paths.failedLogFile, `${JSON.stringify(record)}\n`, "utf8");
}

export async function generateBatch(
  options: GenerateBatchOptions,
): Promise<GenerateBatchResult> {
  await ensureStaticArtifacts(options.root);
  const paths = getTarotPaths(options.root);
  const batch = options.batch;
  const finalFile = join(paths.batchesDir, batchFileName(batch));

  if (options.resume && (await pathExists(finalFile))) {
    return { batch, status: "skipped", rowCount: getExpectedRowCount(batch), file: finalFile };
  }

  const rows = getCombinationRowsForBatch(batch).map((row) => {
    const cards = row.cards.map((card) => getTarotCardById(card.id));
    return {
      combination: row.combination,
      cards: row.cards,
      reading: options.buildReading(cards, row.combination),
      version: SAMPLE_READING_VERSION,
      generation: {
        provider: options.providerName,
        model: options.providerModel,
        promptVersion: options.promptVersion,
        batch,
        generatedAt: options.generatedAt ?? new Date().toISOString(),
      },
    } satisfies ReadingRecord;
  });

  if (options.dryRun) {
    return { batch, status: "dry-run", rowCount: rows.length, file: finalFile };
  }

  await mkdir(paths.batchesDir, { recursive: true });
  await mkdir(paths.locksDir, { recursive: true });
  await mkdir(paths.tempDir, { recursive: true });

  const lockPath = join(paths.locksDir, lockFileName(batch));
  const tempPath = join(paths.tempDir, tempFileName(batch));
  const staleLockMs = options.staleLockMs ?? DEFAULT_STALE_LOCK_MS;
  const lockHandle = await acquireBatchLock(lockPath, staleLockMs);

  try {
    await rm(tempPath, { force: true });
    await writeFile(tempPath, serializeJsonLines(rows), "utf8");
    await validateBatchFile(tempPath, batch);
    await rename(tempPath, finalFile);
  } catch (error) {
    await writeFailedBatchRecord(options.root, {
      batch,
      attemptedAt: new Date().toISOString(),
      provider: options.providerName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await rm(tempPath, { force: true }).catch(() => undefined);
    await lockHandle.close();
    await rm(lockPath, { force: true }).catch(() => undefined);
  }

  return { batch, status: "generated", rowCount: rows.length, file: finalFile };
}

async function acquireBatchLock(lockPath: string, staleLockMs: number) {
  try {
    return await open(lockPath, "wx");
  } catch (error) {
    const typed = error as NodeJS.ErrnoException;
    if (typed.code !== "EEXIST") {
      throw error;
    }

    const lockStat = await stat(lockPath);
    const ageMs = Date.now() - lockStat.mtimeMs;
    if (ageMs > staleLockMs) {
      await rm(lockPath, { force: true });
      return open(lockPath, "wx");
    }

    throw new Error(`Batch is locked: ${basename(lockPath)}`);
  }
}

export async function runGeneration(
  root: string,
  options: {
    resume?: boolean;
    dryRun?: boolean;
    from?: number;
    to?: number;
    batch?: number;
    staleLockMs?: number;
    providerName: string;
    providerModel: string;
    promptVersion: string;
    buildReading: GenerateBatchOptions["buildReading"];
  },
): Promise<GenerationRunResult> {
  const targetedBatches = resolveTargetBatches(options);
  const generated: GenerateBatchResult[] = [];
  const skipped: number[] = [];
  const locked: number[] = [];
  const dryRun: number[] = [];

  for (const batch of targetedBatches) {
    try {
      const result = await generateBatch({
        root,
        batch,
        resume: options.resume,
        dryRun: options.dryRun,
        staleLockMs: options.staleLockMs,
        providerName: options.providerName,
        providerModel: options.providerModel,
        promptVersion: options.promptVersion,
        buildReading: options.buildReading,
      });

      generated.push(result);
      if (result.status === "skipped") {
        skipped.push(batch);
      } else if (result.status === "locked") {
        locked.push(batch);
      } else if (result.status === "dry-run") {
        dryRun.push(batch);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Batch is locked:")) {
        locked.push(batch);
        continue;
      }
      throw error;
    }
  }

  return { targetedBatches, generated, skipped, locked, dryRun };
}

export function resolveTargetBatches(options: {
  from?: number;
  to?: number;
  batch?: number;
}): number[] {
  if (options.batch !== undefined) {
    assertBatchNumber(options.batch);
    return [options.batch];
  }

  const from = options.from ?? 1;
  const to = options.to ?? TAROT_TOTAL_BATCHES;
  assertBatchNumber(from);
  assertBatchNumber(to);
  if (from > to) {
    throw new Error(`--from must be less than or equal to --to (${from} > ${to})`);
  }
  return range(from, to);
}

export function getRetryableFailedBatches(
  failedRows: FailedBatchRecord[],
  completedBatches: number[],
): number[] {
  const completed = new Set(completedBatches);
  const retryable = new Set<number>();
  for (const row of failedRows) {
    if (!completed.has(row.batch)) {
      retryable.add(row.batch);
    }
  }
  return [...retryable].sort((left, right) => left - right);
}

export async function retryFailedBatches(
  root: string,
  options: {
    resume?: boolean;
    dryRun?: boolean;
    staleLockMs?: number;
    providerName: string;
    providerModel: string;
    promptVersion: string;
    buildReading: GenerateBatchOptions["buildReading"];
  },
): Promise<GenerationRunResult> {
  await ensureStaticArtifacts(root);
  const paths = getTarotPaths(root);
  const failedRows = await readJsonLines<FailedBatchRecord>(paths.failedLogFile);
  failedRows.forEach((row, index) =>
    validateFailedBatchRecord(row, paths.failedLogFile, index + 1),
  );
  const manifest = await deriveManifest(root);
  const targetedBatches = getRetryableFailedBatches(
    failedRows,
    manifest.completeBatches,
  );

  const generated: GenerateBatchResult[] = [];
  const skipped: number[] = [];
  const locked: number[] = [];
  const dryRun: number[] = [];

  for (const batch of targetedBatches) {
    try {
      const result = await generateBatch({
        root,
        batch,
        resume: options.resume ?? true,
        dryRun: options.dryRun,
        staleLockMs: options.staleLockMs,
        providerName: options.providerName,
        providerModel: options.providerModel,
        promptVersion: options.promptVersion,
        buildReading: options.buildReading,
      });
      generated.push(result);
      if (result.status === "skipped") {
        skipped.push(batch);
      } else if (result.status === "dry-run") {
        dryRun.push(batch);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Batch is locked:")) {
        locked.push(batch);
        continue;
      }
      throw error;
    }
  }

  return { targetedBatches, generated, skipped, locked, dryRun };
}

export function parseCliArgs(args: string[]): {
  resume: boolean;
  dryRun: boolean;
  json: boolean;
  from?: number;
  to?: number;
  batch?: number;
  staleLockMs?: number;
} {
  const parsed = {
    resume: false,
    dryRun: false,
    json: false,
    from: undefined as number | undefined,
    to: undefined as number | undefined,
    batch: undefined as number | undefined,
    staleLockMs: undefined as number | undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--resume") {
      parsed.resume = true;
      continue;
    }
    if (argument === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (argument === "--json") {
      parsed.json = true;
      continue;
    }
    if (argument === "--from") {
      parsed.from = parseNumericFlag("--from", args[++index]);
      continue;
    }
    if (argument === "--to") {
      parsed.to = parseNumericFlag("--to", args[++index]);
      continue;
    }
    if (argument === "--batch") {
      parsed.batch = parseNumericFlag("--batch", args[++index]);
      continue;
    }
    if (argument === "--stale-lock-ms") {
      parsed.staleLockMs = parseNumericFlag("--stale-lock-ms", args[++index]);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return parsed;
}

function parseNumericFlag(flag: string, value: string | undefined): number {
  if (value === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid numeric value for ${flag}: ${value}`);
  }
  return parsed;
}

function assertBatchNumber(batch: number): void {
  if (!Number.isInteger(batch) || batch < 1 || batch > TAROT_TOTAL_BATCHES) {
    throw new Error(`Batch must be between 1 and ${TAROT_TOTAL_BATCHES}: ${batch}`);
  }
}

export function formatGenerationSummary(result: GenerationRunResult): string {
  return [
    `targeted=${result.targetedBatches.length}`,
    `generated=${result.generated.filter((item) => item.status === "generated").length}`,
    `skipped=${result.skipped.length}`,
    `locked=${result.locked.length}`,
    `dryRun=${result.dryRun.length}`,
  ].join(" ");
}

export function formatManifestSummary(manifest: StatusManifest): string {
  return [
    `cards=${manifest.totals.cards}`,
    `combinations=${manifest.totals.combinations}`,
    `completedBatches=${manifest.coverage.completedBatches}`,
    `generatedRows=${manifest.coverage.generatedRows}`,
    `remainingRows=${manifest.coverage.remainingRows}`,
    `failed=${manifest.files.failedAttempts}`,
    `retryable=${manifest.files.unresolvedFailedBatches}`,
  ].join(" ");
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    const typed = error as NodeJS.ErrnoException;
    if (typed.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function cloneIntoTempRoot(sourceRoot: string, tempRoot: string): Promise<void> {
  const sourcePaths = getTarotPaths(sourceRoot);
  const targetPaths = getTarotPaths(tempRoot);
  await ensureStaticArtifacts(tempRoot);
  await mkdir(dirname(targetPaths.samplesFile), { recursive: true });
  await copyFile(sourcePaths.samplesFile, targetPaths.samplesFile, fsConstants.COPYFILE_FICLONE).catch(
    async () => {
      const content = await readFile(sourcePaths.samplesFile, "utf8");
      await writeFile(targetPaths.samplesFile, content, "utf8");
    },
  );
}
