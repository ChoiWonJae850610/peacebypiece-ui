Version : 0.12.78
Summary : 작업지시서 단일 날짜 선택기 기반 추가
Description : 작업지시서 납기일 달력 교체를 준비하기 위해 react-day-picker 기반 공통 단일 날짜 선택 컴포넌트와 로컬 날짜 유틸을 추가하고, 기존 통계 기간 선택기의 날짜 유틸도 공통 유틸을 재사용하도록 정리했습니다. 작업지시서 실제 납기일 입력 적용은 다음 버전으로 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/common/AdminDateRangePicker.tsx
추가 파일 목록 :
- lib/date/localDate.ts
- components/common/date/PbpSingleDatePicker.tsx
삭제 파일 목록 :
- 없음
