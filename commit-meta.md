# Commit Meta

## Version
0.8.1 → 0.8.2

## Summary
실제 사용자 계정 전환 테스트 연결

## Description
작업지시서 DB 로드 시 관리자 사용자/권한 조회 API를 함께 사용해 실제 사용자 목록이 있으면 작업지시서 권한 테스트 사용자로 반영되도록 연결함.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.8.2로 갱신.
- lib/repositories/dbWorkorderHttpAdapter.ts: 작업지시서 DB 로드 시 사용자/권한 API를 조회하고 현재 사용자/권한 테스트 대상을 실제 사용자 목록 기준으로 보정.
- commit-meta.md: 모바일 최소 응답용 작업 상세 기록 갱신.

## 추가 파일 목록
없음

## 삭제 파일 목록
없음

## 작업 상세 내용
- /api/admin/settings/users 응답을 작업지시서 workspace 로드 단계에서 함께 조회하도록 추가함.
- DB 사용자 목록이 있으면 persisted/mock 사용자보다 우선 적용함.
- 저장되어 있던 currentUserId 또는 permissionTargetUserId가 실제 사용자 목록에 없으면 첫 번째 실제 사용자로 안전하게 보정함.
- 사용자 API 조회 실패 시 기존 persisted/mock fallback 흐름을 그대로 유지함.
- UI, 권한 policy, actionFlow, package.json, package-lock.json은 수정하지 않음.
