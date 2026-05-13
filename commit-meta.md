Version :
0.11.26

Summary :
날짜 입력 잔여 조사와 통계 빌드 오류 수정

Description :
관리자/시스템/작업지시서 화면의 남은 날짜 입력 UI를 조사해 작업지시서 납기일 입력은 별도 설계 대상으로 분리했다. 로컬 build log에서 확인된 AdminStatsDashboard의 useEffect import 누락 오류를 수정하고 APP_VERSION을 0.11.26으로 갱신했다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-date-input-audit-0.11.26.md

삭제 파일 목록 :
없음
