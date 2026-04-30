# Commit Meta

## Version
0.9.0 → 0.9.1

## Summary
고객사 초대/승인 플로우 UI 기준 정리

## Description
/system 홈 화면에 고객사 관리자 초대 생성, 발송, 수락, 만료 처리 흐름을 표시하는 초대/승인 플로우 영역을 추가하고 초대 상태 카드의 관리 정보를 확장함.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.1로 갱신.
- lib/data/domain/system.ts: 시스템 초대 상태, 액션, 플로우 단계 타입 추가.
- lib/data/sample/system.ts: 초대/승인 플로우 단계와 확장된 초대 상태 샘플 데이터 추가.
- lib/i18n/ko/system.ts: 초대 토큰, 링크, 요청자, 수락 일시, 플로우 문구 추가.
- lib/i18n/en/system.ts: 동일 시스템 초대 문구 영문 동기화.
- app/system/page.tsx: /system 홈에 초대/승인 플로우 섹션과 확장 초대 상태 카드 UI 반영.
- commit-meta.md: 모바일 최소 응답용 작업 상세 기록 갱신.

## 추가 파일 목록
없음

## 삭제 파일 목록
없음

## 작업 상세 내용
- 0.9.1 목표인 고객사 초대/승인 플로우의 기준 화면을 /system에 추가함.
- 초대 생성, 초대 발송, 초대 수락, 만료/재발송 단계를 별도 카드로 표시함.
- 초대 상태 카드에 이메일, 토큰 미리보기, 초대 링크 상태, 요청자, 수락 일시, 만료 상태를 표시함.
- 초대 상태별 버튼 액션 표시 기준을 샘플 데이터로 분리함.
- 실제 DB 저장/발송 로직은 추가하지 않았고, 다음 단계에서 route/repository 연결 대상으로 남김.
- 작업지시서 권한/상태/actionFlow, package.json, package-lock.json은 수정하지 않음.
- node_modules 부재로 로컬 빌드 검증은 수행하지 못함.
