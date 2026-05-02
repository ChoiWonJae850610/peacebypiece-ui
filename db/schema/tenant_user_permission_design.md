# PeaceByPiece 고객사 / 사용자 / 권한 DB 설계 메모

Version: 0.9.56
Status: 설계 문서
Scope: SaaS형 테넌트 구조, 사용자 소속, 역할, 권한 모델 정리
Non-goal: 실제 SQL 적용, 인증 연결, 결제 연결, 초대 토큰 구현

## 1. 설계 목적

PeaceByPiece는 장기적으로 여러 고객사가 같은 시스템을 사용하는 SaaS 구조를 전제로 한다.
따라서 작업지시서, 거래처, 첨부, 메모, 재고, 통계 데이터는 모두 고객사 기준으로 분리되어야 한다.

현재 코드와 DB에는 이미 `companies`, `users`, `company_users`, `role_catalog`, `permission_catalog`, `role_permissions` 계열 구조가 존재한다.
이번 문서는 기존 구조를 바로 뒤엎지 않고, 0.9.57 이후 SQL 보완과 repository/API skeleton 작업의 기준을 고정하는 목적이다.

## 2. 핵심 원칙

1. `company_id`는 고객 데이터 분리의 최상위 기준이다.
2. `users`는 사람 자체의 계정 정보만 가진다.
3. `company_users`는 사용자가 어떤 고객사에 어떤 역할로 소속되는지 표현한다.
4. 단일 role만으로는 부족하므로 role 기반 권한과 개별 permission override를 함께 준비한다.
5. 시스템관리자와 고객사 사용자는 같은 권한 모델로 섞지 않는다.
6. 초대, 요금제, 용량, 감사 로그는 고객사 기준으로 연결한다.
7. 화면에서 권한을 직접 판단하지 않고 policy/repository 계층을 통해 판단한다.

## 3. 테이블 역할

### companies

고객사 또는 입점 브랜드 단위다.

권장 필드:
- `id`
- `name`
- `memo`
- `is_active`
- `created_at`
- `updated_at`

향후 확장:
- `business_name`
- `business_registration_number`
- `owner_user_id`
- `default_plan_id`
- `storage_limit_bytes`
- `member_limit`
- `billing_status`

### users

사람 계정 자체다.
한 사용자는 여러 고객사에 소속될 수 있다.

권장 필드:
- `id`
- `email`
- `name`
- `is_active`
- `created_at`
- `updated_at`

주의:
- `users`에 `company_id`를 직접 두는 구조는 장기적으로 피한다.
- 고객사별 역할은 `company_users`에서 관리한다.

### company_users

고객사와 사용자 사이의 소속 정보다.

권장 필드:
- `id`
- `company_id`
- `user_id`
- `role`
- `is_active`
- `created_at`
- `updated_at`

권장 제약:
- `(company_id, user_id, role)` unique
- `company_id` index
- `user_id` index

향후 확장:
- `display_name`
- `joined_at`
- `invited_by_user_id`
- `last_active_at`

### role_catalog

역할 카탈로그다.
현재는 `admin`, `designer`, `inspector`를 유지한다.

장기 후보:
- `company_admin`
- `designer`
- `inventory_manager`
- `inspector`
- `viewer`

주의:
- 기존 화면과 repository가 `admin`, `designer`, `inspector`에 의존하므로 즉시 rename하지 않는다.
- 이름 변경은 별도 migration과 UI 라벨 분리 후 진행한다.

### permission_catalog

권한 키 카탈로그다.
0.9.55의 permission policy 모델과 키 체계를 맞춘다.

권장 permission key:
- `workorder.create`
- `workorder.edit`
- `workorder.request_review`
- `workorder.skip_review`
- `workorder.request_order`
- `workorder.inspect`
- `workorder.complete`
- `inventory.manage`
- `partner.manage`
- `member.invite`
- `billing.manage`
- `storage.manage`
- `stats.view`
- `system.audit.view`

