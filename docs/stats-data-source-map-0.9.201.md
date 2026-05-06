# PeaceByPiece 통계 데이터 소스 매핑

- 기준 버전: 0.9.201
- 이전 기준 문서: `docs/stats-indicator-plan-0.9.200.md`
- 목적: 0.9.200에서 정의한 통계 지표를 현재 DB 기준으로 계산 가능/부분 가능/불가능으로 분류하고, 이후 API/DDL 작업의 기준을 고정한다.
- 비목표: 실제 통계 API 구현, 차트 UI 구현, DB schema 변경, index 추가, Recharts/TanStack Query 도입

---

## 1. 판정 기준

### 1.1 가능

현재 DB table/column만으로 SQL aggregate가 가능하다.

### 1.2 부분 가능

현재 DB에 기본 source는 있으나 아래 중 하나가 부족하다.

- 날짜 타입 또는 완료일/검수일 같은 기준 필드가 불명확함
- 비용/수량 계산식이 제품 정책으로 확정되지 않음
- history/event table 없이는 기간별 상태 변화가 정확하지 않음
- file reference/copy 정책이 확정되지 않아 저장소 통계가 왜곡될 수 있음

### 1.3 불가능

현재 DB에 source table/column이 없거나, 별도 event/log/snapshot 구조가 필요하다.

---

## 2. 현재 확인한 주요 데이터 소스

| 영역 | table/view | 현재 활용 가능한 column | 비고 |
|---|---|---|---|
| 작업지시서 | `spec_sheets` | `company_id`, `status`, `work_order_kind`, `reorder_group_id`, `reorder_round`, `parent_spec_sheet_id`, `is_rework`, `category1_id`, `category2_id`, `category3_id`, `is_active`, `delete_status`, `purge_status`, `created_at`, `updated_at`, `deleted_at` | 상태/분류/리오더/삭제 통계의 기본 source |
| 발주/공장 | `orders` | `company_id`, `spec_sheet_id`, `factory_partner_id`, `factory_name`, `quantity`, `due_date`, `labor_cost`, `loss_cost`, `status`, `is_active`, `created_at`, `updated_at` | 공장별 수량/비용 통계 가능. `due_date`는 text라 날짜 계산 전 변환 정책 필요 |
| 원단/부자재 | `spec_sheet_materials` | `company_id`, `spec_sheet_id`, `material_type`, `name`, `vendor`, `quantity`, `unit`, `unit_cost`, `total_cost`, `status`, `is_active`, `created_at`, `updated_at` | 사용량/비용은 가능. 입고/재고 흐름은 별도 구조 필요 |
| 재고 | `material_stocks` | `company_id`, `available_quantity`, `reserved_quantity`, `material_type`, `name`, `vendor`, `quantity`, `unit_cost`, `total_cost`, `status`, `source_spec_sheet_id` | 재고 스냅샷성 통계는 가능. 입출고 이력 통계는 부족 |
| 외주공정 | `spec_sheet_outsourcing_lines` | `company_id`, `spec_sheet_id`, `process`, `vendor`, `quantity`, `unit`, `unit_cost`, `total_cost`, `status`, `is_active`, `created_at`, `updated_at` | 공정/외주처별 건수·비용 가능. 지연/불량은 부족 |
| 첨부/디자인 | `attachments` | `company_id`, `order_id`, `type`, `size_bytes`, `is_primary`, `thumbnail_key`, `is_active`, `deleted_at`, `purge_after_at`, `created_at`, `updated_at` | active 파일 용량/유형 가능. purge 결과는 trash table과 함께 계산 |
| 첨부 휴지통 | `attachment_trash_items` | `company_id`, `attachment_id`, `order_id`, `size_bytes`, `deleted_at`, `purge_after_at`, `restored_at`, `purged_at`, `purge_status`, `purge_attempt_count`, `last_purge_attempt_at`, `last_purge_error` | 휴지통/purge 통계의 핵심 source |
| 메모 | `memos` | `company_id`, `order_id`, `parent_id`, `is_active`, `delete_status`, `purge_status`, `purge_requested_at`, `purged_at`, `created_at`, `updated_at`, `deleted_at` | 메모 작성/삭제/복원 통계 가능. 본문 분석 통계는 제외 |
| 히스토리 | `history_logs` | `company_id`, `user_id`, `action_type`, `target_type`, `target_id`, `metadata`, `created_at` | 제한적 이벤트 통계 가능. action_type 범위가 좁음 |
| 관리자 통계 이벤트 | `admin_stats_events` | `company_id`, `spec_sheet_id`, `order_id`, `factory_partner_id`, `event_type`, `production_round`, `production_category`, `quantity`, `expected_quantity`, `received_quantity`, `due_date`, `inspected_at`, `is_defect`, `is_inbound_delayed`, `created_at` | 품질/지연 이벤트 통계 후보. 실제 write flow 연결 여부 확인 필요 |
| 요금제 | `plans`, `company_plan_assignments` | `code`, `name`, `included_storage_bytes`, `max_storage_bytes`, `system_stats_enabled`, `advanced_stats_enabled`, `company_id`, `status`, `starts_at`, `ends_at` | 요금제별 잠금/시스템 통계 노출 가능. 세부 feature flag는 부족 |
| 저장소 snapshot | `storage_usage_snapshots`, `latest_storage_usage_snapshots` | `company_id`, `used_bytes`, `attachment_count`, `source`, `measured_at` | 시스템 저장소 통계 가능. active/trash 세부는 attachments 기준 재계산 필요 |
| 기준정보 | `item_categories`, `partners`, `partner_items`, `outsourcing_processes`, `units` | `company_id`, `name`, `level`, `parent_id`, `item_type`, `unit_cost`, `is_active` | 분류/협력업체/단위 기준 join 가능 |

