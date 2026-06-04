# Playwright 화면 자동 테스트 설계 1차 — 0.19.89

## 목적

0.19.88.1에서 DB/API smoke test가 `completed successfully`로 통과했으므로, 다음 자동화 단계는 실제 화면 진입과 핵심 버튼 노출을 검증하는 Playwright E2E 체계를 설계하는 것이다.

이번 버전은 Playwright를 설치하거나 실행하지 않는다. 로그인 우회 방식, 테스트 계정/seed 연결 방식, 역할별 시나리오, 기존 PowerShell 자동화 스크립트와의 연결 방향을 먼저 문서화한다.

## 현재 자동화 기준

현재 자동화는 다음 2단계로 나뉜다.

1. DB/API contract smoke test
   - 명령: `npm run test:smoke:db-api`
   - 범위: schema, 멤버 상태, 회사 계정 요청 승인/반려, 정책 동의 저장/조회/upsert
   - 특징: transaction rollback 기반으로 테스트 데이터가 남지 않는다.
2. 화면 E2E test
   - 예정 명령: `npm run test:e2e`
   - 범위: 로그인 이후 화면 진입, 핵심 UI 표시, 버튼 노출, 제한 상태 표시
   - 특징: 실제 DB/R2 운영 데이터 변경 없이 seed 또는 테스트 컨텍스트 기준으로 검증해야 한다.

## Playwright 도입 원칙

### 1. 테스트는 낮은 위험도부터 확장한다

처음부터 모든 업무 흐름을 클릭하지 않는다.

초기 순서:

1. 앱 실행 여부 확인
2. 로그인/세션 우회 확인
3. 읽기 전용 화면 진입 확인
4. 버튼/패널 노출 확인
5. 테스트 전용 데이터에 한해 write 동작 확인
6. 파일 업로드/R2/PDF/영구삭제 계열은 마지막 단계에서 별도 설계

### 2. 실제 운영 데이터 변경 금지

Playwright 테스트는 다음 중 하나를 만족해야 한다.

- rollback 가능한 API/DB smoke test와 분리되어 읽기 전용으로 실행
- 테스트 전용 seed 회사/사용자/작업지시서만 사용
- write 동작은 테스트 전용 데이터에만 수행
- 파일 업로드/R2 write는 별도 mock 또는 test bucket 설계 전까지 제외

### 3. 로그인 우회는 개발 전용 기능만 사용한다

현재 앱에는 Google 로그인 기반 세션과 개발용 테스트 컨텍스트가 분리되어 있다.

화면 테스트에서 사용할 수 있는 우회 방식 후보:

| 방식 | 설명 | 장점 | 단점 | 판단 |
| --- | --- | --- | --- | --- |
| 실제 Google 로그인 | 브라우저에서 실제 OAuth 로그인 | 실제 운영 흐름과 가장 유사 | 자동화 불안정, 계정/2FA/캡차/세션 문제 | 초기 제외 |
| 세션 쿠키 주입 | Playwright가 `wafl_auth_session` 쿠키 직접 주입 | 빠르고 안정적 | 서명 secret 필요, 테스트 유틸 필요 | 1순위 후보 |
| `/dev/test-console` 사용 | 로그인된 사용자에서 개발용 컨텍스트 전환 | 현재 구조 활용 가능 | 최초 base session은 필요 | 보조 수단 |
| 테스트 전용 로그인 API | 개발 환경에서만 세션 발급 API 제공 | 가장 자동화 친화적 | API 추가 필요, 보안 guard 필요 | 2단계 후보 |

0.19.90의 1차 구현에서는 **세션 쿠키 주입 방식**을 우선 검토한다. 단, `WAFL_SESSION_SECRET`이 필요한 구조이므로 테스트 환경에서만 쓰는 fixture helper를 별도 파일로 둔다.

## 권장 파일 구조

0.19.90 이후 권장 구조:

