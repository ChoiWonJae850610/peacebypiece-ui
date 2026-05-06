Version :
0.9.210

Summary :
시스템 관리자 통계 1차 상황판 추가

Description :
시스템관리자 콘솔에 고객사별 작업지시서 수, 저장 용량 사용률, 요금제 분포, 최근 활동일, 운영 위험 신호를 확인할 수 있는 통계 1차 상황판을 추가했다. 통계 탭은 화면 반영 상태로 변경하고 시스템 콘솔 내부 anchor로 연결했다. 이번 버전은 sample 기반 UI 기준을 고정하는 작업이며 DB schema, API route, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- components/system/SystemConsoleShell.tsx
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts

추가 파일 목록 :
- components/system/SystemStatsOverview.tsx
- docs/system-stats-overview-0.9.210.md
- lib/system/systemStats.ts

삭제 파일 목록 :
없음