---

## 3. 고객관리자 통계 지표 매핑

### 3.1 Basic 플랜 지표

| 지표 | 판정 | source | 계산 기준 | 추가 필요 |
|---|---|---|---|---|
| 전체 작업지시서 수 | 가능 | `spec_sheets` | `company_id`, `is_active`, `delete_status` 기준 count | 없음 |
| 진행 중 작업지시서 수 | 가능 | `spec_sheets` | `status NOT IN 완료 상태` 또는 status policy 기준 | 상태 code 정책 확인 |
| 완료 작업지시서 수 | 부분 가능 | `spec_sheets` | `status` 기준 count | `completed_at` 없음. 완료일 기준 월별 완료는 부정확 |
| 상태별 작업지시서 수 | 가능 | `spec_sheets` | `company_id`, `status`, `is_active` group by | 상태 label mapping |
| 월별 생성 수 | 가능 | `spec_sheets.created_at` | `date_trunc('month', created_at)` | 없음 |
| 월별 완료 수 | 부분 가능 | `spec_sheets.status`, `updated_at` | 완료 status + `updated_at` 임시 대체 가능 | 정확한 `completed_at` 필요 |
| 최근 생성 작업지시서 | 가능 | `spec_sheets` | `created_at DESC LIMIT n` | 없음 |
| 최근 수정 작업지시서 | 가능 | `spec_sheets` | `updated_at DESC LIMIT n` | 없음 |
| 저장소 전체 용량 | 가능 | `attachments`, `attachment_trash_items`, `storage_usage_snapshots` | DB metadata 합계 또는 snapshot | 기준 통일 필요 |
| active/trash 용량 | 가능 | `attachments`, `attachment_trash_items` | active: `attachments.is_active=true`, trash: `attachment_trash_items.purge_status` | 참조 복사 정책 필요 |
| 파일 유형별 용량 | 가능 | `attachments.type`, `size_bytes` | `type` group by | type 값 표준화 확인 |

### 3.2 Standard/Growth 지표

