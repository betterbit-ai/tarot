import { TOTAL_TAROT_CARDS, type CardId, type MinorRank, type Suit, type TarotCard } from "./types";

const MAJOR_ARCANA: ReadonlyArray<Pick<TarotCard, "key" | "name" | "meaning">> = [
  { key: "the-fool", name: "바보", meaning: { light: "가볍게 첫발을 떼는 용기", shadow: "준비 없는 낙관" } },
  { key: "the-magician", name: "마법사", meaning: { light: "의지를 현실로 꺼내는 집중", shadow: "말만 앞서는 과시" } },
  { key: "the-high-priestess", name: "여사제", meaning: { light: "조용히 본질을 읽는 직감", shadow: "속마음을 닫아버리는 거리감" } },
  { key: "the-empress", name: "여황제", meaning: { light: "풍요를 돌보고 키우는 여유", shadow: "편안함에만 머무는 안일함" } },
  { key: "the-emperor", name: "황제", meaning: { light: "기준을 세우는 단단한 책임", shadow: "유연함 없는 통제" } },
  { key: "the-hierophant", name: "교황", meaning: { light: "배운 원칙을 삶에 맞추는 태도", shadow: "남의 기준만 따르는 경직" } },
  { key: "the-lovers", name: "연인", meaning: { light: "마음을 담아 선택하는 진심", shadow: "갈등 앞에서 미루는 우유부단" } },
  { key: "the-chariot", name: "전차", meaning: { light: "흐름을 몰고 가는 추진력", shadow: "속도에 취한 무리수" } },
  { key: "strength", name: "힘", meaning: { light: "거친 감정을 다루는 내면의 힘", shadow: "억누르기만 하는 버팀" } },
  { key: "the-hermit", name: "은둔자", meaning: { light: "혼자 비춰보는 성찰", shadow: "세상과 너무 멀어지는 고립" } },
  { key: "wheel-of-fortune", name: "운명의 수레바퀴", meaning: { light: "변화의 타이밍을 붙잡는 유연함", shadow: "흐름을 핑계로 맡겨버림" } },
  { key: "justice", name: "정의", meaning: { light: "사실과 균형을 따지는 분별", shadow: "차갑게 재단하는 판단" } },
  { key: "the-hanged-man", name: "매달린 사람", meaning: { light: "관점을 바꾸며 기다리는 지혜", shadow: "멈춤이 길어지는 정체" } },
  { key: "death", name: "죽음", meaning: { light: "끝내야 할 것을 정리하는 결단", shadow: "상실을 두려워해 붙드는 집착" } },
  { key: "temperance", name: "절제", meaning: { light: "다른 리듬을 섞어 맞추는 조율", shadow: "결론을 미루기만 하는 완충" } },
  { key: "the-devil", name: "악마", meaning: { light: "욕망의 실체를 똑바로 보는 정직함", shadow: "익숙한 유혹에 묶이는 상태" } },
  { key: "the-tower", name: "탑", meaning: { light: "거짓 버팀목을 깨는 각성", shadow: "갑작스런 충돌에 휩쓸림" } },
  { key: "the-star", name: "별", meaning: { light: "먼 곳을 다시 믿는 희망", shadow: "현실감 없는 기대" } },
  { key: "the-moon", name: "달", meaning: { light: "불확실함 속 감각을 지키는 예민함", shadow: "불안이 만든 오해" } },
  { key: "the-sun", name: "태양", meaning: { light: "솔직하게 드러나는 생기", shadow: "밝음만 고집하는 가벼움" } },
  { key: "judgement", name: "심판", meaning: { light: "지나온 시간을 불러내는 각성", shadow: "과거 평가에 묶이는 주저" } },
  { key: "the-world", name: "세계", meaning: { light: "한 주기를 완성하는 성취", shadow: "마침표를 못 찍는 미련" } },
];

