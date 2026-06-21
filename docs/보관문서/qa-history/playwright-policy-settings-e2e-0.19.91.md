# 0.19.91 Playwright E2E 1차 — 정책/환경설정 화면

## 목적

0.19.90.1에서 Playwright 최소 실행 환경이 통과했으므로, 0.19.91에서는 로그인 이후 업무 화면 중 위험도가 낮은 정책/환경설정 화면을 첫 E2E 대상으로 연결한다.

## 추가한 테스트

- `tests/e2e/workspace-policy-settings.spec.mjs`
  - `/workspace/legal` 진입
  - 고객 공개 정책 문서 5개 표시 확인
  - 필수 약관·정책 동의 상태 패널 표시 확인
  - 필수 약관·정책 전체 동의 버튼 동작 확인
  - `/workspace/settings` 진입
  - 환경설정의 약관·정책 카드 진입 확인
  - 약관·정책 보기 링크가 `/workspace/legal`로 연결되는지 확인
- `tests/e2e/helpers/waflSession.mjs`
  - Playwright용 WAFL 세션 쿠키 생성
  - `.env.local`, `.env.development.local`, `.env.test.local`, `.env` 순서로 세션 secret 탐색
  - `WAFL_SESSION_SECRET` 우선, 없으면 기존 앱 로직과 동일하게 `GOOGLE_OAUTH_CLIENT_SECRET` 사용

## 인증 처리 방식

Google OAuth 실제 로그인은 E2E 1차 범위에서 제외한다. 대신 서버의 실제 세션 검증 방식과 같은 HMAC 구조로 `wafl_auth_session` 쿠키를 만들어 보호 화면에 진입한다.

테스트는 다음 중 하나가 없으면 skip 처리한다.

- `WAFL_SESSION_SECRET`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## API 처리 방식

정책 동의 상태와 환경설정 클라이언트 API는 Playwright route mock으로 고정한다.

- `/api/policies/current`
- `/api/policies/agreements`
- `/api/admin/companies/current`
- `/api/admin/settings/company-account-requests`

이 방식은 화면 구조와 이동/버튼 동작을 먼저 안정화하기 위한 것이다. DB write 검증은 기존 `npm run test:smoke:db-api`가 담당한다.

## 실행 명령

```bash
npm run test:e2e
```

이미 개발 서버를 켜둔 경우:

```powershell
$env:PLAYWRIGHT_SKIP_WEB_SERVER="1"
npm run test:e2e
```

## 기대 결과

```text
2 passed
```

0.19.90.1의 공개 로그인 smoke test 1건까지 포함하면 전체 E2E는 3건이 통과해야 한다.

## 제외 범위

- 실제 Google OAuth 로그인
- 실제 정책 동의 DB 저장
- 실제 회사 계정 요청 API 저장
- 시스템관리자 화면 E2E
- 작업지시서/원단·부자재 발주 E2E
