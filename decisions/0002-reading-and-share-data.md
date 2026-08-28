# 0002: Canonical combinations with ordered overlays

## Decision

기본 리딩은 정렬된 세 카드 조합 76,076개 단위로 저장하고, 선택 순서는 세 위치 의미에 runtime으로 적용한다. 공유 토큰은 버전과 세 카드 순서만 담고 질문은 제외한다.

## Context and constraints

사용자가 고른 순서는 의미가 있어야 하지만 6개 순열을 모두 저장하면 생성과 검수 비용이 6배가 된다.

## Rejected

- 456,456개 순열 리딩: 중복과 비용이 과도하다.
- 카드별 단순 이어붙이기: 하나의 스토리라는 품질 계약을 만족하지 못한다.
- 질문을 토큰에 포함: 개인정보 노출 위험.

## Reversibility

버전 토큰과 lookup interface를 통해 이후 저장형 share나 더 정교한 position data로 이동할 수 있다.
