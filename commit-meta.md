Version : 0.15.2
Summary : AdminShell과 SystemShell 책임 분리 기준 정리
Description : 고객사 관리자 AdminShell의 raw background를 A-TYPE token 기준으로 보정하고 시스템관리자 전용 SystemShell wrapper를 추가해 /system 홈에 1차 적용했다. route layout과 shell의 책임을 분리하는 문서를 추가하고 A-TYPE 문서 인덱스와 로드맵을 0.15.2 기준으로 갱신했다.
수정 파일 목록 :
- components/admin/layout/AdminShell.tsx
- components/system/SystemConsoleShell.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- components/system/layout/SystemShell.tsx
- docs/wafl-a-type/23_wafl-a-type-shell-responsibility.md
삭제 파일 목록 :
- 없음
