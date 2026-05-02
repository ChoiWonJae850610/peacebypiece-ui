Version : 0.9.106
Base Version : 0.9.105
Target Version : 0.9.106
Summary : 시스템관리자 콘솔 통계 read-only 표시
Description : 0.9.94에서 회귀 점검 화면으로 대체된 /system 홈을 SystemConsoleShell 본 화면으로 재연결하고, 기존 GET /api/system/stats를 사용해 시스템 통계를 read-only로 표시하도록 복원했습니다. 전체 고객사 수, 활성 고객사 수, 저장공간 사용량, 초대 현황, ratio, series와 시스템관리자 하위 route/API 진입점을 표시하며 저장 action, 결제 자동화, audit log write, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/system/page.tsx
- components/system/SystemConsoleShell.tsx
- lib/system/systemConsoleShell.ts
추가 파일 목록 :
- docs/system/system_console_stats_readonly.md
삭제 파일 목록 :
- 없음
