# 0.12.8 개인 theme 적용 범위 회귀 점검 및 추가 theme 후보 정리

## 목적

`default-light`와 `beige-atelier`만으로는 theme provider, semantic token, 공통 UI 적용 범위가 충분히 검증되지 않는다. 0.12.8에서는 차가운 블루 그레이 계열의 `cold-winter` 테스트 테마를 추가해 작업지시서, 관리자 화면, 개인 설정 화면이 실제 theme file 전환을 따라가는지 확인할 수 있게 한다.

## 추가 theme

- `default-light`: 기본 밝은 테마
- `beige-atelier`: 따뜻한 베이지 계열 테스트 테마
- `cold-winter`: 차가운 블루 그레이 계열 테스트 테마

## 적용 범위

- `lib/theme/themeTypes.ts`
  - `PbpThemeId`에 `cold-winter` 추가
- `lib/theme/themes/coldWinter.ts`
  - `DEFAULT_LIGHT_THEME.cssVariables`를 기반으로 주요 semantic CSS variable override
- `lib/theme/themeRegistry.ts`
  - registry와 option 목록에 `cold-winter` 추가
- `lib/i18n/ko/common.ts`, `lib/i18n/en/common.ts`
  - 개인 설정 theme label 추가
- `lib/theme/semanticThemeTokens.ts`
  - 0.12.8 기준 theme 확장 회귀 확인 항목 추가

## 확인 기준

1. `/me/settings`에서 `Cold Winter`가 표시되어야 한다.
2. `Cold Winter` 선택 시 localStorage에 theme id가 저장되어야 한다.
3. 새로고침 후에도 `Cold Winter`가 유지되어야 한다.
4. 작업지시서 화면의 목록, 발주정보, 생산구성, 우측 패널 tone이 변경되어야 한다.
5. 관리자 홈과 topbar, 공통 button/card tone이 변경되어야 한다.
6. 모달 overlay/surface/section/footer action tone이 theme variable을 따라야 한다.

## 아직 하지 않은 것

- DB 기반 사용자 설정 저장
- black-and-white 고대비 theme 추가
- 직접 Tailwind 색상 class가 남은 모든 개별 화면 전수 수정
