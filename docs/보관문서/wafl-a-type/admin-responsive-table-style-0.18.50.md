# 0.18.50 Admin responsive table style cleanup

## 목적

저장소관리 휴지통 wide table/list 스타일을 기준으로 협력업체관리 목록 row 표현을 맞추기 위한 1차 공통 스타일 정리입니다.

## 반영 범위

- `components/admin/common/responsiveTable/adminResponsiveTableStyles.ts` 추가
- 저장소관리 휴지통 wide table / compact card 일부 스타일을 공통 스타일 상수로 연결
- 협력업체관리 wide table / compact card 일부 스타일을 공통 스타일 상수로 연결

## 유지한 범위

- container width 기준 wide/compact 전환 기준 유지
- 저장소관리 휴지통 복원/삭제/비우기 기능 유지
- 협력업체관리 검색/필터/정렬/등록/수정 흐름 유지
- WorkspaceShell 스크롤 구조 변경 없음
- DB/API/R2 흐름 변경 없음

## 후속

- 0.18.51 이후 멤버관리 목록에 같은 responsive table/list 스타일 기준 적용 가능
- 화면별 데이터 구조가 다르므로, 공통 컴포넌트 완전 통합은 row style 안정 후 진행
