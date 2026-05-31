Version : 0.18.78
Summary : 통계정보 workflow section 소스 정리
Description : 통계정보 작업흐름분석 섹션의 AdminSection, 탭 영역, active content animation wrapper 렌더링 책임을 AdminStatsWorkflowSection으로 분리했습니다. 통계 계산, 탭 전환, 기간 선택/적용, DB/API 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx

추가 파일 목록 :
- components/admin/dashboard/AdminStatsWorkflowSection.tsx
- docs/stats-workflow-section-source-cleanup-0.18.78.md

삭제 파일 목록 :
- 없음
