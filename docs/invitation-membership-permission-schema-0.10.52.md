# 0.10.52 초대 / 가입 / 승인 / 권한 DB schema 설계

## 목적

이번 버전은 멤버관리와 고객사 초대 기능을 실제 구현하기 전에 필요한 DB 기준을 정리한다.

핵심 방향은 다음과 같다.

1. 완전 공개 회원가입이 아니라 초대 링크/QR 기반 가입 신청을 사용한다.
2. 시스템관리자 고객사 초대와 고객관리자 내부 멤버 초대는 같은 `invitations` 흐름에서 처리한다.
3. 승인 전 사용자는 `join_requests` 상태로만 존재하고, 업무 화면 접근은 차단한다.
4. 승인 후 고객사 소속은 `company_members`로 관리한다.
5. 역할은 enum 기반 접근 제어가 아니라 기본 권한 묶음인 `role_templates`로만 사용한다.
6. 실제 접근 제어는 `permission_code` 직접 부여 방식인 `member_permissions`를 기준으로 확장한다.
7. 초대 token 원문은 저장하지 않고 `token_hash`만 저장한다.

## 이번 버전의 적용 파일

- `db/schema/patch_0_10_52_invitation_membership_permission_schema.sql`
- `docs/invitation-membership-permission-schema-0.10.52.md`
- `lib/constants/app.ts`

## 기존 schema와의 관계

현재 프로젝트에는 기존 `users`, `companies`, `company_users`, `permission_catalog`, `role_catalog`, `role_permissions`, `company_user_permissions`, `invitations`가 이미 있다.

이번 버전은 기존 작업지시서/저장소/휴지통/R2 purge 흐름을 건드리지 않기 위해 다음 방식으로 설계한다.

- `users`는 OAuth 연결에 필요한 보조 컬럼만 추가한다.
- `companies`는 고객사 상태와 요금제 코드 컬럼을 보완한다.
- 기존 `company_users`는 즉시 제거하지 않는다.
- 신규 승인 기반 멤버십은 `company_members`를 기준으로 설계한다.
- 기존 `permission_catalog.permission_key` 물리 컬럼은 유지하되, 도메인 용어는 `permission_code`로 통일한다.
- `member_permissions.permission_code`는 `permission_catalog.permission_key`를 참조한다.
- 기존 `invitations`는 보완형 ALTER로 확장한다.

## 신규 또는 보완되는 핵심 테이블

### users 보완

추가 후보 컬럼:

- `display_name`
- `avatar_url`
- `auth_provider`
- `provider_user_id`
- `email_verified`
- `status`
- `last_login_at`

초기 로그인 방식은 Google OAuth 1차 기준으로 설계한다. 실제 OAuth 연결은 후속 버전에서 진행한다.

### companies 보완

추가 후보 컬럼:

- `plan_code`
- `status`

고객사 생성은 시스템관리자 승인 이후 발생한다. 고객사 초대 신청 단계에서는 회사가 아직 생성되지 않을 수 있으므로 `invitations.company_id`는 nullable로 보완한다.

### invitations

역할:

- 시스템관리자 → 신규 고객사 대표/담당자 초대
- 고객관리자 → 내부 멤버 초대

주요 기준:

- `invitation_type = company | member`
- `token_hash`만 저장
- `invited_email`, `invited_phone`은 자동 발송이 아니라 식별/기록용으로 사용 가능
- 1차에서는 링크 복사와 QR 표시만 사용
- 이메일/SMS/카카오 자동 발송은 후순위

상태 후보:

- `active`
- `accepted`
- `expired`
- `cancelled`

기존 schema의 `pending`, `revoked` 값은 호환성 때문에 즉시 제거하지 않는다.

### join_requests

역할:

- 초대 링크나 QR로 접속한 사용자가 가입 신청을 남긴다.
- 승인 전 사용자는 이 상태만 보고 업무 메뉴에는 접근하지 못한다.

상태 후보:

- `pending`
- `approved`
- `rejected`
- `cancelled`

요청 유형:

- `company`: 시스템관리자 고객사 초대에 대한 가입 신청
- `member`: 고객관리자 내부 멤버 초대에 대한 가입 신청

### company_members

역할:

- 승인된 사용자의 고객사 소속을 관리한다.
- 기존 `company_users`의 후속 canonical 구조로 사용한다.

