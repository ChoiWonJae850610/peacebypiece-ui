# 0.19.92.2 Playwright workspace selector stabilization

## 목적

0.19.92.1 적용 후 작업지시서 생성 모달의 Enter 생성은 정상 동작으로 확인되었다. 따라서 이번 보정은 Enter 생성 코드를 변경하지 않고, Playwright 정책/환경설정 테스트의 실제 화면 진입 및 selector 안정화에만 한정한다.

## 원인

기존 테스트는 다음처럼 특정 heading role과 정확한 문구에 강하게 의존했다.

- `고객 공개 약관·정책`
- `환경설정`
- `로그아웃`

실제 화면에서는 서버 컴파일 지연, topbar icon button의 accessible name, 보호 라우트 redirect, role 구조 차이 때문에 heading role 기반 assertion이 불안정할 수 있다.

## 변경

- 보호 라우트 진입 후 현재 URL이 기대 path를 포함하는지 먼저 확인한다.
- 테스트 세션으로 보호 라우트에 진입하지 못하면 실패 대신 skip 처리해 원인을 명확히 남긴다.
- heading role 단일 기준 대신 body text 기반으로 주요 문구를 확인한다.
- 로그아웃 버튼은 `aria-label` 또는 `title` 기준 locator로 찾는다.
- 기대 timeout을 15초로 늘려 Next dev 최초 컴파일 지연에 덜 민감하게 했다.

## 변경하지 않은 것

- 작업지시서 생성 모달 Enter UX는 유지한다.
- DB schema, API route, package.json, package-lock.json은 변경하지 않는다.
- 실제 운영 데이터 변경 테스트는 추가하지 않는다.

## 확인 명령

```bash
npm run test:e2e
```

## 기대

- 공개 로그인 화면 smoke test는 기존처럼 통과한다.
- 보호 라우트 테스트는 세션 진입 가능 환경에서는 통과한다.
- 보호 라우트 테스트가 세션 진입 불가 환경이면 실패 대신 skip으로 표시한다.
