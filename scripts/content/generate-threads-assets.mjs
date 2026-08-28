import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "public/threads/week-01");
const posts = [
  { day: "01", title: "처음 멈춘 카드", count: 5, footer: "요즘 자꾸 생각나는 일" },
  { day: "02", title: "한 사람을 생각하며", count: 3, footer: "1 · 2 · 3 중 하나" },
  { day: "03", title: "이번 주말", count: 3, footer: "어디에 마음이 놓일까" },
  { day: "04", title: "YES / NOT YET / NO", count: 3, footer: "지금 고민하는 일" },
  { day: "05", title: "왜 이렇게 답답할까", count: 3, footer: "먼저 눈에 들어오는 카드" },
  { day: "06", title: "이직할까, 남을까", count: 3, footer: "어떤 조건을 먼저 볼까" },
  { day: "07", title: "이번 주, 한 단어", count: 3, footer: "댓글로 남겨주세요" },
];

function card(x, y, index, total) {
  const rotation = (index - (total - 1) / 2) * 4;
  return `<g transform="translate(${x} ${y}) rotate(${rotation} 120 190)">
    <rect width="240" height="380" rx="20" fill="#10231d" stroke="#caa46a" stroke-width="3"/>
    <rect x="14" y="14" width="212" height="352" rx="14" fill="none" stroke="#8e7148" stroke-width="2"/>
    <path d="M32 32h176v316H32z" fill="none" stroke="#6c593d" stroke-width="1"/>
    <circle cx="120" cy="190" r="62" fill="none" stroke="#caa46a" stroke-width="3"/>
    <path d="M72 190h96M120 142v96M88 158l64 64M152 158l-64 64" stroke="#caa46a" stroke-width="2" opacity=".8"/>
    <text x="120" y="292" text-anchor="middle" fill="#e7d4b0" font-family="Arial, sans-serif" font-size="32" letter-spacing="5">${index + 1}</text>
  </g>`;
}

function svg(post) {
  const gap = 34;
  const width = post.count * 240 + (post.count - 1) * gap;
  const start = (1080 - width) / 2;
  const cards = Array.from({ length: post.count }, (_, index) => card(start + index * (240 + gap), 405, index, post.count)).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#0b1512"/>
  <rect x="40" y="40" width="1000" height="1270" rx="32" fill="none" stroke="#8e7148" stroke-opacity=".42"/>
  <text x="80" y="112" fill="#d3aa68" font-family="Arial, sans-serif" font-size="24" letter-spacing="6">MR. TAROT</text>
  <text x="80" y="220" fill="#f2e7d5" font-family="Georgia, serif" font-size="58">${post.title}</text>
  <text x="80" y="278" fill="#cbbba3" font-family="Arial, sans-serif" font-size="28">${post.footer}</text>
  ${cards}
  <line x1="80" y1="1160" x2="1000" y2="1160" stroke="#8e7148" stroke-opacity=".45"/>
  <text x="80" y="1220" fill="#a99478" font-family="Arial, sans-serif" font-size="24">카드 하나를 고르고, 결과는 댓글에서</text>
  <text x="1000" y="1220" text-anchor="end" fill="#d3aa68" font-family="Arial, sans-serif" font-size="24">DAY ${post.day}</text>
</svg>`;
}

await mkdir(root, { recursive: true });
await Promise.all(posts.map((post) => writeFile(resolve(root, `day-${post.day}.svg`), svg(post), "utf8")));
console.log(`generated ${posts.length} Threads SVG assets in ${root}`);
