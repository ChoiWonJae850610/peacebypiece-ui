# 0.12.6 개인 설정 theme 선택 구조

## 목적

개인 설정(`/me/settings`)에서 사용자가 theme id를 선택하고, `PbpThemeProvider`가 localStorage의 개인 설정 theme 값을 읽어 document root CSS variables에 적용하도록 연결했다.

## 진입 구조

- 관리자 화면
  - 홈 아이콘: `/admin`
  - 사람 아이콘: `/me/settings`
  - 톱니바퀴: `/admin/settings`
- 작업지시서/멤버 업무 화면
  - 사람 아이콘: `/me/settings`
  - 톱니바퀴는 개발 전용 사용자 변경 도구 외에는 노출하지 않는다.

## 저장 구조

현재는 로그인/사용자별 DB 저장 전 단계이므로 개인 설정은 브라우저 localStorage에 저장한다.

- key: `peacebypiece.personal.settings`
- theme field: `default-light` 또는 `beige-atelier`
- 후속 단계: 로그인 도입 후 사용자 설정 DB로 이전 가능

## theme 구조

이번 버전에서 테스트용 theme를 하나 추가했다.

- `default-light`: 기본 밝은 테마
- `beige-atelier`: 베이지 계열 테스트 테마

`beige-atelier`는 `default-light`의 CSS variables를 상속하고, surface/action/field/modal/sidepanel 등 주요 semantic variables만 덮어쓴다.

## 적용 범위

- `/me/settings` theme 선택 UI
- `PbpThemeProvider` localStorage theme id 읽기
- personal settings change event 기반 실시간 theme 반영
- 관리자 topbar의 개인 설정 사람 아이콘 추가
- 작업지시서 PC sidebar와 mobile topbar의 개인 설정 사람 아이콘 추가

## 아직 하지 않은 것

- DB 기반 사용자 설정 저장
- SSR에서 사용자별 theme id를 쿠키/DB로 결정
- 추가 theme 대량 등록
- 관리자 회사 환경설정과 개인 theme 선택 통합
