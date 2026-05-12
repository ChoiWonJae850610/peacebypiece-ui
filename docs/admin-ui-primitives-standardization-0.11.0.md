# 0.11.0 Admin UI primitives standardization 1차

## 목적

제품화 리팩토링 단계에서 관리자 화면의 라벨/상태/empty 상태 표현을 화면별 하드코딩에서 공통 컴포넌트로 이동하기 시작한다.

## 추가한 공통 컴포넌트

- `components/admin/common/AdminStatusBadge.tsx`
  - 관리자 화면에서 사용하는 상태 라벨/버전 pill/읽기 전용 라벨을 통일한다.
  - tone: `neutral`, `primary`, `info`, `success`, `warning`, `danger`, `maintenance`, `inverse`
  - size: `xs`, `sm`

- `components/admin/common/AdminEmptyState.tsx`
  - 관리자 화면에서 사용하는 빈 상태, 로딩 상태, 실패 상태의 기본 표현을 통일한다.
  - tone: `neutral`, `danger`, `warning`

## 이번 버전에서 적용한 화면

- `/system`
  - 시스템관리자 홈 카드의 상태 라벨을 `AdminStatusBadge`로 전환했다.
  - 헤더의 버전 pill도 `AdminStatusBadge`로 전환했다.

- `/admin/settings`
  - 환경설정 메뉴 카드의 상태 라벨을 `AdminStatusBadge`로 전환했다.
  - 회사 설정 로딩/실패 안내를 `AdminEmptyState`로 전환했다.
  - 요금제/계정 모달 내부의 일부 상태 라벨을 `AdminStatusBadge`로 전환했다.

## 후속 기준

다음 UI 정리 작업에서는 아래 순서로 확장한다.

1. Admin Button class 표준화
2. Modal footer/action 표준화
3. Calendar/DatePicker 표준화
4. Table/List empty/loading/error 상태 표준화
5. 작업지시서/저장소/통계 화면의 badge 라벨 통합

## 주의

이번 버전은 공통 컴포넌트 도입과 일부 적용만 포함한다. 화면 구조, API, DB, 저장 로직은 변경하지 않는다.
