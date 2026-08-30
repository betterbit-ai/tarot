import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(process.cwd());
const queue = JSON.parse(await readFile(join(root, "data/content/threads-queue.json"), "utf8"));
const outputDir = join(root, "public/threads/generated");
await mkdir(outputDir, { recursive: true });

const escapeXml = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
const wrap = (value, limit = 17) => {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > limit && line) { lines.push(line); line = word; } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
};
const cardX = (count) => Array.from({ length: count }, (_, index) => 540 + (index - (count - 1) / 2) * (count === 5 ? 165 : 230));
const imageFor = (item) => {
  if (!item.imageAsset) return null;
  const lines = wrap(item.hook);
  const cards = cardX(item.cardIds.length || 3).map((x, index) => `
    <g transform="translate(${x - 100} ${690 + Math.abs(index - (item.cardIds.length - 1) / 2) * 22}) rotate(${(index - (item.cardIds.length - 1) / 2) * 4} 100 150)">
      <rect width="200" height="300" rx="24" fill="#10251d" stroke="#d6ad67" stroke-width="4"/>
      <image href="/images/tarot-card-back.png" width="200" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip)"/>
      <circle cx="100" cy="48" r="28" fill="#ecd69f"/>
      <text x="100" y="59" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#21180f">${index + 1}</text>
    </g>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs><clipPath id="clip"><rect width="200" height="300" rx="24"/></clipPath></defs>
  <rect width="1080" height="1350" fill="#0b1512"/>
  <path d="M72 104 H1008" stroke="#b78d50" stroke-opacity=".34"/>
  <text x="540" y="180" text-anchor="middle" font-family="serif" font-size="38" fill="#e9d7b7" letter-spacing="3">MR. TAROT</text>
  ${lines.map((line, index) => `<text x="540" y="${280 + index * 76}" text-anchor="middle" font-family="serif" font-size="62" fill="#f2e7d5">${escapeXml(line)}</text>`).join("")}
  <text x="540" y="${520 + lines.length * 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#c8b596">${item.format === "CONVERSATION" ? "댓글에 한 단어만 남겨주세요" : "오래 고르지 말고, 먼저 멈춘 숫자로요"}</text>
  ${cards}
  <path d="M72 1170 H1008" stroke="#b78d50" stroke-opacity=".34"/>
  <text x="540" y="1235" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" fill="#d7bd8c">@mr._.tarot</text>
</svg>`;
};

let generated = 0;
for (const item of queue.items) {
  const svg = imageFor(item);
  if (!svg || !item.imageAsset) continue;
  await writeFile(join(root, "public", item.imageAsset), svg, "utf8");
  generated += 1;
}
process.stdout.write(`generated=${generated} output=${outputDir}\n`);
