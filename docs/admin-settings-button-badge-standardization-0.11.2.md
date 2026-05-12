# 0.11.2 관리자 설정 화면 버튼/라벨 공통화 2차

## 목적

관리자 공통 UI 컴포넌트 표준화 흐름에 맞춰 고객관리자 환경설정 관련 화면에 남아 있던 개별 버튼/상태 라벨 구현을 `AdminButton`과 `AdminStatusBadge`로 단계적으로 전환한다.

## 변경 범위

- `AdminCompanySettingsForm`
  - 저장 상태 라벨을 `AdminStatusBadge`로 전환
  - 헤더 새로고침 버튼을 `AdminButton` 기반으로 전환
- `AdminUserAccessPreview`
  - 권한 플래그 라벨을 `AdminStatusBadge`로 전환
  - source 상태 라벨을 `AdminStatusBadge`로 전환
  - 권한 체크리스트 상태 라벨을 `AdminStatusBadge`로 전환
  - 역할 관리/초기화/닫기 버튼을 `AdminButton`으로 전환
  - 역할 선택 버튼을 `AdminButton`으로 전환

## 제외 범위

- DB/API/저장 로직 변경 없음
- 시스템관리자 개별 페이지 버튼 전환 없음
- Calendar/DatePicker/Table/List 표준화 없음
- 모바일/태블릿 대응 없음

## 후속 작업

다음 단계에서는 `/admin/files`, `/admin/members`, `/system/*` 화면에 남아 있는 className 기반 버튼을 기능 단위로 나누어 `AdminButton`으로 전환한다.
