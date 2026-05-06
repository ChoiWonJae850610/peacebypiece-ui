# 0.9.211 — R2 purge/저장소 통계 안정화

## 목적

시스템 관리자 통계와 스토리지 실제 삭제 화면에서 R2 purge 상태를 같은 기준으로 읽을 수 있도록 1차 표시 기준을 정리한다.

이번 버전은 실제 R2 삭제 방식이나 Worker API를 변경하지 않는다. 기존 Worker 기반 삭제 흐름은 유지하고, 화면과 summary에서 상태 구분을 명확히 한다.

## 상태 기준

| 상태 | 의미 | 표시 위치 |
|---|---|---|
| `purge_requested` | 사용자가 휴지통에서 명시적으로 영구삭제를 요청한 항목 | 시스템 통계, 스토리지 purge 화면 |
| `pending` | 보존기간이 도래했거나 삭제 실행 전 대기 중인 항목 | 시스템 통계, 스토리지 purge 화면 |
| `purged` | Worker 기반 삭제 후 DB에 `purged_at`이 기록된 항목 | 시스템 통계 기준 |
| `failed` | R2 삭제 실패 또는 `last_purge_error`가 남은 항목 | 시스템 통계, 스토리지 purge 화면 |

## 반영 내용

- `/system` 통계 상황판에 R2 purge 상태 요약을 추가했다.
- `/system` 통계 상황판에 저장소 용량 구분 기준을 추가했다.
- `/system/storage-usage` summary 카드에서 영구삭제 요청, 삭제 대기, 삭제 실패 수를 분리했다.
- 스토리지 후보 summary type에 `requestedCount`, `pendingCount`, `failedCount`, `retryRequiredCount`를 추가했다.
- 기존 selected purge query 안의 중복 `purge_due_at` alias를 제거했다.

## 저장소 용량 구분 기준

| 구분 | 기준 |
|---|---|
| 사용중 파일 | 현재 작업지시서에서 참조되는 active attachment 기준 |
| 휴지통 파일 | 복원 가능 기간에 있어 R2에서 보존 중인 trash item 기준 |
| 영구삭제 완료 | R2 삭제 완료 후 `purged_at`이 기록된 누적 항목 기준 |

이번 버전의 시스템 통계 숫자는 운영 UI 기준을 고정하기 위한 sample 값이다. 실제 고객사별 DB 집계 API는 후속 버전에서 연결한다.

## SQL DDL 필요 여부

불필요.

테이블, 컬럼, index, constraint를 변경하지 않는다.

## 전체 리셋 필요 여부

불필요.

0.9.2071 seed 데이터는 그대로 사용할 수 있다.

## R2 처리 정책

- R2 `listObjects` 직접 조회 금지 유지
- 실제 삭제는 기존 Worker 기반 delete flow 유지
- UI에서 삭제 완료로 단정하지 않고 결과 응답 기준으로 성공/실패를 분리
- 실패 항목은 `last_purge_error`를 표시하고 재시도 대상으로 유지

## 테스트 케이스

1. `/system` 접속
   - R2 purge 상태 카드가 표시되는지 확인한다.
   - 영구삭제 요청 / 삭제 대기 / 삭제 완료 / 삭제 실패가 분리되어 보이는지 확인한다.
   - 저장소 용량 구분 카드가 표시되는지 확인한다.

2. `/system/storage-usage` 접속
   - 삭제 후보 카드에 영구삭제 요청/대기 수가 함께 표시되는지 확인한다.
   - 삭제 실패 카드가 별도 표시되는지 확인한다.
   - 원본 용량 카드가 고객사 수와 함께 표시되는지 확인한다.

3. purge 후보 없음 상태
   - 후보 목록이 비어도 summary 카드가 깨지지 않는지 확인한다.

4. build 확인
   - `npm run build`

## 후속 작업

0.9.212에서 TanStack Query 또는 통계 API 캐싱을 검토하기 전, 시스템 통계 API가 실제 DB 집계값을 반환할지 여부를 결정한다.
