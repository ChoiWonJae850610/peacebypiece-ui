# Commit Meta

## Version
0.8.2 → 0.9.0

## Summary
시스템 관리자 라우트 운영 구조 정리

## Description
/system 홈 화면에 고객사 승인/생성, 요금제/용량 관리, 시스템 관리자 권한, 고객사 초대 상태를 점검할 수 있는 운영 준비 영역을 추가하고 앱 버전을 0.9.0으로 갱신함.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.0으로 갱신.
- lib/data/domain/system.ts: 시스템 운영 항목과 초대 상태 요약 타입 추가.
- lib/data/sample/system.ts: 시스템 운영 준비 항목과 고객사 초대 상태 샘플 데이터 추가.
- lib/i18n/ko/system.ts: 시스템 운영 준비와 고객사 초대 상태 섹션 문구 추가.
- lib/i18n/en/system.ts: 동일 시스템 섹션 문구 영문 동기화.
- app/system/page.tsx: /system 홈에 운영 준비 섹션과 초대 상태 섹션 추가.
- commit-meta.md: 모바일 최소 응답용 작업 상세 기록 갱신.

## 추가 파일 목록
없음

## 삭제 파일 목록
없음

## 작업 상세 내용
- /system 라우트를 시스템 관리자 운영 홈으로 확장하기 위한 기본 섹션을 추가함.
- 고객사 승인/생성, 요금제/용량, 시스템 관리자 권한 분리 항목을 샘플 데이터 기반으로 표시함.
- 고객사 관리자 초대 상태를 별도 카드로 표시해 이후 초대/승인 플로우 작업의 기준 화면을 마련함.
- 기존 분류 규칙 관리 링크와 R2 정리 버튼은 유지함.
- 작업지시서 권한/상태/actionFlow, package.json, package-lock.json은 수정하지 않음.
- node_modules 부재로 로컬 빌드 검증은 수행하지 못함.
