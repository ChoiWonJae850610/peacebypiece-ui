# 0.12.7 개인 설정 theme 적용 회귀 보정

## 목적

0.12.6에서 `/me/settings`의 개인 theme 선택 구조와 사람 아이콘 진입점을 추가한 뒤, theme 전환 시 직접 색상 class가 남아 있던 공통 진입 영역을 보정했다.

## 반영 범위

- `PbpThemeProvider` 초기 client state가 localStorage의 개인 theme id를 우선 읽도록 보정
- 관리자 topbar의 header, chip, icon button을 theme semantic class 기준으로 정리
- 작업지시서 mobile topbar의 header와 icon button을 theme semantic class 기준으로 정리
- 작업지시서 PC sidebar 상단의 회사명/버전/요약 문구 tone을 theme variable 기준으로 정리
- 개인 설정 summary의 주요/보조 action button을 semantic action class 기준으로 정리
- theme 회귀 확인 항목을 `semanticThemeTokens.ts`에 기록

## 확인 기준

1. `/me/settings`에서 `default-light`와 `beige-atelier`를 전환한다.
2. 새로고침 후 선택 theme가 유지되는지 확인한다.
3. 관리자 화면에서 사람 아이콘은 `/me/settings`, 톱니바퀴는 `/admin/settings`로 이동하는지 확인한다.
4. 작업지시서 PC sidebar와 mobile topbar에서 사람 아이콘이 `/me/settings`로 이동하는지 확인한다.
5. theme 변경 후 관리자 topbar, 작업지시서 topbar, 개인 설정 summary action이 이전 stone/bg-white 고정 tone처럼 남아 있지 않은지 확인한다.

## 미포함

- DB 기반 사용자 설정 저장
- 추가 theme file 확장
- 개별 화면의 모든 직접 색상 class 제거
- 사용자/권한별 theme 정책
