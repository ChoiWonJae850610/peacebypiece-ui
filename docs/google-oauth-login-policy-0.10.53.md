# 0.10.53 Google OAuth 1차 로그인 방식 설계

## 목적

이번 버전은 PeaceByPiece의 첫 로그인 방식을 Google OAuth 기준으로 설계한다.

0.10.52에서 초대, 가입 신청, 승인, 권한 직접 부여를 위한 DB 구조를 정리했으므로, 이번 버전은 실제 인증 provider를 어떻게 연결하고 승인 전/승인 후 사용자를 어디로 보내야 하는지 기준을 고정한다.

## 결론

1차 로그인 방식은 Google OAuth를 우선한다.

이메일/비밀번호 직접 구현은 초기 범위에서 제외한다. 비밀번호 재설정, 이메일 인증, 계정 탈취 대응, 비밀번호 저장 정책을 직접 관리해야 하므로 현재 제품화 전 단계에서는 부담이 크다.

Kakao, Naver, Apple 로그인은 후속 provider 후보로 남긴다. 다만 1차 구현은 Google OAuth 하나로 제한한다.

## 후보 비교

### Google OAuth + Auth.js

장점:

- Next.js에서 일반적으로 쓰기 쉽다.
- OAuth callback, provider profile, session 처리 기준이 이미 정리되어 있다.
- provider 확장이 가능하다.
- 직접 비밀번호를 저장하지 않는다.

주의점:

- 패키지 도입이 필요할 수 있다.
- 현재 프로젝트의 기존 DB 구조와 session model을 맞춰야 한다.
- 인증은 편해지지만 권한 검증은 별도 구현해야 한다.

판단:

- 1차 구현 후보로 가장 적합하다.
- 단, Auth.js role/session 값에 권한을 크게 싣지 않고, 서버에서 `company_members`와 `member_permissions`를 다시 조회하는 구조가 안전하다.

### Google OAuth + 자체 세션

장점:

- DB 구조와 쿠키 정책을 완전히 직접 통제할 수 있다.
- 외부 인증 라이브러리 의존을 줄일 수 있다.

주의점:

- callback 검증, state 검증, CSRF, session rotation, cookie hardening을 직접 다뤄야 한다.
- 구현 실수 가능성이 커진다.

판단:

- 현재 단계에서는 우선순위가 낮다.

### 이메일/비밀번호 직접 구현

장점:

- 외부 OAuth 계정이 없어도 사용할 수 있다.
- 사용자에게 익숙한 방식이다.

주의점:

- 비밀번호 hash, reset token, email verification, brute-force 방어, 계정 잠금 정책이 필요하다.
- 제품 초기 검증 단계에서 구현 대비 관리 부담이 크다.

판단:

- 초기 제외.
- 필요하면 1차 제품 안정화 이후 별도 버전에서 검토한다.

## users 매핑 기준

0.10.52에서 추가한 `users` 보조 컬럼을 그대로 사용한다.

- `email`: Google profile email
- `display_name`: Google profile name
- `avatar_url`: Google profile image
- `auth_provider`: `google`
- `provider_user_id`: Google subject id
- `email_verified`: Google profile의 email verified 값
- `status`: 기본 `active`, 운영상 정지/삭제 시 변경
- `last_login_at`: 로그인 성공 시 갱신

`auth_provider + provider_user_id` 조합은 provider identity의 기준이다.

이메일은 초대 검증에 사용할 수 있지만, provider identity의 primary key처럼 취급하지 않는다. 사용자가 provider를 바꾸거나 이메일이 변경될 수 있기 때문이다.

## 초대 이메일과 로그인 이메일 검증 정책

초대 생성 시 `invited_email`이 있는 경우 다음 기준을 적용한다.

1. 로그인한 Google email과 `invited_email`이 같으면 정상 신청 가능하다.
2. 대소문자는 구분하지 않는다.
3. `invited_email`이 비어 있으면 링크 token 유효성만으로 신청 화면 진입을 허용한다.
4. email mismatch는 즉시 승인하지 않고, 신청 화면에서 차단하거나 별도 검토 상태로 보낼 수 있다.
5. 1차 구현에서는 보수적으로 mismatch를 차단한다.

권장 초기 정책:

