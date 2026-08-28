import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ThreadDay = {
  day: number;
  title: string;
  main: string;
  comments: string[];
  cta: string;
  topic: string;
  goal: string;
  imageSrc: string;
};

const calendar = readFileSync(resolve(process.cwd(), "docs/content/threads-week-01.md"), "utf8");

function sectionBetween(section: string, starts: string[], ends: string[]): string {
  const startCandidates = starts.map((start) => section.indexOf(start)).filter((index) => index >= 0);
  if (!startCandidates.length) return "";
  const startIndex = Math.min(...startCandidates);
  const marker = starts.find((start) => section.indexOf(start) === startIndex) ?? "";
  const contentStart = startIndex + marker.length;
  const endCandidates = ends.map((end) => section.indexOf(end, contentStart)).filter((index) => index >= 0);
  const endIndex = endCandidates.length ? Math.min(...endCandidates) : section.length;
  return section.slice(contentStart, endIndex).trim();
}

function clean(value: string): string {
  return value.replace(/^\s*\d+\.\s.*\n/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

function parseDay(day: number, title: string, section: string): ThreadDay {
  const main = clean(sectionBetween(section, ["HOOK / MAIN POST:"], ["CARDS:", "CARDS FOR SAMPLE REPLIES:"]));
  const commentsText = clean(sectionBetween(section, ["COMMENTS:", "SAMPLE REPLY COMMENTS:"], ["CTA COMMENT:"]));
  const comments = commentsText.split(/\n\n(?=\d+번|“)/).filter(Boolean).map((comment) => comment.trim());
  const cta = clean(sectionBetween(section, ["CTA COMMENT:"], ["IMAGE:"]));
  const topic = section.match(/TOPIC:\s*(.+)/)?.[1]?.trim() ?? "타로";
  const goal = section.match(/목표:\s*(.+)/)?.[1]?.trim() ?? "ENGAGEMENT";
  return { day, title, main, comments, cta, topic, goal, imageSrc: `/threads/week-01/day-${String(day).padStart(2, "0")}.png` };
}

export const THREADS_WEEK_ONE: ThreadDay[] = Array.from({ length: 7 }, (_, index) => {
  const day = index + 1;
  const pattern = new RegExp(`^## DAY ${day} — (.+)$`, "m");
  const match = calendar.match(pattern);
  if (!match || match.index === undefined) throw new Error(`Missing Threads day ${day}`);
  const next = calendar.indexOf("\n## DAY ", match.index + match[0].length);
  return parseDay(day, match[1], calendar.slice(match.index, next === -1 ? calendar.length : next));
});
