# 0.11.7 시스템관리자 고객사 초대/승인 UI 공통 컴포넌트 적용

## 목적

시스템관리자 고객사 초대와 고객사 승인 화면에 남아 있던 개별 버튼, 링크, 상태 라벨, empty state 구현을 관리자 공통 UI 컴포넌트 기준으로 전환한다.

## 변경 범위

- `/system/invites` 고객사 초대 화면
- `/system/companies` 고객사 승인 화면

## 적용 기준

- 버튼: `AdminButton`
- 링크 버튼: `AdminLinkButton`
- 상태 라벨: `AdminStatusBadge`
- empty state: `AdminEmptyState`

## 변경 내용

### 고객사 초대 화면

- 헤더 버전 라벨을 `AdminStatusBadge`로 전환
- 시스템 콘솔 이동 링크를 `AdminLinkButton`으로 전환
- 초대 생성 단계 상태 라벨을 `AdminStatusBadge`로 전환
- 초대 결과 액션 버튼을 `AdminButton` / `AdminLinkButton`으로 전환
- 기존 개별 className 기반 버튼/링크 구현 제거

### 고객사 승인 화면

- 헤더 버전 라벨과 이동 링크를 공통 컴포넌트로 전환
- 가입 신청 조회 상태 라벨을 `AdminStatusBadge`로 전환
- 새로고침 버튼을 `AdminButton`으로 전환
- 로컬 `EmptyState` 구현을 제거하고 `AdminEmptyState`로 전환
- 초대 이메일 비교 라벨을 `AdminStatusBadge`로 전환
- 승인/거절 버튼을 `AdminButton`으로 전환
- 승인 단계 라벨과 기본 권한 라벨을 `AdminStatusBadge`로 전환
- 승인 액션 버튼/링크를 공통 컴포넌트로 전환

## 제외한 내용

- DB 변경 없음
- API 변경 없음
- 고객사 승인/거절 로직 변경 없음
- 초대 생성 로직 변경 없음
- 시스템관리자 다른 개별 페이지는 다음 단계에서 처리

## 확인 항목

- `/system/invites` 초대 생성 버튼 표시와 동작
- `/system/invites` 초대 링크 복사 버튼 표시와 동작
- `/system/companies` 새로고침 버튼 표시와 동작
- `/system/companies` 승인/거절 버튼 표시와 동작
- 고객사 가입 신청이 없을 때 empty state 표시
