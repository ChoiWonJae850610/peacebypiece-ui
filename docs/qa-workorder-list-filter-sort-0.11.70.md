# 0.11.70 작업지시서 목록 필터/정렬 1차 정리

## 목표

작업지시서 업무 화면의 기본 목록 조회 범위를 줄이고, 상태 필터와 정렬을 목록 쿼리 단계에 반영한다.

## 반영 내용

- `/worker` 기본 목록 상태를 `진행 중(active)`으로 정리했다.
- `active` 상태는 DB summary query에서 `completed` 작업지시서를 제외한다.
- 완료건은 `status=completed` 선택 시 별도로 조회한다.
- 전체 조회는 `status=all` 선택 시 수행한다.
- 상태 필터와 정렬값은 `/worker?status=...&sort=...` query로 유지한다.
- 작업지시서 목록 summary API는 `status`, `sort` query를 받아 DB WHERE/ORDER BY에 반영한다.
- 좌측 목록 검색은 기존처럼 현재 조회된 목록 안에서 client-side 검색으로 유지한다.

## 상태 필터

- 진행 중: `active`
- 전체: `all`
- 완료: `completed`
- 작성중: `draft`
- 검토요청: `review_requested`
- 검토완료: `review_completed`
- 검수/생산: `inspection`
- 반려: `rejected`

## 정렬

- 최근 수정순: `updatedDesc`
- 생성일 최신순: `createdDesc`
- 납기일 빠른순: `dueDateAsc`
- 이름순: `titleAsc`
- 업체명순: `vendorAsc`

## 확인할 점

- `/worker` 기본 진입 시 완료건이 기본 목록에서 제외되는지 확인한다.
- 완료 필터 선택 시 완료건만 조회되는지 확인한다.
- 전체 필터 선택 시 완료건까지 포함되는지 확인한다.
- 상태 필터 변경 후 좌측 목록/상세 선택이 정상 동작하는지 확인한다.
- 정렬 변경 시 URL query와 목록 순서가 같이 바뀌는지 확인한다.
