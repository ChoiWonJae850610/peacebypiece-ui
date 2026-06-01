# 0.19.04 고객사 관리자 Empty/Loading 상태 공통화 1차

## 목적

고객사 관리자 화면에서 반복되던 목록 Empty/Loading 표시 구조를 `AdminTableState`로 분리한다.
이번 패치는 실제 데이터 조회, 저장, 삭제, 복원, 권한, R2 흐름을 변경하지 않고 목록 상태 표시 마크업만 공통화한다.

## 변경 범위

- `components/admin/common/AdminTableState.tsx` 추가
- `AdminTable`의 loading/empty 표시를 `AdminTableState`로 교체
- 멤버관리 목록의 wide/compact empty/loading 표시를 같은 컴포넌트로 교체
- 협력업체 기준정보 empty row 표시를 같은 컴포넌트로 교체

## 화면 테스트 위치

1. `/workspace/storage`
2. `/workspace/partners`
3. `/workspace/members`
4. `/workspace/stats`

## 확인할 것

- 데이터가 있을 때 목록 row가 기존처럼 표시되는지 확인한다.
- 데이터가 없을 때 empty 문구가 중앙에 표시되는지 확인한다.
- 멤버관리 로딩/빈 목록 표시가 과하게 커지거나 깨지지 않는지 확인한다.
- 협력업체관리의 빈 목록 문구가 기존 위치와 비슷한지 확인한다.

## 바뀌면 안 되는 것

- 목록 데이터 개수
- 검색/필터 결과
- row 클릭 동작
- 선택 체크박스 동작
- 저장소 삭제/복원/비우기 동작
- 협력업체 등록/수정 동작
- 멤버 상세/권한 모달 진입 동작
- 통계 계산식과 그래프 값

## 후속 작업

`AdminTableState`가 안정되면 고객사 관리자 화면의 Error state와 Action 포함 empty state를 같은 방식으로 정리한다.
