import {
  TAROT_CARDS as DOMAIN_CARDS,
  TAROT_POSITIONS,
  getTarotCard as getDomainCard,
  shuffleCardIds,
  type Arcana,
  type Suit,
} from "@/domain/tarot";

export type TarotArcana = Arcana;
export type TarotSuit = Suit;

export type TarotCard = {
  id: number;
  key: string;
  label: string;
  nameEn: string;
  imagePath: string;
  arcana: TarotArcana;
  suit?: TarotSuit;
  rank?: string;
  light: string;
  shadow: string;
};

const MAJOR_NAMES_EN = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant",
  "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man",
  "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
] as const;

const RANK_NAMES_EN: Record<string, string> = {
  ace: "Ace",
  two: "Two",
  three: "Three",
  four: "Four",
  five: "Five",
  six: "Six",
  seven: "Seven",
  eight: "Eight",
  nine: "Nine",
  ten: "Ten",
  page: "Page",
  knight: "Knight",
  queen: "Queen",
  king: "King",
};

const SUIT_NAMES_EN: Record<Suit, string> = {
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

function toDisplayCard(cardId: number): TarotCard {
  const card = getDomainCard(cardId);
  const minorRank = card.arcana === "minor" ? card.rank : undefined;

  return {
    id: card.id,
    key: card.key,
    label: card.name,
    nameEn:
      card.arcana === "major"
        ? MAJOR_NAMES_EN[card.id]
        : `${RANK_NAMES_EN[minorRank ?? ""]} of ${SUIT_NAMES_EN[card.suit as Suit]}`,
    imagePath: `/tarot/cards/${String(card.id).padStart(2, "0")}-${card.key}.webp`,
    arcana: card.arcana,
    suit: card.suit ?? undefined,
    rank: card.arcana === "minor" ? card.name.split(" ").at(-1) : undefined,
    light: card.meaning.light,
    shadow: card.meaning.shadow,
  };
}

export const TAROT_CARDS: readonly TarotCard[] = DOMAIN_CARDS.map((card) => toDisplayCard(card.id));

export const POSITION_LABELS = TAROT_POSITIONS.map((position) => position.label) as readonly string[];

export function getTarotCard(id: number): TarotCard {
  getDomainCard(id);
  return TAROT_CARDS[id];
}

export function getCardsByIds(ids: readonly number[]): TarotCard[] {
  return ids.map(getTarotCard);
}

export function formatCardId(id: number): string {
  return id.toString().padStart(2, "0");
}

export function createShuffledDeck(): number[] {
  return shuffleCardIds();
}
