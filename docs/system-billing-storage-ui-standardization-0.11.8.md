# 0.11.8 시스템관리자 요금제·저장소 UI 공통 컴포넌트 적용

## 목적

시스템관리자 개별 페이지에 남아 있던 className 기반 버튼과 상태 라벨을 관리자 공통 UI 컴포넌트 기준으로 단계적으로 전환한다.

## 적용 범위

- `/system/billing`
- `/system/storage-usage`
- 시스템 홈의 저장소 삭제 후보 진입 카드

## 변경 내용

1. `/system/billing`
   - 헤더 버전 라벨을 `AdminStatusBadge`로 전환했다.
   - 시스템 콘솔 이동 링크를 `AdminLinkButton`으로 전환했다.
   - 요금제/정책/preview/고객사 상태 라벨을 `AdminStatusBadge`로 전환했다.
   - 준비중 버튼을 `AdminButton`으로 전환했다.

2. `/system/storage-usage`
   - 헤더 버전 라벨을 `AdminStatusBadge`로 전환했다.
   - 시스템 콘솔 이동 링크를 `AdminLinkButton`으로 전환했다.
   - 삭제 후보 목록의 새로고침/선택 삭제/전체 삭제 버튼을 `AdminButton`으로 전환했다.
   - 삭제 후보 없음 상태를 `AdminEmptyState`로 전환했다.
   - purge 상태 라벨을 `AdminStatusBadge`로 전환했다.

3. `SystemStoragePurgeButton`
   - 저장소 삭제 후보 목록 진입 링크를 `AdminLinkButton`으로 전환했다.

## 제외한 범위

- 저장소 purge API 변경 없음
- R2 삭제 처리 흐름 변경 없음
- 정렬 header 버튼 변경 없음
- checkbox 동작 변경 없음
- billing 실제 저장 API 연결 없음