### role_permissions

역할별 기본 권한 매핑이다.

권장 필드:
- `role`
- `permission_key`
- `is_enabled`
- `created_at`
- `updated_at`

역할 기본값은 운영 편의를 위한 기본 정책이다.
사용자별 예외 권한이 필요하면 `company_user_permissions`를 추가한다.

### company_user_permissions

향후 추가 후보 테이블이다.
고객사 소속 사용자별 권한 override를 표현한다.

권장 필드:
- `company_user_id`
- `permission_key`
- `is_enabled`
- `created_at`
- `updated_at`

권장 제약:
- `(company_user_id, permission_key)` primary key

사용 예:
- 디자이너지만 검토요청 없이 바로 발주 가능
- 재고담당자지만 거래처 관리 가능
- 관리자지만 요금제 수정 권한은 없음

## 4. 시스템관리자 분리

시스템관리자는 고객사 내부 사용자가 아니다.
따라서 `company_users`에 억지로 넣지 않는다.

권장 후보:
- `system_users`
- `system_roles`
- `system_permissions`

1차 skeleton에서는 시스템관리자 화면을 먼저 만들고, 실제 인증 연결은 후순위로 둔다.

## 5. 데이터 소유 기준

아래 테이블은 장기적으로 `company_id`를 필수로 가져야 한다.

- `spec_sheets`
- `orders`
- `partners`
- `partner_items`
- `attachments`
- `attachment_trash_items`
- `memos`
- `history_logs`
- `material_stocks`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`
- `outsourcing_processes`
- `units`
- `item_categories`

조회 repository는 항상 현재 사용자의 `company_id` 또는 시스템관리자 scope를 명시해야 한다.

## 6. 초대 모델 연결 방향

초대는 별도 테이블로 분리한다.
0.9.59 이후 상세 설계한다.

권장 테이블:
- `invitations`

핵심 필드:
- `id`
- `company_id`
- `email`
- `role`
- `permission_preset`
- `token_hash`
- `expires_at`
- `accepted_at`
- `status`
- `created_by_user_id`
- `created_at`
- `updated_at`

주의:
- raw token은 DB에 저장하지 않는다.
- raw token은 생성 응답에서 한 번만 보여준다.
- QR은 초대 링크를 QR로 보여주는 UI 표현이다.

## 7. 요금제 / 용량 연결 방향

0.9.65 이후 설계한다.

권장 테이블:
- `plans`
- `company_plan_assignments`
- `storage_usage_snapshots`

핵심:
- 시스템관리자가 고객사별 plan을 수정할 수 있어야 한다.
- 고객사별 storage/member limit override가 가능해야 한다.
- 1차 사용량 집계는 R2 실시간 조회보다 DB attachment metadata 기준을 우선한다.

## 8. 권한 판단 흐름

권장 흐름:

1. 현재 사용자 조회
2. 현재 company scope 결정
3. `company_users`에서 소속과 role 확인
4. `role_permissions`에서 기본 권한 로드
5. 향후 `company_user_permissions` override 적용
6. policy 계층에서 최종 가능 여부 계산
7. 화면은 최종 결과만 사용

금지:
- TSX에서 role 문자열 직접 비교
- 화면 컴포넌트에서 permission 계산
- API route 내부에 권한 로직 직접 작성
- 회사 범위 없는 repository 조회

## 9. 다음 패치 기준

0.9.57에서 할 일:
- 이 문서를 기준으로 SQL 초안을 추가한다.
- 기존 `patch_0_8_0_user_permission_db_structure.sql`와 충돌하지 않게 보완형 SQL로 작성한다.
- 실제 인증 연결은 하지 않는다.
- 기존 mock/test 사용자 흐름을 깨지 않는다.

0.9.58에서 할 일:
- 고객사/사용자 repository/API skeleton을 만든다.
- system companies API의 얇은 route 구조를 준비한다.
