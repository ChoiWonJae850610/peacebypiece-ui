Version : 0.10.27
Summary : 통계 화면 탭 높이와 전환감 보정
Description : 통계 화면 탭 섹션의 외부 여백과 카드 최소 높이를 조정하고, 탭 콘텐츠 영역에 overflow-hidden과 안정적인 최소 높이를 적용했습니다. 탭 전환 시 좌우 슬라이드 거리를 줄이고 motion-reduce 환경에서 전환을 줄이도록 보정했습니다. 통계 계산 로직과 API, DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx

추가 파일 목록 :
- docs/admin-dashboard-tabs-polish-0.10.27.md

삭제 파일 목록 :
- 없음
