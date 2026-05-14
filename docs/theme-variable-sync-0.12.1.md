# 0.12.1 theme file 구조와 globals.css 변수 동기화 점검

## 목적

0.12.0에서 추가한 `lib/theme/themes/defaultLight.ts`와 현재 런타임 CSS 변수 mirror인 `app/globals.css :root`의 동기화 상태를 점검했다.

이번 버전은 실제 테마 선택 UI를 연결하지 않는다. 작업지시서 semantic class가 이후 테마 파일 구조로 자연스럽게 이동할 수 있도록 기본 테마 변수 동기화 기준만 보강한다.

## 확인 결과

- `defaultLight.ts`의 `cssVariables` 변수 수: 100개
- `app/globals.css :root` 변수 수: 100개
- `defaultLight.ts`에는 있으나 `globals.css`에 없는 변수: 없음
- `globals.css`에는 있으나 `defaultLight.ts`에 없는 변수: 없음
- 동일 변수명의 값 차이: 없음

즉, 0.12.1 기준으로 `default-light` theme file과 `app/globals.css :root` mirror는 동기화되어 있다.

## 추가한 코드 기준

### `lib/theme/themeVariableSync.ts`

동적 테마 적용 전 단계에서 theme file과 runtime mirror를 점검할 수 있는 기준을 추가했다.

- `DEFAULT_THEME_RUNTIME_MIRROR_SOURCE`
- `DEFAULT_THEME_RUNTIME_MIRROR_TARGET`
- `DEFAULT_LIGHT_THEME_VARIABLE_NAMES`
- `DEFAULT_LIGHT_THEME_VARIABLE_COUNT`
- `buildDefaultThemeVariableSyncReport`
- `DEFAULT_THEME_SYNC_RULES`

이 파일은 현재 UI에 직접 연결하지 않는다. 후속 테마 provider 또는 진단 화면에서 재사용할 수 있는 점검 기준이다.

### `lib/theme/semanticThemeTokens.ts`

`PBP_THEME_VARIABLE_SYNC_CHECKS`를 추가해 0.12.1 기준 동기화 결과와 동적 테마 적용 전 남은 작업을 코드 기준으로 남겼다.

## 유지 규칙

새 semantic CSS 변수를 추가할 때는 아래 두 곳을 함께 갱신해야 한다.

1. `lib/theme/themes/defaultLight.ts`
2. `app/globals.css :root`

동적 테마 적용 provider가 연결되기 전까지는 `app/globals.css :root`가 실제 런타임 기본값이고, `defaultLight.ts`는 테마 파일 구조의 source 역할을 한다.

## 다음 작업 후보

0.12.2에서는 실제 테마 추가 전에 아래 항목을 정리하는 것이 적절하다.

- 작업지시서 기본정보 수정 modal field tone
- 검수/발주 action section workflow button tone
- 비용 요약 카드 tone
- header/detail summary card tone
- theme provider 연결 전 개인 설정 theme id 저장 위치 설계
