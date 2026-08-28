# Executable Product Spec

## Active iteration: UX v2

### Outcome

기존 리추얼과 자산을 보존하면서 카드 선택은 실제 테이블 spread처럼 빠르고 촘촘하게 만들고, reveal 전 카드 정체를 완전히 숨기며, 입력한 질문에 직접 답하는 연결형 리딩과 실제 curated 상품 추천을 제공한다.

### Required behavior

1. 선택 장면은 78장의 동일한 card-back을 한 화면 안의 두 겹 사선/부채꼴 spread로 배치한다. 긴 horizontal list 탐색이 주 interaction이 되면 안 된다.
2. spread는 CSS transform과 opacity 중심으로 0.5-1.2초 안에 한 번에 펼쳐진다. card-back 한 자산만 사용하고 front image는 reveal 전 로드하지 않는다.
3. 선택 전/후 카드명, id, suit, meaning을 visible 또는 accessibility tree에 노출하지 않는다. 선택 상태는 첫 번째/두 번째/세 번째와 1/2/3 marker만 알린다.
4. 질문이 있으면 reading 본문이 질문 유형과 실제 문장을 직접 언급해 답한다. 질문이 없으면 지금 가장 마음에 걸린 일을 기준으로 읽는다.
5. interpretation은 reinforcement/contradiction, suit transition, active/passive, attachment/release, major/minor balance, repeated suit, rank progression, court cards를 사용해 세 장을 하나의 주장으로 연결한다.
6. 결과는 350-650자 수준을 우선하며 `카드를 같이 보면`, `특히 걸리는 건`, `그래서 이 질문에는`, `지금 해볼 것`의 짧은 문단 구조를 사용한다.
7. 20-50개 representative evaluation combinations를 repository에 고정하고 질문 응답성, 자연스러운 한국어, 카드 연결, 구체성, 무작위 조합 재사용 가능성을 평가한다. 전체 76,076 생성은 실행하지 않는다.
8. Affiliate는 curated product config를 통해 상품 이미지, 이름, 카드/질문과 연결되는 한 문장, CTA, disclosure를 보여준다. 가격은 검증된 데이터가 없으므로 표시하지 않는다.
9. `쿠팡에서 보기`와 `건너뛰고 결과 보기`를 모두 제공하며 URL이 없거나 유효하지 않아도 결과를 막지 않는다.
10. 결과 화면은 세 카드가 가장 먼저 보이고, 긴 아이보리 문서/상태 박스보다 짧은 리딩과 구체 행동이 중심이 된다.

### Acceptance criteria and evidence

| Criterion | Evidence |
| --- | --- |
| 375/390/430px에서 많은 카드가 동시에 보임 | browser screenshots and visible-card count |
| 선택 화면 진입 후 spread가 1.2초 안에 보임 | browser timing measurement |
| 긴 horizontal scroll 의존 제거 | layout metrics and interaction inspection |
| reveal 전 identity 0건 | DOM/a11y snapshot and tests |
| 선택/해제/1-2-3 marker 정상 | component and browser tests |
| 질문이 결과에 직접 반영됨 | deterministic interpretation tests with question fixtures |
| 세 카드 relationship 분석 | representative evaluation tests |
| 결과 길이와 금칙어 준수 | automated content validation |
| 상품 visual/name/reason/CTA/disclosure 존재 | component and browser tests |
| skip/missing URL safety | integration tests |
| RWS assets와 generation 0 유지 | tarot validate/status |

### Constraints

- Reader, card back, Public Domain RWS 78장, share routes, domain catalog, generation pipeline을 보존한다.
- 새로운 이미지 생성이나 76,076개 대량 해석 생성을 하지 않는다.
- 상품 가격은 신뢰할 수 있는 live source가 없으므로 표시하지 않는다.
- 질문 원문은 URL, share token, analytics에 넣지 않는다.

### Exclusions

- Coupang Product API, live price synchronization, personalization accounts
- Threads publishing, Threads analytics, Growth Engine
- Full authored corpus generation

