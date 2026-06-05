# 0.18.51 관리자 반응형 테이블 shell/button 공통화

## 목적

저장소관리와 협력업체관리의 wide table 외곽 모서리, 테두리, header, row 표현이 다르게 보이는 문제를 줄이기 위해 공통 AdminResponsiveTableShell을 추가했습니다.

## 반영 내용

- 저장소관리 wide table과 협력업체관리 wide table이 같은 shell class를 사용하도록 정리했습니다.
- 공통 shell은 rounded, border, overflow-hidden, surface 배경을 담당합니다.
- header/row 스타일 기준을 저장소관리 쪽의 밀도에 맞게 유지했습니다.
- 협력업체관리의 `+ 업체 추가` 버튼은 큰 primary 버튼에서 compact create action 버튼으로 축소했습니다.
- 저장소관리/협력업체관리 데이터, 필터, 모달, 저장 흐름은 변경하지 않았습니다.

## 유지 사항

- WorkspaceShell 스크롤 구조 변경 없음
- DB/API/R2/휴지통/협력업체 저장 흐름 변경 없음
- compact card 구조 변경 없음
