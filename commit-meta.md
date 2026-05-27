Version : 0.17.22
Summary : 외주공정 입력 단순화와 전역 필드 compact 조정
Description : 작업지시서 PC 생산 구성의 외주공정을 공정명만 입력하는 구조로 단순화하고, 입력/선택/날짜 필드의 전역 시각 크기를 compact 기준으로 낮췄습니다. 필요 원단/부자재 구조는 유지하고, 외주처/단가/금액/납기/완료 처리는 이후 외주공정 화면에서 확정하는 방향으로 문구를 정리했습니다. 작업지시서 PDF 양식과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- components/common/date/PbpSingleDatePicker.tsx
- components/workorder/detail/shared/detailEditorShared.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
- docs/현재기준/0.17.22-outsourcing-process-only-and-compact-fields.md
삭제 파일 목록 :
- 없음
