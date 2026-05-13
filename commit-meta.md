Version :
0.11.24

Summary :
관리자 통계 기간 선택 달력 공통 컴포넌트 분리

Description :
- 관리자 통계 화면 내부에 있던 기간 선택 달력 구현을 AdminDateRangePicker 공통 컴포넌트로 분리
- AdminStatsDashboard가 공통 기간 선택 컴포넌트와 getTodayAdminLocalDateValue를 사용하도록 정리
- 기존 기간 선택 UI, 미래 날짜 제한, custom period query 흐름은 유지
- APP_VERSION을 0.11.24로 갱신

수정 파일 목록 :
components/admin/dashboard/AdminStatsDashboard.tsx
lib/constants/app.ts

추가 파일 목록 :
components/admin/common/AdminDateRangePicker.tsx
docs/admin-date-range-picker-standardization-0.11.24.md

삭제 파일 목록 :
없음
