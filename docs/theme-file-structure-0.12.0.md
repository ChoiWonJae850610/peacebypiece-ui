# PeaceByPiece 0.12.0 theme file structure 1차 분리

## 목적

작업지시서 화면에서 먼저 정리한 semantic token을 프로젝트 전체 테마 구조로 확장하기 위한 1차 파일 구조를 추가했다.

이번 버전은 실제 개인 환경설정 UI와 연결하지 않는다. 현재 화면 색상은 기존처럼 `app/globals.css`의 `:root` CSS 변수에서 적용된다.

## 추가 구조

- `lib/theme/themeTypes.ts`
  - 테마 ID, 테마 tone, CSS 변수 map, 테마 정의 타입을 선언한다.
- `lib/theme/themes/defaultLight.ts`
  - 현재 `app/globals.css`의 기본 `:root` 변수값을 `default-light` 테마 정의로 보관한다.
- `lib/theme/themeRegistry.ts`
  - 현재 사용할 수 있는 테마 registry와 fallback resolver를 제공한다.
- `lib/theme/semanticThemeTokens.ts`
  - 작업지시서 semantic token 적용 범위에 이어 theme file 구조 계획을 기록한다.

## 현재 규칙

컴포넌트는 실제 색상명이나 색상값을 직접 의존하지 않는다.

예:

- 금지 방향: `bg-blue-50`, `text-emerald-700`, `border-stone-300`
- 권장 방향: `pbp-action-primary`, `pbp-field-selectable`, `pbp-workorder-calculated-cell`, `pbp-empty-state`

## 테마 확장 방향

추후 테마는 `blue`, `emerald` 같은 단순 색상 선택이 아니라 전체 분위기와 의미 색상을 묶은 theme definition으로 추가한다.

예상 후보:

- `beige-atelier`
- `cold-winter`
- `black-and-white`

각 테마는 동일한 CSS 변수 key를 가지며 값만 다르게 둔다.

## 동기화 주의

현재는 runtime theme injection이 연결되지 않았으므로 아래 두 곳을 동기화해야 한다.

- `app/globals.css`의 `:root`
- `lib/theme/themes/defaultLight.ts`의 `cssVariables`

후속 버전에서 개인 환경설정과 연결할 때는 theme definition의 `cssVariables`를 document root에 주입하거나, 서버/클라이언트 boundary에 맞는 theme provider를 두는 방향으로 확장한다.
