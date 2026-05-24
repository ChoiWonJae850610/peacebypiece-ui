# 개발 전용 테스트 사용자 전환 설계

기준 버전: 0.16.39
상태: design baseline
목적: 실제 Google 로그인 구조를 유지하면서, 개발 환경에서만 테스트 fixture 사용자 컨텍스트를 빠르게 전환할 수 있는 안전한 구조를 정의한다.

## 1. 배경

현재 WAFL 로그인은 Google OAuth로 실제 사용자를 식별하고, `wafl_auth_session` 세션 쿠키 안에 다음 업무 컨텍스트를 포함한다.

```txt
- userId
- companyId
- companyMemberId
- companyName
- role
- email
- name
- googleSub
```

0.16.37에서는 DB 검증용 테스트 seed를 추가했고, 0.16.38에서는 실제 Gmail 이메일을 연결할 수 있는 seed를 추가했다.

남은 문제는 브라우저 UI 권한 테스트가 여전히 느리다는 점이다. 회사/멤버/권한/상태 조합을 확인하려면 Gmail 계정을 여러 개 오가며 로그인해야 한다.

## 2. 목표

개발 전용 테스트 사용자 전환 기능은 다음을 목표로 한다.

```txt
- 실제 Google 로그인은 유지한다.
- 앱 내부 업무 컨텍스트만 테스트 fixture 사용자로 전환한다.
- 고객사 관리자, 디자이너, 검수 담당, 자재 담당, 다른 회사 사용자를 빠르게 확인한다.
- production에는 절대 노출하지 않는다.
- 기존 system_admin 우회, mock session, fallback session을 되살리지 않는다.
```

## 3. 비목표

이번 설계의 비목표는 다음과 같다.

```txt
- Google OAuth 우회
- 인증 없는 로그인 생성
- 운영 고객 데이터 impersonation
- system_admin impersonation
- 권한 검사를 임시로 느슨하게 만드는 dev bypass
- production에서 접근 가능한 사용자 전환 기능
- 실제 사용자 계정의 DB 값을 임의 변경하는 기능
```

## 4. 추천 URL

1차 구현 후보는 별도 개발 전용 페이지다.

```txt
/dev/test-console
```

대체 후보는 workspace 내부 개발 전용 모달이지만, 운영 업무 화면과 섞이지 않도록 `/dev/test-console`이 더 안전하다.

## 5. 접근 차단 조건

테스트 콘솔은 다음 조건을 모두 만족할 때만 접근 가능해야 한다.

```txt
- NODE_ENV !== "production"
- WAFL_ENABLE_DEV_TEST_CONSOLE === "true"
- 현재 사용자가 정상 Google 로그인 세션을 보유
- 현재 세션 role이 system_admin이 아님
```

하나라도 실패하면 404 또는 접근 차단 화면으로 종료한다.

운영 배포에서 env flag가 실수로 켜져도 `NODE_ENV === "production"`이면 반드시 차단한다.

## 6. 세션 전환 방식

실제 로그인 쿠키를 직접 덮어쓰는 방식은 위험하다. 1차 구현에서는 별도 dev overlay 쿠키를 권장한다.

```txt
실제 인증 쿠키:
- wafl_auth_session
- Google 로그인으로 생성
- 원래 사용자 신원 보관

개발 테스트 overlay 쿠키:
- wafl_dev_test_context
- 개발 환경에서만 생성
- 선택한 테스트 fixture의 업무 컨텍스트만 보관
```

서버에서 현재 세션을 읽을 때는 다음 순서로 처리한다.

```txt
1. wafl_auth_session 검증
2. production 여부 확인
3. dev test console env flag 확인
4. wafl_dev_test_context 검증
5. overlay 대상이 허용된 테스트 fixture인지 DB에서 재확인
6. 인증 신원은 실제 Google 사용자로 유지하고 업무 컨텍스트만 overlay 적용
```

## 7. overlay payload 후보

`wafl_dev_test_context`에는 최소 정보만 넣는다.

```txt
- originalUserId
- targetUserId
- targetCompanyId
- targetCompanyMemberId
- targetRole
- issuedAt
```

넣지 않는 값:

```txt
- secret
- token
- Google OAuth credential
- 실제 고객 개인정보 원문
- 권한 전체 배열
```

권한은 쿠키에 저장하지 말고, 기존 permission repository에서 다시 조회한다.

## 8. 허용 대상 제한

전환 대상은 `db/test/scenario_seed.sql` 또는 `db/test/scenario_google_login_seed.sql`로 만든 테스트 fixture만 허용한다.

권장 식별 기준:

```txt
- company.service_code 또는 company name prefix가 WAFL_TEST_ 계열
- user email이 wafl.test.local 또는 명시된 테스트 Gmail 목록
- company_members.status = approved
- users.status = active
```

운영 고객사 companyId를 직접 입력해서 전환하는 기능은 금지한다.

## 9. 전환 가능 역할

1차 전환 후보:

```txt
- 회사 A 고객사 관리자
- 회사 A 디자이너
- 회사 A 검수 담당
- 회사 A 자재 담당
- 회사 A 조회 전용 멤버
- 회사 B 고객사 관리자
- 회사 B 디자이너
```

