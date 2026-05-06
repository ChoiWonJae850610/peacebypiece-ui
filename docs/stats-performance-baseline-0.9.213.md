# 0.9.213 — 성능 측정 기준 문서화

## 목표

0.9.213은 통계 화면과 작업지시서 핵심 흐름의 성능 목표를 먼저 고정하는 버전이다.
이번 버전에서는 실제 측정 로그 저장소를 만들지 않고, 어떤 값을 어디서 측정할지 기준만 확정한다.

## 성능 목표

| 항목 | 목표 | 측정 위치 | 초과 시 우선 점검 |
|---|---:|---|---|
| 작업지시서 목록 로딩 | 1초 이하 | `/worker` 목록 초기 진입 및 필터 변경 | 목록 query 조건, hydrate 범위 |
| 작업지시서 상세 hydrate | 1.5초 이하 | 상세 진입 후 기본 정보/첨부/메모 안정 표시 시점 | 첨부/메모 hydrate, workspace 조립 순서 |
| 통계 overview 집계 | 500ms 이하 | `/admin/dashboard` 서버 snapshot 또는 향후 `/api/admin/stats/overview` | index, summary table 사용 여부 |
| 차트 렌더링 | 300ms 이하 | Recharts 차트가 데이터 수신 후 그려지는 시점 | TOP N 축약, legend layout, client component 범위 |
| API 에러율 | 1% 미만 | 관리자/시스템 관리자 주요 API | route, action, company, 최근 배포 버전 |
| R2 upload/purge 실패율 | 0.5% 미만 | Worker 기반 upload/download/purge | Worker 응답, key 생성, purge retry 상태 |

## 측정 원칙

1. UI에 raw data를 많이 넘긴 뒤 프론트에서 계산하지 않는다.
2. 통계 차트에는 서버에서 축약된 데이터를 전달한다.
3. R2 용량/삭제 상태는 R2 listObjects 직접 조회가 아니라 DB metadata 기준으로 집계한다.
4. API route가 분리되기 전까지 TanStack Query는 도입하지 않는다.
5. 성능 문제가 반복 확인된 지표만 summary table 또는 추가 index를 검토한다.
6. 측정 기준과 실제 운영 로그 저장은 분리한다.

## 기록 방식

초기 개발 단계에서는 다음 순서로 확인한다.

1. Chrome DevTools Network
2. 서버 로그 또는 console time
3. `npm run build`와 route별 렌더링 오류 확인
4. 추후 `system_error_logs` 또는 `operation_logs` 기반 저장

운영 단계에서는 아래 필드를 기록할 수 있어야 한다.

- route
- action
- company_id
- period
- duration_ms
- error_code
- version
- created_at

## 이번 버전 변경 범위

- `lib/admin/stats/performancePolicy.ts` 추가
- `lib/admin/stats/index.ts` export 추가
- `/admin/dashboard`에 성능 측정 기준 카드 추가
- `APP_VERSION` 0.9.213 반영

## SQL DDL 필요 여부

불필요.

이번 버전은 측정 기준 문서화와 UI 안내만 포함한다.
테이블, 컬럼, index, materialized view를 추가하지 않는다.

## 전체 리셋 필요 여부

불필요.

## package 변경 여부

불필요.

## 테스트 케이스

1. `APP_VERSION`이 0.9.213인지 확인한다.
2. `/admin/dashboard`에 성능 측정 기준 섹션이 표시되는지 확인한다.
3. 작업지시서 목록, 상세 hydrate, 통계 overview, 차트 렌더링, API 에러율, R2 실패율 목표가 표시되는지 확인한다.
4. `package.json`과 `package-lock.json`이 변경되지 않았는지 확인한다.
5. DB schema와 reset SQL이 변경되지 않았는지 확인한다.
6. `npm run build`를 실행한다.

## 다음 버전 기준

0.9.214에서는 summary table/materialized view를 바로 만들지 않고, 현재 집계 구조에서 어떤 지표가 느려질 가능성이 있는지 후보를 정리한다.
