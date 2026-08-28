import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const CATEGORY = "Category:Rider-Waite-Smith tarot deck (TaionWC)";
const PUBLIC_DIR = new URL("../../public/tarot/cards/", import.meta.url);
const MANIFEST_PATH = new URL("../../data/tarot/rws-assets.json", import.meta.url);
const WIDTH = 600;
const QUALITY = 82;
const REQUEST_HEADERS = { "User-Agent": "TodayTarotAssetBuilder/1.0 (local production asset preparation)" };

const majorNames = [
  "Fool", "Magician", "High Priestess", "Empress", "Emperor", "Hierophant", "Lovers", "Chariot",
  "Strength", "Hermit", "Wheel of Fortune", "Justice", "Hanged Man", "Death", "Temperance", "Devil",
  "Tower", "Star", "Moon", "Sun", "Judgement", "World",
];

const majorKeys = [
  "the-fool", "the-magician", "the-high-priestess", "the-empress", "the-emperor", "the-hierophant",
  "the-lovers", "the-chariot", "strength", "the-hermit", "wheel-of-fortune", "justice", "the-hanged-man",
  "death", "temperance", "the-devil", "the-tower", "the-star", "the-moon", "the-sun", "judgement", "the-world",
];

const rankKeys = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"];
const suits = [
  { key: "wands", source: "Wands" },
  { key: "cups", source: "Cups" },
  { key: "swords", source: "Swords" },
  { key: "pentacles", source: "Pents" },
];

const expectedAssets = [
  ...majorNames.map((name, id) => ({
    id,
    key: majorKeys[id],
    sourceTitle: `File:RWS Tarot ${String(id).padStart(2, "0")} ${name}.jpg`,
  })),
  ...suits.flatMap((suit, suitIndex) =>
    rankKeys.map((rank, rankIndex) => ({
      id: 22 + suitIndex * 14 + rankIndex,
      key: `${suit.key}-${rank}`,
      sourceTitle: `File:${suit.source}${String(rankIndex + 1).padStart(2, "0")}.jpg`,
    })),
  ),
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(url, attempts = 6) {
  let response;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    response = await fetch(url, { headers: REQUEST_HEADERS });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) return response;
    await delay(Math.min(1_500 * (2 ** attempt), 12_000));
  }
  return response;
}

async function sha256(path) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

async function fetchCommonsMetadata() {
  const params = new URLSearchParams({
    action: "query",
    generator: "categorymembers",
    gcmtitle: CATEGORY,
    gcmtype: "file",
    gcmlimit: "100",
    prop: "imageinfo",
    iiprop: "url|size|sha1|extmetadata",
    format: "json",
    origin: "*",
  });
  const response = await fetchWithRetry(`${COMMONS_API}?${params}`);
  if (!response.ok) throw new Error(`Commons API failed: ${response.status}`);
  const payload = await response.json();
  return new Map(Object.values(payload.query.pages).map((page) => [page.title, page.imageinfo[0]]));
}

async function main() {
  const sourceByTitle = await fetchCommonsMetadata();
  if (sourceByTitle.size !== 78) throw new Error(`Expected 78 Commons files, received ${sourceByTitle.size}`);

  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(new URL("./", MANIFEST_PATH), { recursive: true });
  const workDir = await mkdir(join(tmpdir(), `today-tarot-rws-${process.pid}`), { recursive: true }).then(() => join(tmpdir(), `today-tarot-rws-${process.pid}`));
  const records = [];

  try {
    for (const asset of expectedAssets) {
      const source = sourceByTitle.get(asset.sourceTitle);
      if (!source) throw new Error(`Missing Commons source: ${asset.sourceTitle}`);
      const license = source.extmetadata?.LicenseShortName?.value;
      if (license !== "Public domain") throw new Error(`Unexpected license for ${asset.sourceTitle}: ${license}`);

      const sourcePath = join(workDir, basename(new URL(source.url).pathname));
      const fileName = `${String(asset.id).padStart(2, "0")}-${asset.key}.webp`;
      const finalPath = new URL(fileName, PUBLIC_DIR);
      const tempWebp = join(workDir, `${fileName}.tmp.webp`);
      const alreadyOptimized = await access(finalPath).then(() => true).catch(() => false);
      if (!alreadyOptimized) {
        const sourceFileName = asset.sourceTitle.replace(/^File:/, "");
        const downloadUrl = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(sourceFileName)}?width=${WIDTH}`;
        const response = await fetchWithRetry(downloadUrl);
        if (!response.ok) throw new Error(`Download failed for ${asset.sourceTitle}: ${response.status}`);
        await writeFile(sourcePath, Buffer.from(await response.arrayBuffer()));
        await run("cwebp", ["-quiet", "-q", String(QUALITY), "-resize", String(WIDTH), "0", "-metadata", "none", sourcePath, "-o", tempWebp]);
        await rename(tempWebp, finalPath);
        await delay(250);
      }

      records.push({
        id: asset.id,
        key: asset.key,
        file: `/tarot/cards/${fileName}`,
        sourceTitle: asset.sourceTitle,
        sourcePage: source.descriptionurl,
        originalUrl: source.url,
        originalWidth: source.width,
        originalHeight: source.height,
        originalSha1: source.sha1,
        outputSha256: await sha256(finalPath),
        license: license,
        licenseUrl: source.extmetadata?.LicenseUrl?.value ?? "https://creativecommons.org/publicdomain/mark/1.0/",
      });
      process.stdout.write(`${alreadyOptimized ? "reused" : "optimized"} ${asset.id + 1}/78 ${fileName}\n`);
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  const manifest = {
    deck: "Rider-Waite-Smith Tarot, Pam-A scan set",
    artist: "Pamela Colman Smith (1878-1951)",
    firstPublished: 1909,
    sourceCategory: `https://commons.wikimedia.org/wiki/${encodeURIComponent(CATEGORY.replace("Category:", "Category:"))}`,
    sourceSetFiles: records.length,
    license: "Public domain / Public Domain Mark 1.0",
    preprocessing: { format: "WebP", width: WIDTH, quality: QUALITY, metadata: "stripped", aspectRatio: "preserved" },
    generatedAt: new Date().toISOString(),
    assets: records,
  };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`wrote ${records.length} assets and ${MANIFEST_PATH.pathname}\n`);
}

await main();
