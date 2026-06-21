# 0.19.92.1 Playwright 쿠키 설정 및 작업지시서 생성 Enter UX 보정

## 목적

0.19.92 적용 후 Playwright E2E가 세션 쿠키 주입 단계에서 실패하고, 작업지시서 생성 모달의 제목 입력 필드에서 Enter 키로 생성되지 않는 UX 공백을 보정한다.

## 원인

Playwright `browserContext.addCookies()`는 테스트 쿠키에 `url`을 사용할 때 `path`를 함께 넘기지 않는 구성이 안전하다. 0.19.92의 세션 헬퍼는 `url`과 `path`를 함께 전달해 Playwright 실행 환경에서 `Cookie should have either url or path` 오류가 발생했다.

작업지시서 생성 모달은 생성 버튼 클릭만 처리하고 제목 입력 필드의 Enter 키 제출 처리가 없었다.

## 변경

- Playwright WAFL 세션 쿠키 헬퍼에서 `url` 기반 쿠키 주입 시 `path` 전달을 제거했다.
- 작업지시서 생성 모달 제목 입력 필드에 Enter 키 제출 처리를 추가했다.
- IME 조합 중 Enter 입력은 제출하지 않도록 `event.nativeEvent.isComposing`을 확인한다.

## 확인

- `npm run test:e2e` 실행 시 정책/환경설정 E2E가 세션 쿠키 단계에서 중단되지 않아야 한다.
- 작업지시서 생성 모달에서 제목을 입력하고 Enter를 누르면 생성 버튼 클릭과 동일하게 생성이 진행되어야 한다.