| 지표 | 판정 | source | 계산 기준 | 추가 필요 |
|---|---|---|---|---|
| 1차 분류별 작업지시서 수 | 가능 | `spec_sheets`, `item_categories` | `category1_id` group by | 미분류 처리 |
| 2차 분류별 작업지시서 수 | 가능 | `spec_sheets`, `item_categories` | `category2_id` group by | 미분류 처리 |
| 3차 분류별 작업지시서 수 | 가능 | `spec_sheets`, `item_categories` | `category3_id` group by | 미분류 처리 |
| 3차 분류별 총 발주 수량 | 가능 | `spec_sheets`, `orders` | `spec_sheets.category3_id` + `sum(orders.quantity)` | inactive order 제외 기준 |
| 리오더 많은 3차 분류 TOP | 가능 | `spec_sheets` | `reorder_group_id`, `reorder_round > 0`, `category3_id` | 최초 생성 시 reorder_group 보장 필요 |
| 리오더율 | 가능 | `spec_sheets` | `reorder_round > 0` / 전체 active 작업지시서 | rework 포함/제외 정책 |
| 공장별 발주 건수 | 가능 | `orders`, `partners` | `factory_partner_id` group by | `factory_name` fallback |
| 공장별 총 발주 수량 | 가능 | `orders` | `sum(quantity)` | 없음 |
| 공장별 평균 공임 단가 | 가능 | `orders` | `avg(labor_cost)` | 0원/미입력 제외 정책 |
| 공장별 총 공임비 | 가능 | `orders` | `sum(quantity * labor_cost)` | integer overflow 주의 |
| 공장별 총 로스비 | 가능 | `orders` | `sum(loss_cost)` | loss_cost 단위 정책 |
| 공장별 총 비용 | 가능 | `orders` | `sum(quantity * labor_cost + loss_cost)` | 자재/외주 포함 여부 분리 |
| 월별 총 생산비 | 부분 가능 | `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines` | 공임+로스+자재+외주 합산 가능 | 월 기준일을 created/due/completed 중 확정 필요 |
| 분류별 평균 생산비 | 부분 가능 | `spec_sheets`, 비용 source tables | category join 후 평균 | 비용 합산 정책 필요 |

### 3.3 Premium 지표

| 지표 | 판정 | source | 계산 기준 | 추가 필요 |
|---|---|---|---|---|
| 공장별 납기 지연 건수 | 부분 가능 | `orders.due_date`, `admin_stats_events` | due_date와 완료/입고 이벤트 비교 | `due_date` date type화 또는 변환, 완료/입고일 필요 |
| 공장별 납기 지연율 | 부분 가능 | `orders`, `admin_stats_events` | 지연 건수 / 전체 발주 건수 | 실제 완료/입고 기준 필요 |
| 공장별 평균 지연일 | 불가능에 가까움 | `orders.due_date` | 지연일 계산 | `completed_at` 또는 `received_at` 필요 |
| 공장별 불량/에러 수량 | 부분 가능 | `admin_stats_events` | `event_type='DEFECT_REPORTED'` 또는 `is_defect=true` | 실제 write flow 연결 확인 |
| 공장별 불량률 | 부분 가능 | `admin_stats_events`, `orders` | defect quantity / order quantity | 검수 결과 저장 기준 필요 |
| 분류별 불량률 | 부분 가능 | `admin_stats_events`, `spec_sheets` | category join | defect event의 spec_sheet_id 보장 필요 |
| 상태별 평균 체류 시간 | 불가능 | `history_logs` | STATUS_CHANGED event sequence | `history_logs.action_type`에는 있으나 from/to status 표준 metadata 보장 필요 |
| 기간 비교 전월 대비 증감 | 가능/부분 가능 | 각 aggregate source | 같은 쿼리에서 period 비교 | 완료/비용/품질은 기준일 필요 |
| CSV/Excel export | 가능 | API aggregate 결과 | 서버 또는 클라이언트 export | 라이브러리/권한 정책 필요 |

### 3.4 원단/부자재/외주 지표

| 지표 | 판정 | source | 계산 기준 | 추가 필요 |
|---|---|---|---|---|
| 원단처별 사용 건수 | 가능 | `spec_sheet_materials` | `material_type`, `vendor` group by | fabric/subsidiary type 표준화 |
| 원단처별 총 사용 수량 | 가능 | `spec_sheet_materials` | `sum(quantity)` | unit 혼합 시 별도 group 필요 |
| 원단처별 총 비용 | 가능 | `spec_sheet_materials` | `sum(total_cost)` | total_cost 입력 신뢰도 |
| 자재명별 사용 빈도 | 가능 | `spec_sheet_materials.name` | name group by | 표기 흔들림 보정은 나중 |
| 자재 단가 변화 | 부분 가능 | `spec_sheet_materials` | `unit_cost` over time | 구매일/입고일 기준 필요 |
| 외주공정별 사용 건수 | 가능 | `spec_sheet_outsourcing_lines` | `process` group by | process 표준화 |
| 외주처별 발주 건수 | 가능 | `spec_sheet_outsourcing_lines.vendor` | vendor group by | partner id 연결 부족 |
| 외주공정별 총 비용 | 가능 | `spec_sheet_outsourcing_lines` | `sum(total_cost)` | 없음 |
| 외주공정별 지연 건수 | 불가능 | - | due/completed 정보 없음 | 외주 due/completed field 필요 |
| 외주공정별 불량률 | 불가능 | - | inspection result 없음 | 검수/불량 event 필요 |