- 내부 멤버 초대에서 이메일을 입력한 경우: 로그인 이메일 일치 필수
- 내부 멤버 초대에서 이메일을 비운 경우: token 기준 신청 허용
- 고객사 초대에서는 신청 회사명과 담당자 정보를 시스템관리자가 최종 검토하므로, invited_email이 있으면 일치 권장, 없으면 token 기준 허용

## 승인 전 redirect 정책

로그인 성공 후 사용자 상태를 다음 순서로 판정한다.

1. 승인된 `company_members`가 있으면 해당 고객사 workspace 또는 admin home으로 이동한다.
2. pending `join_requests`가 있으면 승인 대기 대시보드로 이동한다.
3. 유효한 초대 token context가 있으면 가입 신청 화면으로 이동한다.
4. 아무 소속/신청/초대 context가 없으면 제한 안내 화면으로 이동한다.

승인 전 사용자는 업무 메뉴에 접근하지 못한다.

허용:

- 승인 대기 대시보드
- 신청 상태 확인
- 개인 설정
- 로그아웃

차단:

- 작업지시서
- 저장소
- 통계
- 협력업체관리
- 멤버관리
- 고객사 환경설정
- 시스템관리자 화면

## 승인 후 redirect 정책

승인 후 화면 이동은 role 이름이 아니라 permission 기준으로 결정한다.

우선순위 후보:

1. `workorder.read`가 있으면 업무 홈 또는 작업지시서 화면
2. `member.read`만 강하게 있는 관리자는 고객관리자 홈
3. `stats.read`만 있는 조회형 사용자는 통계 카드가 보이는 홈
4. 권한이 거의 없으면 승인 완료 안내와 관리자 문의 안내

프론트 카드 노출과 API 검증은 모두 `permission_code` 기준으로 확장한다.

## session에 넣을 값과 넣지 않을 값

session에는 최소값만 넣는다.

넣을 수 있는 값:

- `userId`
- `email`
- `displayName`
- `avatarUrl`
- 현재 선택된 `companyId` 후보

넣지 않을 값:

- 전체 권한 목록의 영구 캐시
- secret
- raw OAuth token
- 초대 raw token
- DB URL
- R2 관련 정보

권한은 화면 진입 또는 API 요청 시 서버에서 `company_members`와 `member_permissions`를 기준으로 다시 확인한다.

## API 권한 검증과의 관계

OAuth 로그인은 사용자가 누구인지 확인하는 단계다.

업무 접근 가능 여부는 별도 단계다.

접근 제어 기준:

1. session user 확인
2. company membership 확인
3. membership status가 `approved`인지 확인
4. 필요한 `permission_code` 보유 여부 확인
5. 실패 시 통일된 401/403 응답 반환

즉, Google 로그인이 성공해도 승인되지 않았거나 권한이 없으면 업무 API를 사용할 수 없다.

## 초대 token 처리 기준

raw token은 URL에만 존재한다.

DB에는 `token_hash`만 저장한다.

초대 링크 접속 시 처리:

1. URL token을 hash 처리한다.
2. `invitations.token_hash`와 비교한다.
3. status가 `active` 또는 호환 가능한 pending인지 확인한다.
4. `expires_at` 만료 여부를 확인한다.
5. 취소/만료/수락 완료 상태면 신청을 막는다.

## 0.10.53에서 하지 않는 것

- 실제 Auth.js 설치 없음
- package.json / package-lock.json 수정 없음
- Google OAuth callback route 구현 없음
- session adapter 구현 없음
- 로그인 버튼 UI 구현 없음
- 초대 링크 신청 route 구현 없음
- 승인 대기 대시보드 구현 없음
- API permission guard 구현 없음
- 기존 작업지시서/저장소/휴지통/R2 purge 흐름 변경 없음

## 후속 구현 순서 보정

### 0.10.54

고객관리자 멤버관리 화면 IA 재정리.

멤버 목록, 초대 대기, 가입 신청 대기, 권한 요약, 상태 표시를 화면 구조로 먼저 정리한다.

### 0.10.55

권한 카탈로그/권한 매트릭스 설계.

0.10.52에서 seed한 permission catalog를 화면/문서 기준으로 다시 정리하고, role template이 기본 체크값일 뿐이라는 기준을 더 명확히 한다.

### 0.10.56 이후

고객관리자 내부 멤버 초대 링크/QR 생성 화면부터 실제 흐름을 연결한다.

## 적용 파일

- `docs/google-oauth-login-policy-0.10.53.md`
- `lib/constants/app.ts`
