# Commit Meta

## Version
0.8.0 → 0.8.1

## Summary
관리자 환경설정 권한 관리 모달 추가

## Description
관리자 환경설정의 사용자/권한 테스트 패널에 권한 관리 모달을 추가하고 역할 변경 시 중앙 role policy 기준으로 권한 미리보기가 재계산되도록 정리함.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.8.1로 갱신.
- components/admin/settings/AdminUserAccessPreview.tsx: 사용자/권한 패널을 클라이언트 상호작용 구조로 전환하고 권한 관리 모달 및 역할 변경 미리보기 추가.
- lib/i18n/ko/admin.ts: 권한 관리 모달 관련 한글 문구 추가.
- lib/i18n/en/admin.ts: 권한 관리 모달 관련 영문 문구 동기화.
- commit-meta.md: 모바일 최소 응답용 작업 상세 기록 갱신.

## 추가 파일 목록
없음

## 삭제 파일 목록
없음

## 작업 상세 내용
- 환경설정의 사용자/권한 테스트 구조에서 권한 관리 버튼을 제공함.
- 모달 안에서 사용자별 역할을 관리자/디자이너/재고관리 기준으로 변경 테스트할 수 있게 함.
- 역할 변경 결과는 buildUserRoleState를 통해 중앙 role policy 기준으로 권한 뱃지에 즉시 반영되도록 구성함.
- 현재 단계는 로그인/DB 저장 전환 전 검증용이므로 DB 저장 로직은 추가하지 않음.
- package.json 및 package-lock.json은 수정하지 않음.
