# 0.18.40 협력업체관리 목록 컨테이너 폭 기준 반응형 전환

## 목적

저장소관리 휴지통에서 검증한 `실제 컨테이너 폭 기준 wide table / narrow compact list` 구조를 협력업체관리 목록에 1차 적용한다.

## 반영 기준

- 브라우저 전체 폭 또는 장비명 기준이 아니라 협력업체 목록 컨테이너의 실제 폭을 기준으로 한다.
- 컨테이너 폭이 1080px 이상이면 기존 table row 구조를 유지한다.
- 컨테이너 폭이 1080px 미만이면 compact list-card 구조로 표시한다.
- PC/tablet/mobile을 직접 구분하지 않고 실제 사용 가능한 목록 폭을 기준으로 렌더링 구조를 선택한다.

## 반영 내용

- `PartnerMasterList`에 `useElementSize` 적용
- wide table과 compact list 렌더링 분기 추가
- compact list 전용 `PartnerMasterResponsiveRows` 추가
- compact list에서도 정렬 버튼 제공
- 협력업체 row 클릭/수정 모달 진입 흐름 유지
- 기존 검색/필터/요약/등록/수정 기능 흐름 변경 없음

## 변경하지 않은 것

- WorkspaceShell 스크롤 구조
- 협력업체 DB/API 저장 흐름
- 협력업체 등록/수정 모달
- 필터 상태/검색 상태 관리
- 권한 처리

## 테스트 포인트

1. PC/넓은 화면에서 기존 table row 형태가 유지되는지 확인한다.
2. 태블릿 세로, iPad mini, 좁은 폭에서 compact list-card 형태로 전환되는지 확인한다.
3. compact list-card에서 이름, 유형, 담당자, 연락처, 이메일, 상태가 읽히는지 확인한다.
4. row 터치/클릭으로 수정 모달이 열리는지 확인한다.
5. 검색/필터/정렬이 기존처럼 동작하는지 확인한다.
