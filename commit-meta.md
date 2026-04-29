# Commit Meta

## Version
0.6.6431 → 0.6.6432

## Summary
관리자 DB 연결 상태 표시 기준 정리

## Description
관리자 DB 점검 패널에서 화면별 상태를 단순 DB 연결로 표시하지 않고 실제 DB 조회와 fallback 보호, DB 준비 + fallback 상태로 구분하도록 정리했다. 사이드바의 개발용 DB 뱃지도 오해가 적도록 DB 상태 점검 문구로 변경하고 앱 버전을 0.6.6432로 동기화했다.

## 수정 파일 목록
- lib/constants/app.ts — APP_VERSION을 0.6.6432로 갱신
- lib/admin/dbCompletionAudit.ts — 관리자 화면별 DB 상태 분류에 sourceType을 추가하고 상태 라벨을 DB+fallback / DB 준비 기준으로 정리
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx — DB 점검 패널에 상태 뱃지와 실제 분류 뱃지를 함께 표시
- components/admin/layout/AdminSidebar.tsx — 개발용 사이드바 DB 뱃지 문구를 DB 상태 점검으로 변경
- lib/i18n/ko/admin.ts — navigation.dbConnected 문구를 DB 상태 점검으로 변경
- lib/i18n/en/admin.ts — navigation.dbConnected 영문 문구를 DB status audit으로 변경

## 추가 파일 목록
- 없음

## 삭제 파일 목록
- 없음

## 작업 상세 내용
- 관리자 운영 대시보드, 통계, 히스토리, 환경설정은 실제 DB 조회 경로가 있으나 실패 시 fallback이 동작하므로 DB+fallback 상태로 낮춰 표시했다.
- 저장소 관리와 거래처/공장 관리는 DB 경로와 fallback 경계가 함께 존재하므로 DB 준비 + fallback으로 표시했다.
- mock only 상태 타입은 추후 완전 mock 화면이 발견될 때 사용할 수 있도록 타입과 라벨만 준비했다.
- UI 구조와 기능 흐름은 변경하지 않았다.
- package.json / package-lock.json은 수정하지 않았다.
- node_modules가 없어 로컬 build 검증은 수행하지 않았다.
