# 작업지시서 정규화 상세 저장 보정 — 0.10.96

## 목적

0.10.93~0.10.94에서 `spec_sheets.payload`와 하위 테이블의 payload 컬럼을 full reset 기준으로 제거했다. 이번 버전은 하위 정규 테이블 동기화 코드에 남아 있던 payload 호환 분기와 반복 schema 조회 비용을 정리한다.

## 변경 내용

- `spec_sheet_materials` 동기화에서 `payload`/`data` 컬럼 후보 탐색 제거
- `spec_sheet_outsourcing_lines` 동기화에서 `payload`/`data` 컬럼 후보 탐색 제거
- material/outsourcing 저장 시 JSON payload를 더 이상 INSERT/UPDATE하지 않음
- `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines` schema 조회를 module-level Promise cache로 보정
- schema 조회 실패 시 cache를 비우고 다음 호출에서 재시도 가능하게 처리

## 기대 효과

- payload 제거 이후에도 하위 테이블 저장 코드가 이전 schema 호환 분기를 끌고 가지 않음
- 작업지시서 저장/상태 변경 시 반복되는 `information_schema.columns` 조회가 줄어듦
- 정규 테이블 기준 저장 흐름이 더 명확해짐

## 확인 기준

```bash
git grep -n "payloadColumn\|PAYLOAD_COLUMN_CANDIDATES" -- lib/workorder/repository
```

정상 기준:

```text
출력 없음
```

`resolveActiveFactoryPartnerByIdOrName(payload: ...)` 같은 일반 함수 인자명은 DB payload와 무관하다.

## 주의

0.10.93 이후 full reset을 아직 실행하지 않았다면 기존 DB와 schema mismatch가 날 수 있다. 개발 DB는 아래 순서로 reset 후 확인하는 것이 안전하다.

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
psql $env:DATABASE_URL -f db/seed/realistic_workorders_seed.sql
```
