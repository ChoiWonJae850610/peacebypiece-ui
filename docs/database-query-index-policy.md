# Database Query and Index Policy

기준 버전: 0.16.15
기준 원본: 0.16.14
범위: 조인, 인덱스, denormalization, summary table 기준

## 1. 목적

조인을 줄이기 위해 표시값을 무분별하게 복사 저장하면 DB는 빠르게 지저분해진다. WAFLOW / PeaceByPiece는 현재 개발 단계에서 데이터 규모보다 구조 명확성이 더 중요하다.

따라서 이 문서는 “중복 컬럼으로 조인을 피하는 방식”보다 “FK + company scope + 인덱스 + 명확한 repository query”를 우선한다는 기준을 고정한다.

## 2. 기본 원칙

```txt
- 모든 workspace query는 company_id scope를 먼저 가진다.
- 작업지시서 상세/목록은 company_id + spec_sheet_id 기준을 우선한다.
- partner/member/category 같은 기준정보 표시는 FK + join을 우선한다.
- 표시명 중복 저장은 snapshot 목적이 있을 때만 허용한다.
- 성능 이슈가 확인되기 전 denormalized field를 추가하지 않는다.
- 실제 병목은 query plan과 빈도 기준으로 판단한다.
```

## 3. 주요 조인 key

| 도메인 | 우선 key | 설명 |
| --- | --- | --- |
| 회사 scope | company_id | workspace 데이터 격리의 최상위 기준 |
| 작업지시서 | company_id + spec_sheet_id | 상세, 생산구성, 첨부, 메모, 통계의 기본 기준 |
| 첨부 | company_id + order_id | 현재 order_id는 spec_sheets.id를 참조하는 작업지시서 FK로 사용 |
| 메모 | company_id + order_id | 작업지시서별 memo thread 기준 |
| 협력업체 | company_id + partner_id | 같은 회사 범위 안에서만 조인 |
| 협력업체 품목 | company_id + partner_id + item_type | 원단/부자재/공장/외주 구분 기준 |
| 멤버 | company_id + user_id 또는 company_member_id | 표시명/권한/승인 상태 기준 |
| 권한 | company_member_id + permission_code | role 이름보다 실제 permission 기준 |
| 삭제/purge | company_id + delete_status/purge_status + deleted_at/purge_after_at | 휴지통/시스템 purge 후보 조회 기준 |

## 4. 인덱스 우선 후보

새로운 중복 컬럼을 추가하기 전에 아래 인덱스 후보를 먼저 검토한다.

```txt
spec_sheets:
- (company_id, created_at DESC)
- (company_id, status, created_at DESC)
- (company_id, reorder_group_id, reorder_round, created_at DESC)
- (company_id, delete_status, deleted_at DESC)
- 필요 시 (company_id, manager_id, created_at DESC)

orders:
- (company_id, spec_sheet_id)
- (company_id, factory_partner_id)
- 필요 시 (company_id, status)

spec_sheet_materials:
- (company_id, spec_sheet_id)
- (company_id, vendor_partner_id)
- (company_id, source_material_id)

spec_sheet_outsourcing_lines:
- (company_id, spec_sheet_id)
- (company_id, vendor_partner_id)
- (company_id, source_outsourcing_id)

attachments:
- (company_id, order_id)
- (order_id, type, is_active, created_at)
- (company_id, type, created_at DESC) where deleted_at is null
- (company_id, deleted_at, type)

memos:
- (company_id, order_id)
- (order_id, is_active, created_at)
- (delete_status, deleted_at DESC)

partners:
- (company_id, id)
- (company_id, name)
- (company_id, partner_type) 또는 실제 type 컬럼 기준

partner_items:
- (company_id, partner_id, item_type)
```

실제 full_reset.sql에는 이미 다수 인덱스가 존재한다. 후속 정리에서는 “없는 인덱스를 추가”하기보다 “현재 query와 맞지 않는 인덱스가 있는지”를 우선 본다.

## 5. 조인 회피용 필드 추가 금지 기준

아래 이유만으로는 컬럼을 추가하지 않는다.

```txt
- 화면에서 이름 하나 보여주려고 회사명/업체명을 복사 저장
- 한 번의 join을 줄이기 위해 category label 복사 저장
- 목록 count를 빠르게 보여주려고 수량 count를 원본 row와 별개로 계속 저장
- status label을 빠르게 보여주려고 한국어 문구 저장
- 개발 중 임시로 쓰기 위해 raw payload/json 저장
```

대신 다음 방식으로 처리한다.

```txt
- 표시명: FK + join + presentation
- count: query aggregation 또는 summary table
- status label: status code + i18n/presentation
- 화면 임시값: client state 또는 typed draft
- 통계: summary table 또는 materialized view 후보
```

## 6. summary/cache table 허용 기준

summary table은 denormalization이지만 무조건 금지하지 않는다. 아래 조건을 만족해야 한다.

```txt
- 원본 테이블이 명확하다.
- 재계산 방법이 문서화되어 있다.
- stale 허용 범위가 정해져 있다.
- 사용자 입력 원본으로 쓰지 않는다.
- 권한 판단의 원본으로 쓰지 않는다.
- source/version/measured_at이 있다.
```

허용 후보:

```txt
company_workorder_daily_stats
company_workorder_monthly_stats
company_storage_daily_stats
storage_usage_snapshots
```

주의:

```txt
summary table은 화면 속도용 보조값이다.
업무의 원본 상태는 spec_sheets, attachments, memos, orders 등 원본 테이블에서 판단한다.
```

## 7. repository query 작성 기준

```txt
- API route에서 직접 SQL을 길게 작성하지 않는다.
- app/api → service → repository 흐름을 유지한다.
- repository 함수명은 query 목적이 드러나야 한다.
- company_id scope가 필요한 query는 함수 인자에 companyId를 명시한다.
- companyId fallback, demo company fallback, mock data fallback을 두지 않는다.
- 데이터 없음은 empty state로 처리한다.
```

함수명 예:

```txt
listWorkordersByCompany
getWorkorderDetailByCompany
listWorkorderAttachmentsByCompany
listWorkorderMemosByCompany
listMaterialsByCompany
listPartnersByCompany
```

## 8. query 변경 전 확인 순서

```txt
1. 화면/API가 실제로 어떤 필터와 정렬을 쓰는지 확인
2. repository query의 where/order by 확인
3. full_reset.sql 기존 인덱스와 맞는지 확인
4. 중복 컬럼으로 해결하려는 값이 FK 조인으로 가능한지 확인
5. snapshot이 필요한 값인지 확인
6. 그래도 병목이면 summary/cache table을 검토
```

0.16.15 이후 DB 정리는 이 순서로만 진행한다.
