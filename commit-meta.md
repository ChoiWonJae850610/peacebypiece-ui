Version : 0.18.32
Summary : 저장소 휴지통 컨테이너 기준 반응형 전환
Description : 저장소관리 휴지통 목록을 실제 목록 컨테이너 폭 기준으로 wide table과 narrow compact list 렌더링으로 분리했습니다. ResizeObserver 기반 useElementSize 훅을 추가하고, PC/넓은 태블릿 가로는 table row, 좁은 태블릿/모바일은 compact list-card를 사용하도록 보정했습니다. WorkspaceShell 스크롤 구조와 DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/FileTrashSection.tsx
추가 파일 목록 :
- lib/responsive/useElementSize.ts
- components/admin/files/FileTrashResponsiveRows.tsx
- docs/storage-trash-container-responsive-0.18.32.md
삭제 파일 목록 :
- 없음
