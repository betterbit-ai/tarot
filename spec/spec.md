# Executable Product Spec

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
