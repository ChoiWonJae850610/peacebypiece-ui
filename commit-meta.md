Version : 0.17.23
Summary : 달력 팝업과 생산 구성 화면 압축
Description : 공통 날짜 선택 팝업의 폭을 줄여 우측 빈 공간을 줄이고, 작업지시서 PC 생산 구성 영역에서 외주공정 블록을 제거해 필요 원단/부자재만 넓게 표시하도록 정리했습니다. 외주 발주를 발주 정보 영역으로 이동하는 구조는 이번 버전에서 구현하지 않고 다음 설계 단계로 보류했습니다. 작업지시서 PDF 양식과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/date/PbpSingleDatePicker.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- lib/workorder/detail/detailFormatting.ts
추가 파일 목록 :
- docs/현재기준/0.17.23-calendar-and-production-composition-trim.md
삭제 파일 목록 :
없음
