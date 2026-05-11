# 0.10.55 권한 카탈로그 / 권한 매트릭스 설계

## 목적

0.10.52에서 추가한 초대/가입/승인/권한 DB 구조를 실제 멤버관리 화면과 연결하기 전에, 고객사 멤버에게 부여할 권한 코드를 한곳에서 확인할 수 있도록 정리한다.

이번 버전은 실제 인증 또는 API 권한 검증을 연결하지 않는다. 역할은 기본 체크값으로만 사용하고, 실제 저장과 접근 제어는 `permission_code` 직접 부여 기준으로 유지한다.

## 핵심 원칙

1. `role`은 접근 제어 기준이 아니다.
2. `role_template`은 승인 화면에서 기본 체크값을 채우는 preset이다.
3. 실제 저장은 `member_permissions.permission_code` 기준이다.
4. 화면 카드 노출, 버튼 노출, API 검증은 최종적으로 동일한 permission_code를 기준으로 한다.
5. 시스템관리자 권한은 고객사 멤버 권한과 분리한다.

## 신규 코드 기준

`lib/permissions/memberPermissionMatrix.ts`에 다음 읽기 전용 기준을 추가했다.

- `MEMBER_PERMISSION_CATALOG`
- `MEMBER_ROLE_TEMPLATE_POLICIES`
- `MEMBER_PERMISSION_MATRIX_ROWS`
- `getMemberPermissionCatalogByGroup`
- `getMemberRoleTemplatePermissionCount`
- `hasMemberRoleTemplatePermission`

## 권한 그룹

- `workorder`
- `partner`
- `storage`
- `stats`
- `settings`
- `member`
- `audit`
- `personal`
- `system`

## 역할 템플릿

- `company_admin`
- `designer`
- `inspector`
- `inventory_manager`
- `viewer`

역할 템플릿은 승인 시 기본 체크값으로만 사용한다. 고객관리자가 승인 화면에서 개별 permission_code를 추가하거나 제거할 수 있어야 한다.

## 화면 반영

`/admin/members`에 다음 읽기 전용 설계 영역을 추가했다.

1. 권한 카탈로그
2. 권한 그룹별 개수
3. 시스템 전용 권한 개수 표시
4. 권한 코드 / 그룹 / 범위 목록
5. 역할 템플릿별 기본 체크 개수

## 홈 버튼 보정

관리자 공통 상단 타이틀 카드인 `AdminTopbar`의 홈 버튼을 텍스트 `홈`에서 집 모양 아이콘 버튼으로 변경했다.

- 접근성 이름은 기존 `topbar.actions.home` i18n 값을 유지한다.
- `title`도 기존 i18n 값을 사용한다.
- `/admin` 이동 경로는 유지한다.

## 후속 연결

0.10.56부터 초대 링크/QR 생성 화면을 만들 때 이 기준을 다음 위치에 연결한다.

1. 초대 생성 모달의 role template 기본 선택값
2. 가입 신청 승인 화면의 권한 체크리스트
3. 승인 시 `member_permissions` 저장
4. 멤버 홈 카드 노출 기준
5. API `requirePermission` 기준
