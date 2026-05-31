# 0.18.55 협력업체관리 소스 정리 및 빌드 오류 보정

## 목적

0.18.54 기준 빌드 실패 원인을 보정하고, 협력업체관리 필터 영역의 책임을 분리한다.

## 반영 내용

- `AdminMemberDirectoryResponsiveRows`의 compact metadata label 타입을 `ReactNode`로 보정했다.
- 빌드 로그에서 확인된 `AdminTableColumn.label` 타입 불일치를 수정했다.
- `PartnerMasterFilters`의 검색 필드, select 필드, 상태 옵션 생성을 `PartnerMasterFilterControls`로 분리했다.
- 협력업체관리 검색/필터 UI 동작과 배치는 유지했다.

## 유지 사항

- WorkspaceShell 스크롤 구조 변경 없음
- 협력업체 DB/API 저장 흐름 변경 없음
- 멤버관리 승인/거절/상세 모달 흐름 변경 없음
- 저장소관리 흐름 변경 없음
