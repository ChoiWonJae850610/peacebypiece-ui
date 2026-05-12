# 시스템 접근 체크포인트 화면 공통 UI 적용 — 0.11.14

## 목적

`/system/access-checkpoint` 화면에 남아 있던 개별 버튼/상태 라벨 구현을 관리자 공통 UI 컴포넌트 기준으로 전환한다.

## 변경

- 헤더 버전 라벨을 `AdminStatusBadge`로 전환
- 시스템 홈 이동 링크를 `AdminLinkButton`으로 전환
- 체크포인트 항목 상태 라벨을 `AdminStatusBadge`로 전환
- route 링크를 `AdminLinkButton`으로 전환

## 제외

- 체크포인트 데이터 정의 변경 없음
- 라우트 구조 변경 없음
- API/DB 변경 없음
