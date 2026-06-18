# 0.23.61 관리자·시스템관리자 잔여 API 경계 정리

## 목적

시스템관리자 화면에 남아 있던 직접 fetch 2건과 관리자 파일 관리 화면의 직접 snapshot fetch를 WAFL API 경계로 통일하고, 고객사 초대 생성에 공통 mutation lock과 sequence/revision을 적용한다.

## 적용 내용

- SystemCustomerInviteSkeleton 초대 생성을 `waflLegacyApiRequest` + `useWaflMutation`으로 전환
- 초대 생성 중 동일 요청 중복 실행 차단
- 초대 응답의 `inviteUrl`, `rawToken` 필수값 검증
- 초대 이메일 native input을 `WaflInput`으로 전환
- SystemStoragePurgeCandidatesClient의 purge 요청을 공통 API client로 전환
- AdminFilesWorkspaceClient의 snapshot 조회를 공통 API client로 전환
- 외부 R2 presigned upload 등 저수준 저장소 경계는 직접 fetch 유지

## 감사 결과

- 시스템관리자 직접 fetch: 2건 → 0건
- 시스템관리자 native control 참고 지표: 22건 → 21건
- 관리자 직접 fetch: 15건 → 14건
- 고위험 전체 엔터티 캐스팅: 0건 유지

## 위험 요소

- 시스템 저장소 삭제의 native confirm은 삭제 범위가 크므로 이번 버전에서는 동작을 유지했다. 후속 UI 감사에서 WAFL ConfirmModal 전환 여부를 확정한다.
- 관리자 파일 actionFlow와 외부 R2 upload의 fetch는 저수준 API/storage adapter 경계이므로 화면 직접 호출과 구분해 유지한다.

## 테스트

- WAFL UI Source Audit 성공
- WAFL Mutation Async Audit strict 성공
- npm run build 미실행 — 사용자가 로컬에서 확인
- DB/API Smoke, Permissions, E2E 미실행
