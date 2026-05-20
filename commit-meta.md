Version : 0.15.12
Summary : Workspace와 Worker 화면 구조 점검 및 workspace shell token 정리
Description : Workspace/Worker 화면의 A-TYPE 적용 전 구조를 문서화하고, MemberWorkspaceShell과 MemberWorkspaceHome의 raw color 표현을 semantic token 기준으로 1차 정리했다. WorkOrderWorkspace는 high risk 영역으로 분리해 기능과 layout은 변경하지 않고 다음 DeviceKind 단계에서 다루도록 기준을 정리했다.
수정 파일 목록 :
- components/workspace/MemberWorkspaceShell.tsx
- components/workspace/MemberWorkspaceHome.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/33_wafl-a-type-workspace-worker-structure-audit.md
삭제 파일 목록 :
- 없음
