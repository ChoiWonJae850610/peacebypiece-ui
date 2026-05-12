# 0.11.15 시스템 감사 로그 테이블 공통화

## 목적

시스템관리자 감사 로그 화면에 남아 있던 직접 `<table>` 구현을 `AdminTable` 공통 컴포넌트 기준으로 전환한다.

## 변경 범위

- 감사 로그 조회 결과 테이블을 `AdminTable`로 전환
- 감사 로그 스키마 필드 테이블을 `AdminTable`로 전환
- severity / required 라벨은 기존 `AdminStatusBadge` 유지
- 감사 로그 API, DB schema, 필터, 조회 로직은 변경하지 않음

## 제외

- 테이블 정렬 기능 추가
- pagination 추가
- 감사 로그 DB 구조 변경
- audit log 쓰기 로직 변경
