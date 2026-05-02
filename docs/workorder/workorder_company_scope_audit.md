# 작업지시서 company_id scope 점검

Version: 0.9.88

## 목적

SaaS형 테넌트 구조에서 작업지시서 관련 업무 데이터가 고객사 단위로 분리될 수 있는지 점검한다.

이번 버전은 실제 repository 동작을 대규모로 변경하지 않고, company scope 기준과 점검 목록을 먼저 고정한다.

## 기준 company

현재 개발/샘플 기준 company는 다음 상수를 사용한다.

- `WORKSPACE_COMPANY_ID`
- 기본값: `company-sample-customer`

## 점검 대상 테이블

- `spec_sheets`
- `orders`
- `attachments`
- `memos`
- `partners`
- `partner_items`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`
- `material_stocks`
- `material_orders`
- `material_order_lines`
- `material_allocations`

## 현재 판단

### 이미 scope가 들어간 영역

`dbWorkOrderRepository`의 `spec_sheets` 조회/생성/수정은 `company_id` 컬럼이 있으면 현재 workspace company scope를 사용한다.

### 추가 점검이 필요한 영역

아래 영역은 multi-company 전환 전에 읽기/쓰기 모두 company_id 기준을 확실히 확인해야 한다.

- 첨부파일 조회/다운로드/삭제
- 메모 snapshot 저장/조회
- 거래처/공장/외주처 기준정보
- 발주/생산구성 sync
- 재고/원부자재 발주/할당

## 이번 패치 내용

- `lib/workorder/scope/workOrderCompanyScope.ts` 추가
- company scoped table 목록 정의
- company scoped where helper 추가
- 현재 scope 상태를 문서화

## 제외

- 기존 repository query를 직접 변경하지 않는다.
- 기존 작업지시서 저장/첨부/메모/거래처 동작을 건드리지 않는다.
- DB schema 변경 없음.
- 인증/실제 tenant 선택 연결 없음.

## 다음 작업

0.9.89에서 storage usage DB 집계 연결 1차를 진행한다.

권장 범위:
- attachment metadata 기준 company별 사용량 계산
- `storage_usage_snapshots` 생성
- `/api/system/storage-usage`가 실제 DB snapshot을 읽도록 준비