```text
playwright.config.ts
tests/e2e/
  helpers/
    auth-session.ts
    test-users.ts
    routes.ts
  smoke/
    app-shell.spec.ts
    workspace-legal.spec.ts
    system-account-requests.spec.ts
```

역할별 확장 시:

```text
tests/e2e/roles/
  company-admin.spec.ts
  designer.spec.ts
  inspector.spec.ts
  inventory-manager.spec.ts
```

## 테스트 환경 변수

Playwright 전용 `.env.local` 값을 새로 요구하지 않는다. 기존 환경을 우선 사용한다.

필요 후보:

```text
DATABASE_URL
WAFL_SESSION_SECRET
NEXT_PUBLIC_APP_URL 또는 PLAYWRIGHT_BASE_URL
WAFL_ENABLE_DEV_TEST_CONSOLE=true
```

주의:

- 실제 secret 값은 저장소나 patch zip에 포함하지 않는다.
- `.env.local`은 패치에 포함하지 않는다.
- 운영 환경에서는 dev test console이 열리면 안 된다.

## 로그인/세션 설계

### 1차: Playwright 세션 쿠키 주입

테스트 helper가 다음 값을 가진 세션 payload를 생성한다.

```text
userId
companyId
companyMemberId
companyName
role
email
name
issuedAt
```

그리고 앱의 `wafl_auth_session` 쿠키 형식과 동일하게 서명된 값을 브라우저 context에 주입한다.

검증 대상:

- `company_admin` 세션으로 `/workspace` 진입 가능
- `member` 세션으로 `/workspace` 진입 가능
- `system_admin` 세션으로 `/system` 진입 가능
- 권한 없는 세션으로 `/system` 진입 시 차단

### 2차: dev test context 전환

이미 존재하는 `/dev/test-console`은 수동 권한 테스트에 유용하다.

자동화에서는 다음 보조 흐름으로만 사용한다.

1. base session 생성
2. `/dev/test-console` 진입
3. target member 전환
4. effective session 기준 화면 진입 확인

초기 Playwright smoke에서는 클릭 기반 전환보다 세션 직접 주입이 안정적이다.

## seed 데이터 연결 방식

Playwright가 신뢰할 수 있는 고정 대상이 필요하다.

권장 seed 구성:

| 역할 | 용도 |
| --- | --- |
| system_admin | `/system` 화면 진입, 회사 계정 요청 검토 화면 |
| company_admin | `/workspace`, 멤버관리, 환경설정, 정책 동의 화면 |
| designer | 작업지시서 조회/생성 버튼 권한 확인 |
| inspector | 검수 단계 버튼 노출 확인 |
| inventory_manager | 원단·부자재 발주 화면 접근 확인 |
| viewer 또는 제한 멤버 | 버튼 미노출/조회 제한 확인 |

seed는 DB/API smoke test처럼 rollback될 필요는 없다. 대신 테스트 전용 회사/사용자를 명확히 구분하고, 실제 운영 데이터와 섞이지 않게 해야 한다.

권장 prefix:

```text
WAFL E2E Test Company
wafl-e2e-*@example.test
```

## 1차 Playwright smoke 시나리오

### A. app shell smoke

목표:

- 앱이 실행 중인지 확인
- baseURL 응답 확인
- 공개 로그인 화면 진입 확인

예상 파일:

```text
tests/e2e/smoke/app-shell.spec.ts
```

### B. workspace legal smoke

목표:

- 회사 관리자 세션으로 `/workspace/legal` 진입
- 정책 문서 5개 표시 확인
- 필수 동의 상태 패널 확인
- 전체 동의 버튼 표시 확인

예상 파일:

```text
tests/e2e/smoke/workspace-legal.spec.ts
```

초기에는 버튼 클릭 저장까지 하지 않고, 표시 검증만 먼저 한다.

### C. workspace settings smoke

목표:

- `/workspace/settings` 진입
- 약관·정책 이동 버튼 확인
- 환경설정 화면이 세션 회사 기준으로 표시되는지 확인

