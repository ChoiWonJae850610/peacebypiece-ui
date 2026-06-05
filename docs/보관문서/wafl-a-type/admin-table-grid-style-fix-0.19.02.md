# 0.19.02 AdminTable grid style 상속 보정

## 목적

0.19.01에서 `/system/storage-usage` 삭제 후보 목록의 header/row grid breakpoint를 맞췄지만, 실제 화면 변화가 없었다. 원인은 `AdminTable`의 `--admin-table-columns` CSS variable이 header에만 inline style로 주입되고 row에는 상속되지 않는 구조였기 때문이다.

## 반영 범위

- `components/admin/common/AdminTable.tsx`
- `gridTemplateColumns`로 전달된 값을 AdminTable 최상위 wrapper에 style로 주입
- header와 row가 같은 CSS variable을 참조하도록 보정

## 기대 결과

- `/system/storage-usage` PC 넓은 화면에서 삭제 후보 row가 header와 같은 column template을 사용한다.
- 기존처럼 첫 번째 컬럼에 상세 내용이 세로로 몰려 보이는 현상이 완화되어야 한다.
- 좁은 화면에서는 기존 `grid-cols-1`/card형 흐름을 유지한다.

## 변경하지 않은 것

- 삭제 후보 조회 로직
- 체크박스 선택 상태
- 선택 삭제/전체삭제 요청
- R2 purge 처리
- DB/API/company scope
- 저장소 용량 계산

## 테스트 위치

1. `/system/storage-usage`
2. 필요 시 기존 AdminTable 사용 화면 일부 눈검수
   - `/workspace/storage`
   - `/workspace/partners`
   - `/workspace/members`

## 바뀌면 안 되는 것

- 삭제 후보 개수
- 버튼 노출과 동작
- purge confirm 문구와 요청 흐름
- 모바일/좁은 화면 카드형 정보 누락

## 후속 판단

0.19.02 적용 후 `/system/storage-usage` row가 정상화되면, AdminTable 기반 화면의 공통 Table/Card shell 정리는 이 방향을 기준으로 단계적으로 진행한다.
