# Materials Database Design Draft

기준 버전: 0.16.48
기준 원본: 0.16.47
범위: 원단·부자재 타입, DB 후보 구조, 작업지시서 연결 후보, full_reset 반영 전 설계 기준

## 1. 목적

0.16.17은 실제 DB schema 적용 단계가 아니다. 원단·부자재 화면을 실제 DB와 연결하기 전에 타입과 테이블 경계를 고정한다.

핵심 목표는 다음이다.

- 원단과 부자재를 같은 기준정보 계열로 관리한다.
- 작업지시서별 사용 원단·부자재는 별도 연결 테이블로 둔다.
- 발주 상태는 작업지시서 전체 상태와 섞지 않는다.
- 거래처명, 회사명, 카테고리명 같은 표시값은 원칙적으로 FK + join으로 가져온다.
- 당시 발주서/PDF/감사로그에 필요한 값만 snapshot으로 허용한다.

## 2. 후보 테이블

```txt
materials
material_attributes_fabric
material_attributes_submaterial
workorder_material_lines
material_order_requests
```

### materials

원단·부자재의 공통 기준정보 테이블이다.

후보 컬럼:

```txt
id
company_id
kind
code
name
category_id
partner_id
unit
lifecycle_status
memo
created_at
updated_at
```

정책:

- `company_id`는 필수 scope key다.
- `kind`는 `fabric | submaterial` 기준으로 둔다.
- `partner_name`, `company_name`, `category_name`은 현재 조회용 컬럼으로 두지 않는다.
- 거래처/카테고리 이름은 join으로 가져온다.
- 당시 문서 보존이 필요하면 order snapshot 쪽에 별도로 둔다.

### material_attributes_fabric

원단 전용 속성 테이블이다.

후보 컬럼:

```txt
material_id
composition
width_value
width_unit
weight_value
weight_unit
color_name
```

정책:

- 모든 원단에 강제되지 않는 속성은 분리한다.
- 검색/통계 대상이 되면 컬럼으로 유지한다.
- 단순 메모성 설명은 `materials.memo` 또는 제한적 metadata 후보로 둔다.

### material_attributes_submaterial

부자재 전용 속성 테이블이다.

후보 컬럼:

```txt
material_id
specification
color_name
size_label
```

정책:

- 단추/지퍼/라벨/포장재가 모두 같은 속성을 갖지 않으므로 과도하게 세분화하지 않는다.
- 검색/필터에 필요한 값만 컬럼화한다.
- 공급처명은 `materials.partner_id`로 연결한다.

### workorder_material_lines

작업지시서별 원단·부자재 사용 내역이다.

후보 컬럼:

```txt
id
company_id
workorder_id
material_id
role
required_quantity
unit
order_status
memo
created_at
updated_at
```

정책:

- 작업지시서와 기준정보를 직접 섞지 않는다.
- `company_id + workorder_id` 기준으로 목록 조회한다.
- `company_id + material_id` 기준으로 역조회 가능하게 둔다.
- `order_status`는 작업지시서 workflow status와 분리한다.
- `material_name`, `partner_name`은 현재 조회용 중복 컬럼으로 두지 않는다.

### material_order_requests

원단·부자재 발주 요청 단위가 필요해질 때 사용하는 후보 테이블이다.

후보 컬럼:

```txt
id
company_id
workorder_id
requested_by_member_id
status
requested_at
approved_at
cancelled_at
created_at
updated_at
```

정책:

- 0.16.18 기본 CRUD에는 필요하지 않을 수 있다.
- 0.16.20 이후 발주 상태 설계에서 확정한다.
- 발주서/PDF가 생성되면 당시 업체명, 수량, 단가, 요청사항 snapshot을 별도 detail/snapshot 테이블에 둔다.

## 3. 조인과 중복 필드 기준

현재 조회용 화면에는 아래 흐름을 우선한다.

```txt
workorder_material_lines
→ materials
→ partners
→ standard_categories 또는 material_categories
```

중복 저장하지 않는 후보:

```txt
company_name
material_name
partner_name
category_name
workorder_title
```

허용 가능한 snapshot 후보:

```txt
order_request_material_name_snapshot
order_request_partner_name_snapshot
order_request_quantity_snapshot
order_request_unit_snapshot
order_request_note_snapshot
```

snapshot은 “현재 조회 편의”가 아니라 “당시 발주 문서 보존”이 목적일 때만 허용한다.

## 4. 인덱스 후보

```sql
CREATE INDEX idx_materials_company_kind_status
  ON materials (company_id, kind, lifecycle_status);

CREATE INDEX idx_materials_company_partner
  ON materials (company_id, partner_id);

CREATE INDEX idx_materials_company_code
  ON materials (company_id, code);

CREATE INDEX idx_workorder_material_lines_company_workorder
  ON workorder_material_lines (company_id, workorder_id);

CREATE INDEX idx_workorder_material_lines_company_material
  ON workorder_material_lines (company_id, material_id);

CREATE INDEX idx_workorder_material_lines_company_order_status
  ON workorder_material_lines (company_id, order_status);
```

## 5. full_reset 반영 기준

0.16.17에서는 `full_reset.sql`을 수정하지 않는다.

실제 DB 적용은 아래 조건을 확인한 뒤 별도 버전에서 한다.

```txt
- materials 화면 필드가 UI상 충분한지
- 작업지시서 상세 연결 방식이 확정되었는지
- 협력업체 partners와 연결할지, 별도 supplier 테이블을 둘지 확정되었는지
- 발주 상태가 작업지시서 workflow와 충돌하지 않는지
- seed_dev.sql에 넣을 최소 후보 데이터가 정리되었는지
- smoke test에 company scope, workorder scope, material scope가 포함되었는지
```

## 6. 다음 연결 단계

```txt
0.16.18:
- repository/service/API 기본 목록/생성/수정/삭제 연결
- companyId scope 강제
- 아직 작업지시서 상태와 깊게 연결하지 않음

0.16.19:
- 작업지시서 상세의 원단·부자재 연결
- workorder_material_lines 기반 추가/수정/삭제

0.16.20 이후:
- 발주 요청 이후 상태 설계
- order request/snapshot 구조 확정
```