### D. system account requests smoke

목표:

- 시스템관리자 세션으로 `/system/account-requests` 진입
- 목록/빈 상태 중 하나가 정상 표시되는지 확인
- 검토 중/승인/반려 버튼의 표시 조건 확인

초기에는 실제 승인/반려 클릭을 하지 않는다.

## 2차 이후 확장 시나리오

| 버전 | 영역 | 내용 |
| --- | --- | --- |
| 0.19.91 | 정책/환경설정 | 정책 문서 표시, 필수 동의 패널, 설정에서 이동 |
| 0.19.92 | 시스템관리자 회사 요청 | 목록, 상세, 검토 버튼 표시 |
| 0.19.96 이후 | 정책 차단 | 미동의 상태 업무 화면 접근 차단 |
| 0.20.01 이후 | 저장공간 제한 | 80% 안내, 100% 업로드 차단 |
| 0.20.04 이후 | 데이터 내보내기 | 요청 버튼, 안내 모달, job 상태 표시 |

## 기존 PowerShell 자동화와 연결 방향

현재 사용자가 실행하는 PowerShell 자동화 스크립트는 다음 역할로 확장하는 것이 적절하다.

1. `npm run dev` 백그라운드 실행/종료
2. DB/API smoke test 실행
3. Playwright smoke test 실행
4. 결과 로그 경로 표시
5. 실패 시 마지막 로그를 화면에 요약 표시

권장 메뉴 흐름:

```text
1. patch 적용
2. npm run build 실행 여부 토글
3. npm run dev 토글
4. DB/API smoke test 실행
5. Playwright E2E smoke 실행
6. 전체 검증 실행
```

Playwright 도입 후에도 DB/API smoke test는 유지한다. 두 테스트는 목적이 다르다.

- DB/API smoke: 데이터 계약 확인
- Playwright E2E: 화면 접근/표시/버튼 노출 확인

## 실패 메시지 기준

Playwright 실패는 사용자가 바로 이해할 수 있어야 한다.

권장 실패 메시지 분류:

```text
[auth] 세션 생성 실패
[route] 화면 진입 실패
[permission] 접근 차단/허용 조건 불일치
[ui] 필수 카드/버튼/문구 누락
[data] 테스트 seed 데이터 누락
[network] API 응답 실패
```

## 0.19.90 구현 전 결정 필요 사항

0.19.90에서 실제 Playwright 패키지를 추가하기 전에 다음을 확정해야 한다.

1. Playwright 설치를 바로 진행할지
2. `test:e2e` 명령명을 사용할지
3. 세션 쿠키 helper를 테스트 폴더 안에 둘지
4. E2E seed 데이터를 기존 full_reset.sql에 포함할지, 별도 SQL로 둘지
5. 최초 테스트 범위를 `/workspace/legal` 단일 화면으로 제한할지

권장 판단:

- 0.19.90은 Playwright 설치 + app shell smoke + `/workspace/legal` 진입 표시 검증까지만 진행한다.
- write 동작 검증은 0.19.91 이후로 미룬다.
- R2/PDF/파일 업로드 관련 자동 테스트는 저장공간 제한 설계 이후 별도 단계로 분리한다.

## 이번 버전에서 변경하지 않는 범위

- Playwright 설치 없음
- package.json/package-lock.json 변경 없음
- 테스트 코드 추가 없음
- 앱 기능 로직 변경 없음
- API route 변경 없음
- DB schema 변경 없음
- full_reset.sql 변경 없음
- R2/첨부/메모/휴지통/purge 흐름 변경 없음

## 다음 단계

0.19.90에서는 Playwright 환경 구성 1차를 진행한다. 실제 의존성 추가, `test:e2e` 명령, 기본 config, app shell smoke 또는 `/workspace/legal` 표시 smoke 중 하나를 최소 범위로 추가한다.
