# 작업지시서 payload 호환 코드 제거 — 0.10.94

## 목적

0.10.93에서 `spec_sheets.payload`와 보조 테이블의 `payload` 컬럼을 `full_reset.sql` 기준으로 제거했다. 이번 0.10.94는 repository 내부에 남아 있던 payload 호환/파싱/쓰기 코드를 제거해 작업지시서 저장·조회 흐름이 정규 컬럼과 정규 하위 테이블만 사용하도록 맞춘다.

## 변경 범위

- `lib/workorder/repository/dbWorkOrderRepository.ts`
  - payload 컬럼 후보 탐색 제거
  - payload column kind 검사 제거
  - payload JSON parse fallback 제거
  - payload INSERT/UPDATE 제거
  - payload patch update 제거
  - summary 조회의 payload key 재구성 제거
  - row → WorkOrder/WorkOrderSummary mapping을 정규 컬럼 기준으로 단순화
- `lib/repositories/dbWorkorderHttpAdapter.ts`
  - payload column type 전용 오류 분기 제거

## 정규화 기준

작업지시서 header/meta/status는 `spec_sheets` 정규 컬럼에서 읽는다.

상세 데이터는 다음 테이블에서 조립한다.

- `orders` → `orderEntries`
- `spec_sheet_materials` → `materials`
- `spec_sheet_outsourcing_lines` → `outsourcing`
- `attachments` → 디자인/문서 첨부
- `memos` → 메모 thread

## 확인 기준

1. `grep -R "payload" lib/workorder/repository/dbWorkOrderRepository.ts` 결과가 없어야 한다.
2. 작업지시서 목록이 정상 표시되어야 한다.
3. 작업지시서 상세 진입 시 발주정보/생산구성/외주공정이 정규 테이블 기준으로 표시되어야 한다.
4. 작업지시서 저장 후 `spec_sheets`에는 payload 없이 정규 컬럼만 갱신되어야 한다.

## 주의

이번 작업은 기존 DB에 남아 있는 payload 데이터를 마이그레이션하지 않는다. 개발 중 reset 가능한 상태이므로 0.10.93 이후 schema는 `full_reset.sql` 기준으로 다시 구성하는 것을 전제로 한다.
