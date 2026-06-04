# Playwright 환경 구성 보정 0.19.90.1

## 원인

0.19.90에서는 `package.json`의 E2E 명령이 `npx --yes @playwright/test@1.51.1 test` 형태였습니다.
이 방식은 Playwright 실행 파일은 임시로 내려받을 수 있지만, 프로젝트 루트의 `playwright.config.mjs`와 테스트 파일에서 `@playwright/test`를 import할 때 Node 모듈 해석 기준이 프로젝트 `node_modules`가 되므로 `ERR_MODULE_NOT_FOUND`가 발생할 수 있습니다.

## 보정

- `@playwright/test`를 devDependency로 명시했습니다.
- `package-lock.json`에 Playwright 패키지 항목을 반영했습니다.
- E2E 명령을 로컬 의존성 기준 `playwright test`로 변경했습니다.
- 브라우저 설치 명령도 `playwright install chromium`으로 변경했습니다.

## 적용 후 실행 순서

새 의존성이 추가되었으므로 패치 적용 후 한 번은 다음 순서로 실행합니다.

```bash
npm install
npm run test:e2e:install
npm run test:e2e
```

이미 `npm run dev`를 별도 창에서 켠 경우:

```powershell
$env:PLAYWRIGHT_SKIP_WEB_SERVER="1"
npm run test:e2e
```

## 변경하지 않은 범위

- 앱 화면 로직 변경 없음
- DB schema 변경 없음
- API route 변경 없음
- smoke DB/API 스크립트 변경 없음
