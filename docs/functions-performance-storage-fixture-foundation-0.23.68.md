# Functions performance · storage fixture foundation 0.23.68

## 범위

- 테스트 회사 A~J의 empty/small/medium/large/edge 대량 fixture를 유지한다.
- 회사별 저장용량을 0%, 5%, 15%, 30%, 50%, 70%, 90%, 99%, 100%, 110%로 분리한다.
- 110%는 UI 표시 시 100%로 clamp해야 하는 오류 경계값이다.
- 회사별 R2 test prefix를 고정하여 tenant 간 합산이 섞이지 않도록 한다.
- fixture 처리 성능 p50/p95 JSON 보고서 형식을 추가한다.

## 명령

- `npm run test:data:functions`
- `npm run test:data:functions:seed`
- `npm run test:data:functions:seed:execute`
- `npm run test:data:functions:cleanup`
- `npm run test:data:functions:cleanup:execute`
- `npm run test:functions:performance`
- `npm run test:functions:storage`
- `npm run test:functions:storage:reconcile`

## 실행 안전성

실제 seed/cleanup 명령은 다음을 모두 만족해야 한다.

1. runtime이 development/dev/local/test/demo 중 하나다.
2. prefix가 `wafl-fn`과 정확히 일치한다.
3. `WAFL_FUNCTIONS_DATA_CONFIRM=<command>:wafl-fn` 확인값이 있다.
4. production runtime은 항상 차단한다.
5. 현재 버전은 실제 schema mapping이 확정되지 않아 execute 단계에서 mutation 직전에 중단한다.

따라서 이번 버전은 실제 실행 구조와 이중 안전장치까지 제공하지만 DB/R2 데이터는 변경하지 않는다.

## 성능 결과 해석

`reports/functions-performance-latest.json`은 브라우저와 API 실측이 아니라 fixture 생성·검색·정렬의 로컬 기준선이다. 실제 화면 진입 시간, API 응답 시간, DOM row 수, 스크롤 응답은 dev/test 환경에서 별도 측정해야 한다.

## 저장용량 검증

- quotaBytes와 usedBytes 비율
- 0~100% 표시
- 100% 초과 clamp
- 회사별 objectPrefix 고유성
- B/KB/MB/GB 변환과 반올림
- 업로드·삭제 이후 DB 집계와 R2 실제 합계 reconciliation
- 회사 A 변경 시 회사 B 불변

## DB Migration

없음. 기존 저장용량 repository가 메모리 skeleton이므로 실제 DB 컬럼·테이블 구조 확인 전 migration을 생성하지 않는다.