상태 후보:

- `pending`
- `approved`
- `rejected`
- `suspended`

실제 승인 시점에 다음 처리를 한다.

1. `company_members.status = approved`
2. `approved_by`, `approved_at` 기록
3. 선택한 role template을 기준으로 기본 권한을 펼친다.
4. 최종 권한은 `member_permissions`에 저장한다.

### permission_catalog

기존 물리 컬럼은 `permission_key`지만, 도메인 용어는 `permission_code`로 통일한다.

보완 컬럼:

- `permission_group`
- `label_key`
- `description_key`
- `is_system_permission`
- `sort_order`

권한 그룹 후보:

- `workorder`
- `partner`
- `storage`
- `stats`
- `settings`
- `member`
- `audit`
- `personal`
- `system`

### role_templates

역할 enum이 아니다. 권한 체크의 기준도 아니다.

사용 목적:

- 승인 화면에서 기본 체크값 제공
- 고객관리자가 권한을 직접 수정하기 전의 프리셋 제공
- 고객사별 커스텀 템플릿 확장 가능

기본 템플릿 후보:

- `company_admin`
- `designer`
- `inspector`
- `inventory_manager`
- `viewer`

### member_permissions

실제 접근 제어의 기준이다.

기준:

- `company_member_id`
- `permission_code`
- `is_enabled`
- `granted_by`
- `granted_at`

프론트 카드 노출과 API route guard는 후속 버전에서 이 권한 목록을 기준으로 확장한다.

## 승인 전 접근 정책

승인 전 사용자는 다음만 접근 가능하다.

- 승인 대기 대시보드
- 신청 상태 확인
- 개인 설정
- 로그아웃

승인 전 차단 대상:

- 작업지시서
- 저장소
- 통계
- 협력업체관리
- 멤버관리
- 고객사 환경설정

## 시스템관리자 고객사 초대 흐름

1. 시스템관리자가 고객사 초대 링크를 생성한다.
2. QR과 링크 복사 버튼을 제공한다.
3. 사용자가 카톡/문자/이메일 등으로 직접 전달한다.
4. 고객사 담당자가 초대 링크로 접속한다.
5. Google 로그인 후 회사명/담당자 정보를 입력한다.
6. `join_requests.request_type = company`로 승인 대기 상태가 된다.
7. 시스템관리자가 회사명, 요금제, 저장공간, 담당자 정보를 확정한다.
8. 고객사 생성과 고객관리자 멤버 승인을 한 트랜잭션으로 처리한다.
9. 고객사 생성 시 기준정보 초기 복사는 0.10.51 설계를 후속 버전에서 연결한다.

## 고객관리자 내부 멤버 초대 흐름

1. 고객관리자가 내부 멤버 초대 링크를 생성한다.
2. QR과 링크 복사 버튼을 제공한다.
3. 초대 대상자가 링크로 접속한다.
4. Google 로그인 후 가입 신청을 남긴다.
5. `join_requests.request_type = member`로 승인 대기 상태가 된다.
6. 고객관리자가 신청자를 승인한다.
7. role template 기본값을 불러오되, 최종 권한은 체크리스트로 직접 결정한다.
8. 승인 시 `company_members`, `member_permissions`를 저장한다.

## 후속 구현 순서

### 0.10.53

Google OAuth 1차 로그인 방식 설계.

### 0.10.54

고객관리자 멤버관리 화면 IA 재정리.

### 0.10.55

권한 카탈로그/권한 매트릭스 설계.

### 0.10.56

고객관리자 내부 멤버 초대 링크/QR 생성 화면.

### 0.10.57

초대 링크 접속/가입 신청 화면.

### 0.10.58

승인 대기 대시보드.

### 0.10.59

고객관리자 멤버 승인/권한 부여 화면.

### 0.10.60

권한 기반 메뉴/카드/버튼 제한 1차.

### 0.10.61

API 권한 검증 1차.

## 이번 버전에서 하지 않은 것

- 실제 OAuth 연결 없음
- 실제 초대 생성 API 없음
- QR 생성 UI 없음
- 이메일/SMS 자동 발송 없음
- 실제 가입 신청 route 없음
- 승인 대기 대시보드 없음
- API 권한 guard 없음
- 기존 작업지시서/저장소/휴지통/R2 purge 흐름 변경 없음
