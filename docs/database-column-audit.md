# Database Column Audit

기준 버전: 0.16.48
기준 원본: 0.16.47
범위: full_reset.sql 기준 컬럼 역할 점검
상태: 분석 기준 문서. 이 버전에서는 schema를 변경하지 않는다.

## 1. 감사 목적

컬럼을 다음 네 종류로 나눈다.

```txt
A. 유지: 현재 업무 로직, scope, 권한, 조회, 통계에 필요한 컬럼
B. snapshot 후보: 당시 값 보존 목적이면 유지 가능하나 이름/목적 명확화 필요
C. 조인 회피용 중복 후보: FK + index + join으로 대체 가능할 수 있는 컬럼
D. 삭제/정리 후보: 현재 사용처가 불분명하거나 legacy compatibility 성격인 컬럼
```

0.16.15에서는 실제 삭제를 하지 않는다. 후속 버전에서 repository/API/UI 사용처를 확인한 뒤 작은 단위로 full_reset.sql과 mapper를 함께 정리한다.

## 2. 우선 점검 대상 컬럼

### 2.1 company_name 계열

확인 대상:

```txt
spec_sheets.company_name
material_stocks.company_name
attachments.company_name
memos.company_name
```

판단:

```txt
- company_id가 이미 있으므로 최신 회사명 표시는 companies 조인으로 가능하다.
- 회사명 변경 전 당시 표시 보존 목적이면 snapshot 컬럼으로 명확히 이름을 바꾸는 것이 낫다.
- 현재 조회 성능 때문에 복사한 값이면 우선 company_id 인덱스/조인으로 대체 가능 여부를 확인한다.
```

권장:

```txt
- 현재 조회용이면 삭제 후보.
- 당시 문서/이력 보존용이면 company_name_snapshot 같은 명확한 이름 후보.
- 0.16.15에서는 삭제하지 않는다.
```

### 2.2 category text 계열

확인 대상:

```txt
spec_sheets.category1_id
spec_sheets.category2_id
spec_sheets.category3_id
spec_sheets.category1
spec_sheets.category2
spec_sheets.category3
```

판단:

```txt
- category*_id가 원본 분류 기준이면 category* text는 조인 회피용 중복일 가능성이 있다.
- 다만 과거 작업지시서의 당시 분류명을 보존해야 하면 snapshot으로 유지할 수 있다.
- 통계/검색은 category*_id 기준이 더 안정적이다.
```

권장:

```txt
- 통계/검색/필터는 category*_id 기준으로 고정.
- category* text는 표시 snapshot인지 legacy 표시값인지 확인 후 정리.
```

### 2.3 manager / manager_id 계열

확인 대상:

```txt
spec_sheets.manager
spec_sheets.manager_id
```

판단:

```txt
- manager_id가 사용자/멤버 FK 역할을 한다면 최신 담당자명은 users/company_members 조인으로 표시 가능하다.
- manager는 당시 담당자명 snapshot일 수 있다.
- 담당자 이름 변경 시 과거 작업지시서 표시가 바뀌어도 되는지 정책 결정이 필요하다.
```

권장:

```txt
- 업무 배정/권한/scope는 manager_id 기준.
- 화면 표시명은 조인 기준.
- 당시 표시 보존이 필요하면 manager_name_snapshot으로 명확화 후보.
```

### 2.4 vendor / factory_name 계열

확인 대상:

```txt
orders.factory_partner_id
orders.factory_name
spec_sheet_materials.vendor_partner_id
spec_sheet_materials.vendor
spec_sheet_outsourcing_lines.vendor_partner_id
spec_sheet_outsourcing_lines.vendor
```

판단:

```txt
- partner_id가 있으면 최신 업체명은 partners 조인으로 표시 가능하다.
- 발주서/PDF/과거 이력에서 당시 업체명 보존이 필요하면 snapshot 허용.
- 수기 입력 거래처를 허용할 경우 vendor text는 단순 중복이 아니라 free-text input일 수 있다.
```

권장:

```txt
- partner_id 기반 선택값과 수기 입력값을 구분한다.
- vendor/factory_name은 현재 조회용 중복인지 당시 표시 snapshot인지 문서화한다.
- 발주서/PDF 생성 시점의 업체명은 별도 generated document snapshot 쪽으로 분리하는 방향을 우선 검토한다.
```

### 2.5 source_* 컬럼

확인 대상:

```txt
orders.source_order_entry_id
spec_sheet_materials.source_material_id
spec_sheet_outsourcing_lines.source_outsourcing_id
material_stocks.source_order_line_id
material_stocks.source_spec_sheet_id
material_stocks.source_spec_sheet_material_id
```

판단:

```txt
- source_*는 UI draft row, 외부 입력 row, 이전 테이블 row와의 연결용일 수 있다.
- 실제 repository에서 join key로 쓰지 않으면 legacy 후보가 된다.
- idempotent replace 저장이나 migration 연결에 필요할 수 있으므로 바로 삭제하지 않는다.
```

권장:

```txt
- 사용처 검색 후 유지/삭제 판단.
- 실제 FK 성격이면 FK로 명확히 한다.
- 단순 legacy 연결값이면 제거 후보.
```

### 2.6 status 계열

확인 대상:

```txt
spec_sheets.status
spec_sheets.inventory_status
orders.status
spec_sheet_materials.status
spec_sheet_outsourcing_lines.status
material_stocks.status
material_orders.status
company_members.status
join_requests.status
```

판단:

```txt
- status는 payload로 보내지 않고 컬럼으로 유지하는 방향이 맞다.
- 다만 status 의미가 실제 workflow에 연결되지 않으면 unused 후보가 된다.
- text + check constraint와 TypeScript union이 어긋나지 않아야 한다.
```

권장:

```txt
- status 값은 lib/*/constants 또는 domain type으로 중앙화.
- 화면 label은 i18n/presentation에서 변환.
- 실제 workflow에 쓰지 않는 status는 제거 또는 의미 재정의 후보.
```

### 2.7 delete/purge metadata

확인 대상:

```txt
spec_sheets.delete_status
spec_sheets.purge_status
spec_sheets.delete_source
spec_sheets.delete_scope
spec_sheets.delete_parent_type
spec_sheets.delete_parent_id
spec_sheets.delete_batch_id
attachments.delete_source
attachments.delete_scope
attachments.delete_parent_type
attachments.delete_parent_id
attachments.delete_batch_id
memos.delete_status
memos.purge_status
memos.delete_source
memos.delete_scope
memos.delete_parent_type
memos.delete_parent_id
memos.delete_batch_id
```

판단:

```txt
- 휴지통/복원/purge 흐름에 직접 연결된 구조화 컬럼이므로 payload보다 낫다.
- 단, 동일한 의미가 spec_sheets/attachments/memos에 중복 존재하므로 공통 policy 문서와 mapper가 필요하다.
```

권장:

```txt
- 이번 구조 정리 중 직접 변경 금지.
- 동작 안정화 후 delete lifecycle 공통 타입/상수로 묶는다.
```

### 2.8 metadata / request_payload

확인 대상:

```txt
audit_logs.metadata
history_logs.metadata
company_account_requests.request_payload
```

판단:

```txt
- audit/history metadata는 보조 정보로 허용 가능.
- company_account_requests.request_payload는 raw request dump로 쓰이면 위험하다.
- 승인/거절/요청 유형별로 검색·감사·권한에 쓰는 값은 컬럼화가 필요하다.
```

권장:

```txt
- request_payload에 들어가는 key 목록을 typed detail로 제한.
- 통계/검색/권한/상태에 쓰는 값은 request_payload에서 꺼내 컬럼화.
```

## 3. 테이블별 정리 후보

| 테이블 | 점검 후보 | 1차 판단 |
| --- | --- | --- |
| companies | memo, rejection_reason, rejected_by_name, requested_plan_code, default_plan_id, storage_limit_bytes, member_limit | 운영/과금 정책과 연결되므로 즉시 삭제 금지. plan assignment와 중복 여부 별도 점검. |
| users | role | company_members/role_template과 중복 가능성. 로그인 기본 role인지 workspace role인지 경계 확인 필요. |
| company_users | role, display_name | users/company_members와 역할이 겹칠 수 있음. 멤버 관리 통합 후 정리 후보. |
| company_members | role_template_code, display_name | 신규 멤버 관리 기준. 유지 후보. company_users와 중복성 점검. |
| spec_sheets | company_name, category1/2/3, manager, vendor, display_title/base_title | snapshot인지 current display cache인지 구분 필요. |
| orders | factory_name | partner join 전환 후 snapshot 여부 결정. |
| spec_sheet_materials | vendor, status | partner id/free text/snapshot 여부와 status 사용처 확인. |
| spec_sheet_outsourcing_lines | vendor, status | partner id/free text/snapshot 여부와 status 사용처 확인. |
| material_stocks | company_name, source_* | 재고 출처 추적용인지 legacy인지 사용처 확인. |
| attachments | company_name, thumbnail_url, preview_url | R2 key/proxy 정책과 충돌 여부 확인. signed URL 저장 금지. |
| memos | company_name | company_id 조인으로 대체 가능성 높음. snapshot 필요성 낮음. |
| company_account_requests | request_payload | typed 컬럼/typed detail 분리 필요. |

## 4. 후속 정리 순서 제안

```txt
1. 실제 사용처 검색: column name별 repository/API/UI 참조 확인
2. full_reset.sql 기준 컬럼 후보 분류 갱신
3. 삭제 가능한 legacy column을 작은 단위로 제거
4. repository mapper에서 삭제 컬럼 참조 제거
5. seed/smoke test 갱신
6. build/test 후 다음 후보 진행
```

삭제는 한 번에 하지 않는다. 특히 작업지시서, 첨부, 메모, 휴지통, purge 관련 컬럼은 흐름이 안정된 뒤 별도 버전에서 다룬다.
