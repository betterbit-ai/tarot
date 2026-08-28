import type { ReadingRecord } from "@/domain/tarot";

export const SAMPLE_READING_OVERRIDES: readonly ReadingRecord[] = [
  {
    combination: "00-01-02",
    cards: [0, 1, 2],
    reading: {
      headline: "가볍게 연 문이 곧 기준이 됩니다.",
      story: "바보의 새 기운이 마법사의 의지와 여사제의 침묵을 만나며, 서두르지 않을수록 더 좋은 선택지가 보입니다.",
      advice: "이미 시작한 일은 가볍게 밀고 가되, 오늘은 바로 답을 정하기보다 숨은 조건을 한 번 더 확인하세요.",
      closing: "조용히 확인한 한 가지가 다음 장면의 속도를 정리해 줍니다.",
    },
    version: 1,
  },
  {
    combination: "07-17-19",
    cards: [7, 17, 19],
    reading: {
      headline: "밀고 나갈 힘이 이미 충분합니다.",
      story: "전차의 추진력 위에 별의 희망과 태양의 밝음이 겹치며, 지금은 의심보다 리듬을 유지하는 편이 유리합니다.",
      advice: "방향은 이미 정해졌으니 속도보다 호흡을 관리하고, 보이는 성과보다 오래 가는 방식을 고르세요.",
      closing: "기세를 믿되 과열만 피하면 흐름이 자연스럽게 이어집니다.",
    },
    version: 1,
  },
  {
    combination: "22-36-50",
    cards: [22, 36, 50],
    reading: {
      headline: "새로운 시작이 셋의 방향에서 함께 올라옵니다.",
      story: "완드의 의지, 컵의 감정, 소드의 판단이 모두 첫 문장을 쓰려 하므로 무엇을 먼저 열지 정하는 일이 가장 중요합니다.",
      advice: "아이디어가 많을수록 한 번에 하나만 움직이고, 감정과 논리를 같은 문장 안에 정리해 보세요.",
      closing: "첫 선택의 순서가 이후의 가벼움과 피로를 가릅니다.",
    },
    version: 1,
  },
  {
    combination: "35-49-63",
    cards: [35, 49, 63],
    reading: {
      headline: "주도권은 있지만 쓰는 방식이 관건입니다.",
      story: "세 킹이 모인 조합은 책임감과 기준이 강하다는 뜻이지만, 각자의 방식이 너무 단단하면 대화가 금방 무거워질 수 있습니다.",
      advice: "결정을 미루지 말되, 상대를 설득하기 전에 먼저 무엇을 지키려는지 분명히 적어 보세요.",
      closing: "강한 카드일수록 부드러운 설명이 더 큰 힘을 냅니다.",
    },
    version: 1,
  },
];
