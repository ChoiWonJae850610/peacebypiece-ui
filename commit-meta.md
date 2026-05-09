Version :
0.9.22430

Summary :
관리자 통계 화면 타입과 SQL 안정성 보정

Description :
통계 화면 재배치 이후 DayPicker 선택값, 직접 기간 날짜 계산, 기간 검증 조건을 보정하고 납기 지연 통계 SQL의 due_date 캐스팅을 안전하게 정리했다. APP_VERSION을 0.9.22430으로 갱신하고 관련 안정화 문서를 추가했다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/admin/stats/selectors.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-build-runtime-stability-0.9.22430.md

삭제 파일 목록 :
없음
