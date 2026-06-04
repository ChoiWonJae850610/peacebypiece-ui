# Playwright 환경 구성 1차 (0.19.90)

## 목적

0.19.90은 화면 자동 테스트를 실제 코드베이스에 연결하기 위한 최소 환경 구성 단계다. 0.19.89 설계 문서에서 정리한 전체 E2E 전략 중, 이번 버전은 공개 로그인 화면 진입 smoke 테스트까지만 추가한다.

## 추가된 실행 명령

```bash
npm run test:e2e:install
npm run test:e2e
npm run test:e2e:headed
```

- `test:e2e:install`: Chromium 브라우저 바이너리 설치
- `test:e2e`: 기본 headless E2E 실행
- `test:e2e:headed`: 브라우저 창을 띄운 상태로 E2E 실행

현재는 `npx --yes @playwright/test@1.51.1` 방식으로 실행한다. package-lock 충돌을 피하기 위해 Playwright 패키지를 고정 의존성으로 추가하지 않고, 다음 단계에서 실제 설치 방식과 CI 방식을 확정한다.

## 기본 baseURL

기본값은 다음과 같다.

```text
http://127.0.0.1:3000
```

다른 주소에서 실행할 때는 다음처럼 지정한다.

```bash
$env:PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
npm run test:e2e
```

## dev server 처리

기본 설정은 Playwright가 `npm run dev`를 실행해 서버를 띄운다. 이미 별도 터미널에서 dev server를 실행 중이면 기존 서버를 재사용한다.

외부에서 이미 서버를 관리하고 Playwright가 서버를 띄우지 않게 하려면 다음 값을 사용한다.

```bash
$env:PLAYWRIGHT_SKIP_WEB_SERVER="1"
npm run test:e2e
```

## 현재 smoke 범위

```text
/login 진입
WAFL title 확인
Google 계정으로 계속하세요 heading 확인
Google 로그인 링크 href 확인
```

이 테스트는 로그인 세션 없이 확인 가능한 공개 화면만 대상으로 한다. 따라서 실제 운영 데이터, DB, R2, 세션 쿠키를 변경하지 않는다.

## 다음 단계

0.19.91부터는 정책/환경설정 화면 자동 테스트로 확장한다. 이때는 로그인 세션 주입 방식 또는 테스트 전용 세션 쿠키 생성 방식을 확정해야 한다.
