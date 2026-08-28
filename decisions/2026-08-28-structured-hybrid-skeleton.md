# Structured reasoning with hybrid tarot skeletons

## Decision

질문 해석, 카드 관계, stance 판단, 한국어 렌더링을 분리하고, 76,076 조합은 완성 prose 대신 order-aware runtime binding이 가능한 skeleton으로 발전시킨다. 일반 사용자 런타임의 외부 LLM 호출은 추가하지 않는다.

## Context

현재 V2는 질문 keyword, card ID set, count 비교와 문장 조각을 한 함수에서 수행한다. 결정형 질문 오분류와 template 반복이 발생하며, 전수 prose corpus는 runtime에서 사용되지 않는다. canonical combination은 저장 비용을 낮추지만 선택 순서가 position 의미를 가진다.

## Rejected

- 단일 runtime LLM prompt: privacy, latency, cost 및 mission non-goal과 충돌.
- multi-candidate judge runtime: 무료 반복 사용의 비용과 latency가 과도.
- 456,456 ordered prose corpus: 검수와 변경 비용이 너무 큼.
- 현재 prose batch를 runtime truth로 사용: 질문 personalization을 제공하지 못함.

## Revisit trigger

Structured deterministic renderer가 50-case editorial gate를 통과하지 못하면, offline LLM-assisted skeleton authoring 또는 opt-in runtime renderer를 별도 product decision으로 재검토한다.