const MINOR_RANKS: ReadonlyArray<{ rank: MinorRank; label: string; meaning: { light: string; shadow: string } }> = [
  { rank: "ace", label: "에이스", meaning: { light: "새로운 시작을 받아들이는 자세", shadow: "불쑥 시작만 하고 흐리는 태도" } },
  { rank: "two", label: "2", meaning: { light: "가능성을 가늠하며 고르는 감각", shadow: "결정을 미루며 흔들리는 상태" } },
  { rank: "three", label: "3", meaning: { light: "흐름을 넓히며 연결하는 확장", shadow: "기대만 키우고 손이 늦는 상태" } },
  { rank: "four", label: "4", meaning: { light: "기반을 다지며 안정시키는 힘", shadow: "움직임을 막는 고착" } },
  { rank: "five", label: "5", meaning: { light: "불편함 속 쟁점을 드러내는 용기", shadow: "소모적인 충돌에 갇힘" } },
  { rank: "six", label: "6", meaning: { light: "주고받는 균형을 살피는 태도", shadow: "정체된 패턴에 기대는 버릇" } },
  { rank: "seven", label: "7", meaning: { light: "의심 속에서도 기준을 지키는 버팀", shadow: "방어만 늘어나는 피로" } },
  { rank: "eight", label: "8", meaning: { light: "리듬을 만들며 계속 쌓는 집중", shadow: "몰입이 좁아지는 답답함" } },
  { rank: "nine", label: "9", meaning: { light: "마지막 고비를 견디는 끈기", shadow: "경계심이 지나친 긴장" } },
  { rank: "ten", label: "10", meaning: { light: "끝까지 책임지는 완수", shadow: "짐이 너무 커진 과부하" } },
  { rank: "page", label: "페이지", meaning: { light: "새 소식을 배우는 호기심", shadow: "가벼운 흥분에 휩쓸림" } },
  { rank: "knight", label: "나이트", meaning: { light: "몸을 던져 전진하는 추진", shadow: "브레이크 없는 질주" } },
  { rank: "queen", label: "퀸", meaning: { light: "상황을 품고 읽는 성숙함", shadow: "감정이 섞인 통제" } },
  { rank: "king", label: "킹", meaning: { light: "방향을 이끄는 주도권", shadow: "강하게 밀어붙이는 완고함" } },
];

const SUIT_DEFINITIONS: ReadonlyArray<{
  suit: Suit;
  label: string;
  key: string;
  prefix: { light: string; shadow: string };
}> = [
  { suit: "wands", label: "완드", key: "wands", prefix: { light: "열정에 불을 붙이며", shadow: "열기에 휩쓸려" } },
  { suit: "cups", label: "컵", key: "cups", prefix: { light: "감정의 흐름을 살피며", shadow: "감정에 잠겨" } },
  { suit: "swords", label: "소드", key: "swords", prefix: { light: "판단을 또렷하게 하며", shadow: "생각이 과열되어" } },
  { suit: "pentacles", label: "펜타클", key: "pentacles", prefix: { light: "현실을 단단히 만들며", shadow: "안정에만 매여" } },
];

const MINOR_ARCANA = SUIT_DEFINITIONS.flatMap((definition, suitIndex) =>
  MINOR_RANKS.map((rankDefinition, rankIndex) => {
    const id = 22 + suitIndex * MINOR_RANKS.length + rankIndex;

    return {
      id,
      key: `${definition.key}-${rankDefinition.rank}`,
      name: `${definition.label} ${rankDefinition.label}`,
      arcana: "minor" as const,
      suit: definition.suit,
      rank: rankDefinition.rank,
      meaning: {
        light: `${definition.prefix.light} ${rankDefinition.meaning.light}`,
        shadow: `${definition.prefix.shadow} ${rankDefinition.meaning.shadow}`,
      },
    };
  }),
);

export const TAROT_CARDS: readonly TarotCard[] = [
  ...MAJOR_ARCANA.map((card, index) => ({
    id: index,
    key: card.key,
    name: card.name,
    arcana: "major" as const,
    suit: null,
    rank: `major-${index}` as const,
    meaning: card.meaning,
  })),
  ...MINOR_ARCANA,
];

if (TAROT_CARDS.length !== TOTAL_TAROT_CARDS) {
  throw new Error(`Expected ${TOTAL_TAROT_CARDS} tarot cards, received ${TAROT_CARDS.length}`);
}

export const TAROT_CARD_IDS: readonly CardId[] = TAROT_CARDS.map((card) => card.id);

const TAROT_CARDS_BY_ID = new Map<CardId, TarotCard>(TAROT_CARDS.map((card) => [card.id, card]));

export function getTarotCard(cardId: CardId): TarotCard {
  const card = TAROT_CARDS_BY_ID.get(cardId);

  if (!card) {
    throw new RangeError(`Unknown tarot card id: ${cardId}`);
  }

  return card;
}

export function getTarotCards(cardIds: readonly CardId[]): TarotCard[] {
  return cardIds.map(getTarotCard);
}
