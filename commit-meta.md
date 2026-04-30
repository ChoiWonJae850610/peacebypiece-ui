# Commit Metadata

## Version
0.9.7 → 0.9.8

## Summary
관리자 mock/seed/fallback 제거 가능 범위 판정 추가

## Description
관리자 완료 검증에 mock/seed 정리 항목을 추가하고, 고객사 관리자 화면에서 제거 가능한 mock 표시와 유지가 필요한 seed/fallback 범위를 구분했습니다. 앱 버전은 0.9.8로 갱신했습니다.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.8로 갱신했습니다.
- lib/admin/completionAudit.ts: 관리자 완료 검증에 mock/seed 정리 항목과 집계값을 추가했습니다.
- components/admin/dashboard/AdminAuditSummarySection.tsx: 관리자 점검 요약 칩에 mock 정리 현황을 추가했습니다.
- components/admin/dashboard/AdminCompletionAuditPanel.tsx: 완료 검증 패널의 집계 영역에 mock 정리 현황을 추가했습니다.

## 추가 파일 목록
- lib/admin/mockDataAudit.ts: mock 제거 가능 항목, seed 유지 항목, fallback 유지 항목을 분류하는 관리자 점검 데이터를 추가했습니다.

## 삭제 파일 목록
- 없음

## 작업 상세 내용
- 고객사 관리자 화면에서 제거 가능한 mock 데이터와 아직 유지해야 하는 seed/fallback 데이터를 구분했습니다.
- 시스템 관리자 샘플 화면, 권한 미리보기, 협력업체 기본값, 운영 통계 대체 표시, 작업지시서 fixture를 각각 remove-ready/seed-retained/fallback-retained로 분류했습니다.
- 관리자 완료 검증의 watch 판단에 mock/seed 정리 상태를 포함했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.

## 검증
- node_modules가 없어 로컬 빌드는 수행하지 못했습니다.