---

## 4. 시스템관리자 통계 지표 매핑

| 지표 | 판정 | source | 계산 기준 | 추가 필요 |
|---|---|---|---|---|
| 전체 고객사 수 | 가능 | `companies` | count | 없음 |
| 활성 고객사 수 | 가능 | `companies.is_active` | active count | 없음 |
| 고객사별 작업지시서 수 | 가능 | `spec_sheets` | company group by | 없음 |
| 고객사별 월간 생성 수 | 가능 | `spec_sheets.created_at` | company + month group by | 없음 |
| 고객사별 최근 활동일 | 부분 가능 | `spec_sheets.updated_at`, `history_logs.created_at`, `company_users.last_active_at` | max date | 최종 기준 source 결정 필요 |
| 요금제별 고객사 수 | 가능 | `plans`, `company_plan_assignments` | active assignment group by plan | 없음 |
| 고객사별 저장 용량 사용률 | 가능 | `latest_storage_usage_snapshots`, `company_plan_assignments`, `plans` | used / limit | override 기준 정리 |
| 용량 초과 위험 고객 | 가능 | storage snapshot + plan limit | threshold 80% 등 | company_settings warning threshold 연결 가능 |
| 전체 R2 용량 | 가능/부분 가능 | `storage_usage_snapshots`, `attachments` | DB metadata 기준 합계 | R2 inventory 직접 조회 금지 유지 |
| purge 후보 수 | 가능 | `attachment_trash_items` | `purge_status='purge_requested'` 또는 retention 초과 | 후보 기준 확정 필요 |
| purge 성공/실패 수 | 가능 | `attachment_trash_items` | `purged_at`, `purge_status='failed'` | 없음 |
| purge 실패 사유 | 가능 | `attachment_trash_items.last_purge_error` | error text group by | error code 정규화는 추후 |
| PDF 출력 횟수 | 불가능 | - | event count | `operation_logs` 또는 `history_logs` action_type 확장 필요 |
| 리오더 생성 횟수 | 가능/부분 가능 | `spec_sheets`, `history_logs` | `reorder_round > 0` 또는 event | 생성 시점 정확도는 event 필요 |
| 첨부 업로드 횟수 | 가능 | `attachments.created_at` | month/company group by | 없음 |
| API 에러율 | 불가능 | - | request/error count | system error log 필요 |
| R2 upload/purge 실패율 | 부분 가능 | `attachment_trash_items` | purge 실패는 가능, upload 실패는 불가 | upload error log 필요 |
| 작업지시서 목록 로딩 시간 | 불가능 | - | duration metric | performance log 필요 |
| 상세 hydrate 시간 | 불가능 | - | duration metric | performance log 필요 |

---

## 5. 추가 schema 또는 정책이 필요한 항목

### 5.1 schema 추가 후보

| 후보 | 필요한 이유 | 우선순위 | 비고 |
|---|---|---:|---|
| `completed_at` on `spec_sheets` | 월별 완료 수, 평균 완료 소요일, 완료 기준 기간 비교 | 높음 | 상태 변경 action에서 기록 필요 |
| `completed_at` 또는 `received_at` on `orders` | 공장별 납기 지연일/지연율 | 높음 | `due_date`도 date/timestamptz 정리 권장 |
| 검수 결과 table 또는 event | 불량 수량/불량률/분류별 품질 통계 | 높음 | `admin_stats_events` 활용 가능 여부 먼저 확인 |
| `operation_logs` 또는 `system_error_logs` | API 에러율, R2 upload 실패율, 성능 통계 | 높음 | 시스템관리자 통계/운영 추적에 필요 |
| file reference/copy metadata | 리오더 파일 참조/실제 용량 분리 | 중간~높음 | `origin_attachment_id`, `is_reference_copy`, `physical_size_bytes`, `logical_size_bytes` 후보 |
| plan feature table | 요금제별 세부 통계 잠금 | 중간 | 현재 plans의 boolean은 coarse-grained |
| status transition log 표준화 | 상태별 평균 체류 시간 | 중간 | history_logs metadata 표준 필요 |

### 5.2 index 후보

이번 버전에서는 index를 추가하지 않는다. 다음 schema 버전에서 실제 API 쿼리 기준으로만 검토한다.

