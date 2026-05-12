# 0.11.17 시스템 저장소 실제 삭제 후보 테이블 공통화

## 변경 목표

`/system/storage-usage`의 실제 삭제 후보 목록을 직접 `<div>` 기반 표 구현에서 관리자 공통 `AdminTable` 컴포넌트 기준으로 정리한다.

## 변경 범위

- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`
  - `AdminTable` / `AdminTableColumn` 적용
  - 선택, 미리보기, 고객사/작업지시서, 대상, 삭제 일정, 용량/상태, key 정보를 column 정의로 분리
  - 기존 정렬 버튼, 선택 checkbox, purge 상태 라벨, source/thumbnail key 표시 유지
  - empty state는 `AdminTable.emptyLabel` 기준으로 통합
- `lib/constants/app.ts`
  - `APP_VERSION`을 `0.11.17`로 갱신

## 비변경 범위

- `/api/system/storage-usage/purge` API 변경 없음
- R2 실제 삭제 로직 변경 없음
- 삭제 후보 조회 조건 변경 없음
- 선택 삭제 / 전체 삭제 confirm 문구 변경 없음
- 정렬 기준 및 정렬 방향 변경 없음
- DB schema 변경 없음

## 확인 포인트

1. `/system/storage-usage` 진입
2. 실제 삭제 후보 목록 표시 확인
3. 헤더 정렬 버튼 동작 확인
4. 후보 선택 checkbox 동작 확인
5. 선택 삭제 / 전체 삭제 버튼 활성화 조건 확인
6. 후보가 없을 때 빈 목록 문구 확인
