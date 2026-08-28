# 0001: Mostly-static Next.js application

## Decision

Next.js App Router를 사용하고, 리추얼은 클라이언트 상태 머신으로 구현한다. 공유/OG/제휴 redirect만 서버 경계에 두며 데이터베이스를 추가하지 않는다.

## Context and constraints

제품은 풍부한 브라우저 상호작용이 필요하지만 읽기 데이터는 정적이며 사용자 계정이나 durable mutation이 없다. 질문은 외부로 보내지 않는다.

## Rejected

- 런타임 LLM: 비용, 지연, 개인정보, 제품 계약 위반.
- DB 우선: 현재 요구에 비해 운영 부담이 크다.
- 76,076개 정적 페이지: 빌드와 배포 비용만 키운다.

## Reversibility

`lookupReading()`과 공유 route를 유지한 채 저장소를 object storage 또는 DB로 교체할 수 있다.

## Revisit trigger

계정, 기록, mutable share가 추가되거나 정적 데이터가 배포 한계를 실제로 만든 때 재검토한다.