| 후보 index | 목적 | 적용 판단 |
|---|---|---|
| `spec_sheets(company_id, created_at)` | 월별 생성/최근 작업 | API 구현 시 필요 가능 |
| `spec_sheets(company_id, status, is_active)` | 상태별 count | API 구현 시 필요 가능 |
| `spec_sheets(company_id, category1_id/category2_id/category3_id)` | 분류별 count | 일부 존재. full_reset 기준 재확인 필요 |
| `orders(company_id, factory_partner_id, is_active)` | 공장별 aggregate | API 구현 시 필요 가능 |
| `orders(company_id, created_at)` | 월별 비용/수량 | API 구현 시 필요 가능 |
| `attachments(company_id, type, is_active)` | 유형별 용량 | API 구현 시 필요 가능 |
| `attachment_trash_items(company_id, purge_status, deleted_at)` | purge/휴지통 통계 | API 구현 시 필요 가능 |
| `history_logs(company_id, action_type, created_at)` | 활동/이벤트 통계 | API 구현 시 필요 가능 |

---

## 6. API 설계 전 확정해야 할 정책

1. 완료 기준
   - 완료 status만으로 볼지, `completed_at`을 추가할지 결정한다.

2. 기간 기준
   - 작업 생성일, 발주 생성일, 납기일, 완료일, 검수일을 지표별로 분리한다.

3. 비용 기준
   - 공장 비용: `orders.quantity * orders.labor_cost + orders.loss_cost`
   - 전체 생산비: 공장 비용 + 자재 비용 + 외주 비용
   - 장당 평균: 총 비용 / 총 발주 수량

4. 리오더 기준
   - `reorder_round > 0`을 기본 리오더로 본다.
   - `is_rework`는 재작업으로 별도 분리한다.

5. 저장소 기준
   - R2 listObjects를 통계 화면에서 직접 조회하지 않는다.
   - active/trash/purge 상태는 DB metadata 기준으로 집계한다.
   - 리오더 파일은 전체 복사보다 참조 복사 + 변경 시 분기를 우선 검토한다.

6. 요금제 잠금 기준
   - UI 잠금만으로 처리하지 않는다.
   - 통계 API에서도 company plan/feature gate를 확인해야 한다.

---

## 7. 다음 버전 작업 기준

### 0.9.202 — 통계 API/DTO 설계

- 고객관리자 overview/workorders/categories/factories/storage DTO 설계
- 시스템관리자 companies/storage/purge/errors DTO 설계
- 기간 필터 request shape 정의
- feature gate response shape 정의
- 불가능/부분 가능 지표는 `disabledReason` 또는 `requiresSchema`로 표현

### 0.9.203 — 통계용 schema/index 1차 설계 및 반영

- `completed_at`, order completion/received 기준, error/operation log, feature flag table 중 실제 우선순위 확정
- DB schema 변경 허용 버전으로 진행
- full_reset.sql / smoke test 반영 필요 여부를 별도 판단

---

## 8. SQL DDL 필요 여부

불필요.

이번 버전은 현재 DB 기준의 통계 가능/불가능 매핑 문서화만 수행한다. 테이블/컬럼/index를 추가하지 않는다.

---

## 9. 전체 리셋 필요 여부

불필요.

DB schema를 변경하지 않으므로 `full_reset.sql` 실행이나 전체 테이블 리셋이 필요하지 않다.

---

## 10. 테스트 케이스

1. `lib/constants/app.ts`의 `APP_VERSION`이 `0.9.201`인지 확인한다.
2. `docs/stats-data-source-map-0.9.201.md`가 존재하는지 확인한다.
3. 문서에 고객관리자 Basic/Standard/Premium 지표의 가능/부분 가능/불가능 판정이 포함되어 있는지 확인한다.
4. 문서에 시스템관리자 통계 지표의 source table과 추가 필요 항목이 포함되어 있는지 확인한다.
5. 문서에 SQL DDL 필요 여부가 `불필요`로 명시되어 있는지 확인한다.
6. 문서에 전체 리셋 필요 여부가 `불필요`로 명시되어 있는지 확인한다.
7. `commit-meta.md`의 Version과 `APP_VERSION`이 모두 `0.9.201`인지 확인한다.

---

## 11. build 영향

문서 추가와 `APP_VERSION` 문자열 변경만 포함한다. 런타임 로직, API, DB schema, package 의존성은 변경하지 않는다.
