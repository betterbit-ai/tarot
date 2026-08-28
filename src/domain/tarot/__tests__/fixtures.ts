import type { RandomIndexSource } from "../deck";
import type { ReadingRecord } from "../types";

export function createDeterministicRandomIndex(seed = 1): RandomIndexSource {
  let state = seed >>> 0;

  return (maxExclusive) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % maxExclusive;
  };
}

export const AUTHORED_READING_FIXTURE: ReadingRecord = {
  combination: "01-02-03",
  cards: [1, 2, 3],
  version: 7,
  reading: {
    headline: "테스트용 리딩",
    story: "정렬된 조합에 연결된 authored 리딩을 붙입니다.",
    advice: "선택 기준을 분명히 적어보세요.",
    closing: "질문은 남기지 않고 카드 순서만 기억합니다.",
  },
};
