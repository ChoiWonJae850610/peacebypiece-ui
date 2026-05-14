# 0.12.3 theme provider 구조 1차 설계

## 목적

작업지시서 semantic token을 실제 theme file 구조와 연결하기 위해 runtime provider의 기본 경로를 추가했다.
이번 버전은 개인 환경설정 UI와 연결하지 않고, `default-light` 테마를 고정 적용하는 1차 구조다.

## 적용 내용

- `lib/theme/themeDocument.ts` 추가
  - theme definition의 `cssVariables`를 React style object로 변환한다.
  - `data-pbp-theme`, `data-pbp-theme-tone`, root style attribute를 만든다.
  - client provider에서 documentElement에 theme를 적용하는 공통 함수를 제공한다.

- `lib/theme/PbpThemeProvider.tsx` 추가
  - 현재 theme id와 theme definition을 context로 제공한다.
  - hydration 이후 documentElement에 theme cssVariables를 재적용한다.
  - 후속 개인 설정 연결 시 `setThemeId`를 사용할 수 있는 구조를 남겼다.

- `app/layout.tsx` 수정
  - 서버 렌더링 시점에 `html` element에 `default-light` cssVariables를 주입한다.
  - `data-pbp-theme="default-light"`, `data-pbp-theme-tone="light"`를 부여한다.
  - `PbpThemeProvider`를 root provider로 추가했다.

- `app/globals.css` 주석 수정
  - `:root` 변수는 동적 theme 적용 전 fallback mirror로 유지한다.

## 아직 하지 않은 것

- 개인 환경설정 UI와 theme provider 연결
- DB 또는 localStorage에 사용자별 theme id 저장
- `beige-atelier`, `cold-winter`, `black-and-white` 등 추가 theme file 작성
- 사용자별 SSR 초기 theme id 결정

## 회귀 확인

- 기존 작업지시서 색상/tone이 바뀌지 않는지 확인한다.
- `html`에 `data-pbp-theme="default-light"`가 붙는지 확인한다.
- `html` style에 `--pbp-*` CSS 변수가 주입되는지 확인한다.
- provider 추가 후 hydration 오류가 없는지 확인한다.