제외:

```txt
- system_admin
- 승인대기 사용자
- 비활성 사용자
- 탈퇴 사용자
- 실제 운영 고객사 사용자
```

## 10. 화면 구성

`/dev/test-console`은 다음만 제공한다.

```txt
- 현재 실제 로그인 사용자 정보
- 현재 적용 중인 업무 컨텍스트
- 테스트 회사 선택
- 테스트 사용자 선택
- 이 사용자로 보기
- 원래 사용자로 복구
- workspace로 이동
```

화면에는 명확히 개발 전용임을 표시한다.

```txt
이 화면은 개발 테스트 전용입니다.
실제 Google 로그인은 유지되며, 앱 내부 업무 컨텍스트만 테스트 fixture로 전환됩니다.
production에서는 사용할 수 없습니다.
```

## 11. API 후보

구현 시 API는 얇게 두고 실제 검증 로직은 `lib/dev/testContext/*`로 분리한다.

```txt
GET  /api/dev/test-context/options
POST /api/dev/test-context/switch
POST /api/dev/test-context/clear
```

책임 분리:

```txt
app/api/dev/test-context/*
- HTTP method 처리
- request body parsing
- response 반환

lib/dev/testContext/config.ts
- env flag / production 차단

lib/dev/testContext/repository.ts
- 테스트 fixture 목록 조회
- 대상 사용자 검증

lib/dev/testContext/session.ts
- overlay cookie 생성/검증/삭제

lib/dev/testContext/service.ts
- switch/clear/useCurrentSessionWithOverlay 조합
```

## 12. 기존 세션 함수와의 연결

현재 업무 API는 `getCurrentWaflSession()`과 `requireWorkspaceApiGuard()`를 기준으로 동작한다.

1차 구현에서는 다음 중 하나를 선택한다.

### A안: getCurrentWaflSession 내부에서 overlay 적용

장점:

```txt
- 기존 API guard 변경이 적다.
- workspace 화면/서버 액션/API가 동일하게 전환 컨텍스트를 사용한다.
```

단점:

```txt
- 인증 세션 함수에 dev 전용 분기가 들어간다.
```

### B안: 별도 getCurrentDevAwareWaflSession 추가

장점:

```txt
- 기존 인증 세션 함수가 깨끗하게 유지된다.
```

단점:

```txt
- guard와 server action 연결 범위가 넓어질 수 있다.
- 누락되는 화면/API가 생길 수 있다.
```

추천은 A안이다. 단, dev overlay 적용 코드는 별도 `lib/dev/testContext` 모듈에 격리하고, `getCurrentWaflSession()`에서는 production 차단 후 얇게 호출한다.

## 13. 보안 규칙

필수 규칙:

```txt
- production 차단은 route, API, session overlay 적용부에서 각각 중복 확인한다.
- overlay 쿠키도 HMAC 서명한다.
- overlay 대상은 매 요청마다 DB에서 테스트 fixture 여부를 재확인한다.
- system_admin role은 전환 대상에서 제외한다.
- 실제 인증 사용자 정보는 화면에 계속 표시한다.
- 원래 사용자로 복구 버튼을 항상 노출한다.
- 로그에는 실제 secret/token을 남기지 않는다.
```

## 14. 감사/로그 기준

개발 전용 기능이므로 운영 감사로그에는 연결하지 않는다.

개발 로그는 다음 수준만 허용한다.

```txt
- originalUserId
- targetUserId
- targetCompanyId
- targetRole
- switchedAt
- clearedAt
```

금지:

```txt
- Google access token
- refresh token
- OAuth code
- session secret
- R2/DB secret
```

## 15. 0.16.40 구현 범위 제안

0.16.40에서는 다음까지만 구현한다.

```txt
- /dev/test-console page 추가
- /api/dev/test-context/options 추가
- /api/dev/test-context/switch 추가
- /api/dev/test-context/clear 추가
- lib/dev/testContext/* 추가
- production + env flag 차단
- 테스트 fixture 사용자만 목록에 표시
- overlay cookie로 업무 컨텍스트 전환
- 원래 사용자로 복구
```

0.16.40에서 하지 않을 것:

```txt
- system_admin 전환
- 실제 고객사 사용자 검색/전환
- 테스트 데이터 생성 UI
- 권한 임의 편집 UI
- production 접근 허용
```

## 16. 테스트 체크리스트

구현 후 확인할 항목:

```txt
- env flag가 없으면 /dev/test-console 접근 차단
- production이면 env flag가 있어도 접근 차단
- 로그인하지 않으면 접근 차단
- 테스트 fixture 사용자 목록만 표시
- 회사 A 디자이너로 전환 시 본인 담당 작업지시서만 표시
- 회사 A 관리자 전환 시 회사 A 전체 작업지시서 표시
- 회사 B 디자이너 전환 시 회사 A 작업지시서 미표시
- 조회 전용 멤버 전환 시 생성/수정 버튼 제한
- 원래 사용자로 복구 시 overlay 제거
- 로그아웃 시 overlay도 제거
```
