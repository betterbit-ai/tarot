# Tarot Domain Specification

## Deck

Stable ids `0..77`: Major Arcana 22, then Wands, Cups, Swords, Pentacles with 14 cards each. Korean display uses 완드, 컵, 소드, 펜타클 and 페이지, 나이트, 퀸, 킹. V1 uses upright meaning only.

## Positions

1. 지금까지 이어져온 흐름
2. 지금 마주한 핵심
3. 앞으로 열릴 방향

The first chosen card maps to position one, and so on.

## Reading layers

1. stable card catalog with light and shadow meanings
2. optional authored canonical-combination story
3. position overlays based on chosen order
4. deterministic fallback that still produces one story

## Editorial rubric

- 담백하고 짧은 한국어
- 가능성과 걸림을 함께 본다
- 단정 대신 선택 기준을 제안한다
- headline, story, advice, closing으로 제한한다
- 금지: AI/알고리즘 문구, 100%/무조건, 공포 조장, 전문 조언 확정

## Artwork

V1은 오리지널 카드 뒷면과 provenance가 명확한 Public Domain Rider-Waite-Smith 원본 앞면을 로컬 최적화 자산으로 사용한다. 출처가 불명확한 스캔, 현대 recolor, runtime hotlink는 포함하지 않는다. 세부 source URL과 preprocessing은 `docs/TAROT_ASSETS.md`에 기록한다.
