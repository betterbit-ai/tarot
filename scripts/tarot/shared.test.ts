import { mkdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { deterministicLocalProvider } from "./provider";
import {
  DEFAULT_PROVIDER,
  batchFileName,
  deriveManifest,
  ensureStaticArtifacts,
  generateBatch,
  getCombinationRowsForBatch,
  getRetryableFailedBatches,
  getTarotPaths,
  getTarotCardById,
  retryFailedBatches,
  runGeneration,
  serializeJsonLines,
  validateBatchFile,
  validateProjectData,
  writeFailedBatchRecord,
  type ReadingRecord,
} from "./shared";

const tempRoots: string[] = [];
const GENERATION_TEST_TIMEOUT = 20_000;

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function createTempRoot(name: string): Promise<string> {
  const root = join(tmpdir(), `tarot-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  tempRoots.push(root);
  await mkdir(root, { recursive: true });
  const paths = getTarotPaths(root);
  await mkdir(dirname(paths.samplesFile), { recursive: true });
  await mkdir(paths.batchesDir, { recursive: true });
  await mkdir(dirname(paths.failedLogFile), { recursive: true });
  await mkdir(dirname(paths.evalFile), { recursive: true });
  await mkdir(paths.locksDir, { recursive: true });
  await mkdir(paths.tempDir, { recursive: true });
  await mkdir(paths.checkpointsDir, { recursive: true });
  await writeFile(paths.samplesFile, SAMPLE_READINGS_FIXTURE, "utf8");
  await ensureStaticArtifacts(root);
  return root;
}

async function generateOne(root: string, batch: number, options?: { resume?: boolean; staleLockMs?: number }) {
  return generateBatch({
    root,
    batch,
    resume: options?.resume,
    staleLockMs: options?.staleLockMs,
    providerName: deterministicLocalProvider.name,
    providerModel: deterministicLocalProvider.model,
    promptVersion: deterministicLocalProvider.promptVersion,
    buildReading: deterministicLocalProvider.buildReading,
  });
}

const SAMPLE_READINGS_FIXTURE = `{"combination":"00-01-02","cards":[{"id":0,"key":"00","name":"바보","arcana":"major","suit":null,"rank":null},{"id":1,"key":"01","name":"마법사","arcana":"major","suit":null,"rank":null},{"id":2,"key":"02","name":"여사제","arcana":"major","suit":null,"rank":null}],"reading":{"headline":"가볍게 연 문이 곧 기준이 됩니다.","story":"바보의 새 기운이 마법사의 의지와 여사제의 침묵을 만나며, 서두르지 않을수록 더 좋은 선택지가 보입니다.","advice":"이미 시작한 일은 가볍게 밀고 가되, 오늘은 바로 답을 정하기보다 숨은 조건을 한 번 더 확인하세요.","closing":"조용히 확인한 한 가지가 다음 장면의 속도를 정리해 줍니다."},"version":1,"generation":{"provider":"authored","model":"editorial","promptVersion":"sample-v1","batch":0,"generatedAt":"2026-08-27T00:00:00.000Z"}}\n`;

describe("tarot data tooling", () => {
  it("ignores interrupted temp files and finalizes atomically", async () => {
    const root = await createTempRoot("temp");
    const paths = getTarotPaths(root);
    await writeFile(join(paths.tempDir, "batch-0001.tmp"), "incomplete\n", "utf8");

    const result = await generateOne(root, 1);

    expect(result.status).toBe("generated");
    await expect(stat(join(paths.batchesDir, batchFileName(1)))).resolves.toBeTruthy();
    await expect(stat(join(paths.tempDir, "batch-0001.tmp"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("skips valid batches on resume", async () => {
    const root = await createTempRoot("resume");
    await generateOne(root, 2);

    const result = await generateOne(root, 2, { resume: true });

    expect(result.status).toBe("skipped");
  }, GENERATION_TEST_TIMEOUT);

  it("supports ranged generation", async () => {
    const root = await createTempRoot("range");

    const result = await runGeneration(root, {
      from: 2,
      to: 3,
      providerName: deterministicLocalProvider.name,
      providerModel: deterministicLocalProvider.model,
      promptVersion: deterministicLocalProvider.promptVersion,
      buildReading: deterministicLocalProvider.buildReading,
    });

    expect(result.targetedBatches).toEqual([2, 3]);
    expect(result.generated.filter((entry) => entry.status === "generated")).toHaveLength(2);
  }, GENERATION_TEST_TIMEOUT);

  it("rejects overlapping locks and recovers stale locks", async () => {
    const root = await createTempRoot("locks");
    const paths = getTarotPaths(root);
    const lockPath = join(paths.locksDir, "batch-0004.lock");
    await writeFile(lockPath, "busy", "utf8");

    await expect(generateOne(root, 4, { staleLockMs: 60_000 })).rejects.toThrow(
      "Batch is locked",
    );

    const yesterday = new Date(Date.now() - 86_400_000);
    await utimes(lockPath, yesterday, yesterday);
    const result = await generateOne(root, 4, { staleLockMs: 1_000 });

    expect(result.status).toBe("generated");
  }, GENERATION_TEST_TIMEOUT);

  it("rejects invalid json, invalid keys, and wrong row counts", async () => {
    const root = await createTempRoot("invalid");
    const paths = getTarotPaths(root);
    const batchFile = join(paths.batchesDir, batchFileName(5));

    await writeFile(batchFile, "{bad json}\n", "utf8");
    await expect(validateBatchFile(batchFile, 5)).rejects.toThrow("Invalid JSON");

    const rows = getCombinationRowsForBatch(5);
    const invalidKeyRows: ReadingRecord[] = rows.map((row) => ({
      combination: row.combination === rows[0]?.combination ? "01-00-02" : row.combination,
      cards: row.cards,
      reading: deterministicLocalProvider.buildReading(
        row.cards.map((card) => getTarotCardById(card.id)),
        row.combination,
      ),
      version: 1,
      generation: {
        provider: DEFAULT_PROVIDER,
        model: "built-in",
        promptVersion: "local-v1",
        batch: 5,
        generatedAt: "2026-08-27T00:00:00.000Z",
      },
    }));
    await writeFile(batchFile, serializeJsonLines(invalidKeyRows), "utf8");
    await expect(validateBatchFile(batchFile, 5)).rejects.toThrow("Invalid combination key");

    await writeFile(batchFile, serializeJsonLines(invalidKeyRows.slice(0, -1)), "utf8");
    await expect(validateBatchFile(batchFile, 5)).rejects.toThrow("must contain 200 rows");
  });

  it("derives manifest status counts", async () => {
    const root = await createTempRoot("status");
    await generateOne(root, 1);
    await writeFailedBatchRecord(root, {
      batch: 9,
      attemptedAt: "2026-08-27T00:00:00.000Z",
      provider: DEFAULT_PROVIDER,
      error: "temporary failure",
    });

    const manifest = await deriveManifest(root);

    expect(manifest.coverage.completedBatches).toBe(1);
    expect(manifest.files.generatedRows).toBe(200);
    expect(manifest.unresolvedFailedBatches).toEqual([9]);
  });

  it("selects unresolved failed batches for retry", async () => {
    const root = await createTempRoot("retry");
    await writeFailedBatchRecord(root, {
      batch: 6,
      attemptedAt: "2026-08-27T00:00:00.000Z",
      provider: DEFAULT_PROVIDER,
      error: "timeout",
    });
    await writeFailedBatchRecord(root, {
      batch: 7,
      attemptedAt: "2026-08-27T00:00:00.000Z",
      provider: DEFAULT_PROVIDER,
      error: "timeout",
    });
    await generateOne(root, 7);

    const result = await retryFailedBatches(root, {
      providerName: deterministicLocalProvider.name,
      providerModel: deterministicLocalProvider.model,
      promptVersion: deterministicLocalProvider.promptVersion,
      buildReading: deterministicLocalProvider.buildReading,
    });

    expect(result.targetedBatches).toEqual([6]);
    await expect(stat(join(getTarotPaths(root).batchesDir, batchFileName(6)))).resolves.toBeTruthy();
  });

  it("validates the full universe independently of generated coverage", async () => {
    const root = await createTempRoot("validate");
    const summary = await validateProjectData(root);
    expect(summary.totals.combinations).toBe(76076);
    expect(summary.evalRows).toBe(100);
  });

  it("can compute retryable batches from raw failure rows", () => {
    expect(
      getRetryableFailedBatches(
        [
          { batch: 3, attemptedAt: "2026-08-27T00:00:00.000Z", provider: DEFAULT_PROVIDER, error: "x" },
          { batch: 5, attemptedAt: "2026-08-27T00:00:00.000Z", provider: DEFAULT_PROVIDER, error: "y" },
          { batch: 3, attemptedAt: "2026-08-27T00:00:00.000Z", provider: DEFAULT_PROVIDER, error: "z" },
        ],
        [5],
      ),
    ).toEqual([3]);
  });
});
