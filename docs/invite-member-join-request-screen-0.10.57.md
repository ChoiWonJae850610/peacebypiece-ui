# 0.10.57 초대 링크 접속 / 멤버 가입 신청 화면

## 목적

고객관리자가 공유한 내부 멤버 초대 링크 또는 QR을 통해 사용자가 접속했을 때 열리는 가입 신청 화면을 1차로 고정한다.

이번 버전은 실제 Google OAuth 연결, DB token_hash 조회, join_requests 저장까지 연결하지 않는다. 화면 구조와 상태 전환 기준을 먼저 고정한다.

## 추가 경로

- `/invite/member/[token]`

## 화면 구성

1. 초대 링크 상태 카드
   - URL token을 표시한다.
   - token 원문 전체 노출을 피하기 위해 화면에서는 mask 처리한다.
   - `preview-` token은 미리보기 링크로 표시한다.

2. Google 로그인 안내 카드
   - 이메일/비밀번호 직접 구현은 후순위다.
   - 1차 인증은 Google OAuth 기준이다.
   - 실제 로그인 버튼 연결은 후속 버전에서 처리한다.

3. 가입 신청 정보 카드
   - 신청자 이름
   - 연락처
   - 신청 메모
   - 현재는 disabled 상태이며, 후속 API 연결 시 입력/제출을 활성화한다.

4. 처리 흐름 카드
   - 초대 링크 확인
   - Google 로그인
   - 가입 신청 저장
   - 고객관리자 승인

5. 정책 카드
   - 승인 전 접근 제한
   - permission_code 직접 부여
   - token 원문 저장 금지

## 초대 URL 정책

기존 invitation repository의 inviteUrl 생성 기준을 다음처럼 정리한다.

- `company_to_member` → `/invite/member/{rawToken}`
- `system_to_company_admin` → `/invite/company/{rawToken}`

이번 버전에서 실제 `/invite/company/[token]` 화면은 만들지 않는다. 시스템관리자 고객사 초대 화면은 후속 버전에서 진행한다.

## 후속 연결 기준

후속 버전에서 연결해야 할 항목은 다음과 같다.

1. token 원문을 sha256 hash로 변환한다.
2. invitations.token_hash와 비교한다.
3. invitation_type 또는 scope가 `company_to_member`인지 확인한다.
4. status가 active/pending인지 확인한다.
5. expires_at이 지나지 않았는지 확인한다.
6. 로그인 전이면 Google OAuth로 보낸다.
7. 로그인 후 users.email과 초대 이메일이 지정되어 있으면 일치 여부를 확인한다.
8. join_requests를 pending으로 생성한다.
9. 사용자를 승인 대기 대시보드로 이동시킨다.

## 보안 기준

- DB에 raw token을 저장하지 않는다.
- 화면에는 token 전체를 노출하지 않는다.
- 승인 전 사용자는 작업지시서, 저장소, 통계, 협력업체, 멤버관리로 접근하지 못한다.
- 프론트 버튼 제한은 UX 보조일 뿐이며, 실제 제한은 API permission 검증에서 처리한다.

## 이번 버전에서 하지 않은 것

- 실제 OAuth 연결
- 실제 token_hash DB 조회
- 실제 join_requests 저장
- 실제 승인 대기 redirect
- 실제 QR 생성 라이브러리 도입
- package.json 변경
- DB schema 변경
