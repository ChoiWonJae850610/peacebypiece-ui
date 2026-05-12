# 0.11.13 시스템 감사 로그 화면 공통 UI 적용

## 목표

시스템관리자 감사 로그 화면에서 직접 작성된 버튼, 링크, 상태 라벨, empty state 일부를 관리자 공통 UI 컴포넌트 기준으로 전환한다.

## 변경 범위

- `/system/audit-logs`
- `components/system/audit/SystemAuditLogsDesignPage.tsx`

## 반영 내용

- 헤더의 시스템 홈 링크를 `AdminLinkButton`으로 전환했다.
- 헤더에 `APP_VERSION` 기반 버전 라벨을 `AdminStatusBadge`로 표시했다.
- 조회 버튼을 `AdminButton`으로 전환했다.
- 감사 로그 심각도 라벨을 `AdminStatusBadge`로 전환했다.
- 감사 로그 목록 empty state를 `AdminEmptyState`로 전환했다.
- 감사 대상 분류 level 라벨을 `AdminStatusBadge`로 전환했다.
- audit schema 필수 여부 라벨을 `AdminStatusBadge`로 전환했다.

## 제외 범위

- 감사 로그 API 변경 없음
- audit_logs DB schema 변경 없음
- 필터 파라미터 처리 변경 없음
- 실제 로그 기록 로직 변경 없음
- 테이블 구조 자체의 컴포넌트화는 후속 작업으로 분리

## 확인 항목

- `/system/audit-logs` 화면이 정상 표시되는지 확인한다.
- 검색 form의 조회 버튼이 정상 동작하는지 확인한다.
- 감사 로그가 없을 때 empty state가 표시되는지 확인한다.
- 로그 severity 라벨이 기존 의미를 유지하는지 확인한다.
- 시스템 홈 링크 이동이 유지되는지 확인한다.
