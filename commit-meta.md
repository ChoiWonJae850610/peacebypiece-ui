# Commit Meta

## Version
0.9.2 → 0.9.3

## Summary
관리자 화면 내부 용어 제거 1차

## Description
고객사 관리자 화면에 노출될 수 있는 mock, fallback, adapter, repository 경로성 문구를 운영용 한국어 문구로 정리했습니다. 관리자 DB 점검 패널의 저장소 모드 표시와 점검 항목 설명을 고객사 운영자가 이해 가능한 표현으로 변경하고 APP_VERSION을 0.9.3으로 갱신했습니다.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.3으로 갱신.
- lib/i18n/ko/admin.ts: 관리자 DB 점검과 사용자 권한 테스트 영역의 내부 용어 표시 문구를 운영용 한국어로 변경.
- lib/i18n/en/admin.ts: ko/admin.ts와 동일한 키의 영문 문구를 동기화.
- lib/admin/dbCompletionAudit.ts: DB 점검 항목의 fallback/mock/repository/file-path 성격 문구를 고객사 운영용 문구로 변경.
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx: 저장소 모드 배지를 workorder=db 같은 내부 표현 대신 작업지시서/협력업체/메모·첨부 실제 DB 또는 테스트 데이터 표현으로 변경.

## 추가 파일 목록
- 없음

## 삭제 파일 목록
- 없음

## 작업 상세 내용
- 고객사 관리자 화면에 직접 노출될 가능성이 높은 영어 내부 용어를 우선 정리했습니다.
- DB 점검 패널의 read/write/fallback/nextCheck 설명에서 route, repository, snapshot, mock 같은 개발자용 표현을 제거했습니다.
- 사용자/권한 테스트 패널의 sourceState 라벨에서 mock/fallback/adapter 표현을 제거했습니다.
- 기능 변경, UI 구조 변경, 권한 로직 변경은 하지 않았습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.
- node_modules가 포함되지 않은 압축 원본이라 npm run build는 실행하지 않았습니다.

## 다음 권장 작업
0.9.4 — 관리자 i18n 잔여 정리 2차
