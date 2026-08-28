import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const cliArgs = process.argv.slice(2)[0] === "--" ? process.argv.slice(3) : process.argv.slice(2);
const [dayArg, part = "all", ...rest] = cliArgs;
const printOnly = rest.includes("--print");
const dayNumber = dayArg?.match(/\d+/)?.[0];
const day = dayNumber ? `day-${dayNumber.padStart(2, "0")}` : "";

if (!/^day-0[1-7]$/.test(day) || !["main", "comments", "cta", "all"].includes(part) && !/^comment-[1-5]$/.test(part)) {
  console.error("사용법: pnpm threads:copy -- day-01 main|comment-1|comments|cta|all [--print]");
  process.exit(1);
}

const calendar = await readFile(resolve(process.cwd(), "docs/content/threads-week-01.md"), "utf8");
const dayHeading = new RegExp(`^## DAY ${Number(dayNumber)} — .*$`, "m");
const headingMatch = calendar.match(dayHeading);
if (!headingMatch || headingMatch.index === undefined) throw new Error(`${day} 콘텐츠를 찾지 못했습니다.`);
const nextDay = calendar.indexOf("\n## DAY ", headingMatch.index + headingMatch[0].length);
const section = calendar.slice(headingMatch.index, nextDay === -1 ? calendar.length : nextDay);

function between(starts, end) {
  const startIndexes = starts.map((start) => section.indexOf(start)).filter((index) => index >= 0);
  if (startIndexes.length === 0) return "";
  const startIndex = Math.min(...startIndexes);
  const start = starts.find((candidate) => section.indexOf(candidate) === startIndex);
  const contentStart = startIndex + start.length;
  const endCandidates = (Array.isArray(end) ? end : [end]).filter(Boolean).map((candidate) => section.indexOf(candidate, contentStart)).filter((index) => index >= 0);
  const endIndex = endCandidates.length > 0 ? Math.min(...endCandidates) : section.length;
  return section.slice(contentStart, endIndex).trim();
}

const main = between(["HOOK / MAIN POST:"], ["CARDS:", "CARDS FOR SAMPLE REPLIES:"]);
const comments = between(["COMMENTS:", "SAMPLE REPLY COMMENTS:"], "CTA COMMENT:");
const cta = between(["CTA COMMENT:"], "IMAGE:");
const clean = (value) => value.replace(/^\s*\d+\.\s.*\n/gm, "").replace(/\n{3,}/g, "\n\n").trim();
const commentBlocks = clean(comments).split(/\n\n(?=\d+번|“)/).filter(Boolean);
const output = part === "main" ? clean(main) : /^comment-/.test(part) ? commentBlocks[Number(part.slice("comment-".length)) - 1] ?? "" : part === "comments" ? clean(comments) : part === "cta" ? clean(cta) : [clean(main), clean(comments), clean(cta)].filter(Boolean).join("\n\n---\n\n");

if (!printOnly) {
  const result = spawnSync("pbcopy", { input: output, encoding: "utf8" });
  if (result.error) {
    console.log(output);
    console.error("pbcopy를 사용할 수 없어 텍스트를 출력했습니다.");
    process.exit(0);
  }
  console.log(`${day} ${part} 내용을 클립보드에 복사했습니다.`);
} else {
  console.log(output);
}