### Rollback

Spread, interpretation v2, affiliate products는 기존 reducer/domain/share contracts 뒤의 독립 component/module로 둔다. 문제가 생기면 각 adapter를 이전 UI로 되돌릴 수 있으며 RWS asset/data migration은 없다.

## Outcome

방문자가 모바일에서 질문을 떠올리고 78장 중 세 장을 직접 골라, 끊김 없이 하나의 한국어 리딩을 보고 공유하거나 새 질문으로 다시 시작한다.

## Required behavior

1. 리더 소개에서 질문 입력 또는 질문 없이 진행한다.
2. 78장 덱을 Fisher-Yates로 섞고 카드 뒷면 78장을 탐색 가능한 겹침 레일로 펼친다.
3. 중복 없이 최대 세 장을 선택하고 선택 해제할 수 있다. 정확히 세 장일 때만 확정한다.
4. 선택 순서를 유지한 세 장을 한 장씩 공개하고 1-2초 호흡 후 제휴 인터스티셜을 거친다.
5. 인터스티셜은 항상 건너뛸 수 있고 비활성 또는 URL 누락 시 결과를 막지 않는다.
6. 정렬된 canonical key로 리딩을 찾고 선택 순서에 포지션 의미를 적용한다.
7. 리딩은 headline, 연결된 story, 실용적인 advice, closing을 제공한다.
8. 공유는 질문을 제외한 카드 순서만 담은 버전 토큰을 사용한다. Web Share API와 복사 fallback을 지원한다.
9. 새 질문은 페이지 reload 없이 모든 임시 상태를 초기화한다.
10. 분석 이벤트는 공급자 독립형 typed adapter를 통해 보낸다.
11. 전체 데이터가 없어도 카드 의미 기반 deterministic fallback으로 모든 76,076 조합을 읽을 수 있다.
12. 오프라인 생성 CLI는 200개 단위 샤드, atomic finalize, resume, range, lock, validate, retry, status를 지원한다.

## Acceptance criteria and evidence

| Criterion | Evidence |
| --- | --- |
| 카드 카탈로그가 정확히 78장 | domain unit test, `tarot:validate` |
| 조합이 정확히 76,076개이고 중복 0 | enumerator unit test, `tarot:validate` |
| 셔플이 78장 순열 | shuffle property tests |
| 세 장 최대, 선택 해제, 확정 조건 | reducer/component tests, browser flow |
| canonical key가 순서와 무관 | unit tests |
| 공개, 제휴 건너뛰기, 결과, 다시 보기 | browser acceptance flow |
| 질문이 공유 URL과 이벤트에 없음 | token/event tests, URL inspection |
| 공유 링크가 동일 카드 순서를 복원 | token roundtrip, share route test |
| reduced motion과 키보드 사용 가능 | browser manual QA |
| 생성 재개가 완료 배치를 건너뜀 | CLI integration tests |
| lint, types, tests, build 정상 | harness verification |

## Constraints

- 한국어 문구는 짧고 담백하며 확정적 예언을 피한다.
- 화면 모션은 transform/opacity 중심이다.
- 카드 앞면 자산은 선택된 세 장만 적극적으로 표시한다.
- 사용자 질문은 클라이언트 임시 메모리에만 둔다.
- 카드 아트는 오리지널 자산 또는 provenance가 확인된 자산만 쓴다.
- 쿠팡 제휴 문구는 운영자가 최종 정책 검토한다.

## Exclusions

`spec/mission.md`의 non-goals 전체와 76,076개 실제 외부 모델 생성 완료는 이번 제품 코드 완료 조건에서 제외한다. 생성 파이프라인과 평가 샘플은 포함한다.

## Rollback

제휴는 환경 변수 하나로 비활성화한다. 전체 corpus가 문제를 만들면 sample/fallback loader로 되돌린다. 공유 저장소나 DB는 없으므로 데이터 마이그레이션이 필요 없다.
