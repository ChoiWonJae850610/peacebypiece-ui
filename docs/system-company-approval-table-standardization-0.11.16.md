# 0.11.16 시스템 고객사 승인 테이블 공통 UI 적용

## 목적

시스템관리자 고객사 승인 화면의 가입 신청 검토 목록에 남아 있던 직접 `<table>` 구현을 `AdminTable` 공통 컴포넌트 기준으로 전환한다.

## 반영 내용

- `/system/companies` 가입 신청 검토 목록을 `AdminTable`로 전환
- 회사, 신청자, 초대 이메일, 이메일 비교, 연락처, 메모, 신청일, 처리 컬럼을 `AdminTableColumn`으로 구성
- 로딩 상태는 `AdminTable`의 `isLoading` / `loadingLabel`로 표시
- 데이터 없음 상태는 `AdminTable`의 `emptyLabel`로 표시
- 승인/거절 버튼, 이메일 비교 라벨은 기존 `AdminButton` / `AdminStatusBadge` 유지

## 제외 범위

- 고객사 승인/거절 API 변경 없음
- join_requests 조회 조건 변경 없음
- DB schema 변경 없음
- 승인 처리 단계/기본 권한/처리 정책 카드 변경 없음
- pagination, sorting 추가 없음

## 확인

- `/system/companies` 진입
- 가입 신청 검토 목록 표시 확인
- 가입 신청 없음 상태 확인
- 로딩 상태 확인
- 승인/거절 버튼 동작 확인
