# 0.10.64 시스템관리자 고객사 승인/회사 생성 화면

## 목표

시스템관리자가 고객사 초대 링크로 들어온 가입 신청을 검토하고, 승인 시 고객사 생성과 고객관리자 권한 부여로 이어지는 화면 구조를 고정한다.

## 이번 버전 범위

- `/system/companies` 화면 추가
- 시스템관리자 콘솔의 고객사 관리 링크를 `/system/companies`로 연결
- 가입 신청 검토 필드 표시
- 고객사 생성 및 승인 처리 단계 표시
- 고객관리자 기본 permission_code 목록 표시
- 승인/거절 액션 자리 표시
- 실제 DB 저장/API 연결은 후속 버전으로 분리

## 승인 처리 기준

1. 초대 링크 접속만으로 `companies`를 생성하지 않는다.
2. 고객사 가입 신청은 `join_requests.pending` 상태로 남긴다.
3. 시스템관리자가 승인할 때 다음 처리를 하나의 승인 흐름으로 묶는다.
   - `companies` 생성
   - `company_members` 고객관리자 연결
   - `member_permissions` 직접 저장
   - `join_requests.approved` 처리
   - `invitations.accepted` 처리
4. 고객사 생성 이후 0.10.51의 초기 기준정보 복사 흐름을 연결한다.

## 권한 정책

- `role_code`는 기본 체크값 또는 표시용으로만 사용한다.
- 실제 접근 제어는 `permission_code` 기준이다.
- 고객관리자 기본 권한은 화면에서 preview로 표시한다.
- 실제 승인 API 연결 시 `system.company.approve`, `system.company.reject`, `system.invitation.create` 같은 시스템관리자 권한 검증을 붙인다.

## 후속 연결

- 0.10.65: 고객사 생성 시 초기 기준정보 복사 연결
- 후속 API: 고객사 승인 API, 가입 신청 거절 API, 감사 로그 기록
