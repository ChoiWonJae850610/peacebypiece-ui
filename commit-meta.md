Version :
0.15.35

Summary :
member storage 상태 상수와 workorder 상태 정리 후보 문서화

Description :
멤버 관리 상태와 저장소 lifecycle/purge 상태를 도메인 상수와 normalize helper로 1차 분리했다. 멤버 관리 repository와 route의 일부 직접 문자열 비교를 상수 기반으로 바꾸고, 저장소 파일 lifecycle selector를 공통 helper로 위임했다. 작업지시서 상태는 기존 workorderStates 기준을 유지하고 후속 정리 후보로 문서화했다.

수정 파일 목록 :
- lib/admin/members/memberRepository.ts
- lib/admin/members/memberRouteHandlers.ts
- lib/admin/members/memberWorkspaceAccess.ts
- lib/admin/files/selectors.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- lib/domain/memberStatus.ts
- lib/domain/storageStatus.ts
- docs/wafl-a-type/58_wafl-a-type-member-workorder-storage-status-candidates.md

삭제 파일 목록 :
없음
