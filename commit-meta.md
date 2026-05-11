Version : 0.10.28
Summary : 통계 화면 무스크롤 목표 압축 보정
Description : 통계 화면에서 상단 누적 카드와 통계 섹션 여백을 줄이고, DASHBOARD SECTIONS 문구와 저장소 사용량 MB 보조 문구를 제거했습니다. 생산 구성 도넛 그래프와 기간 분석 영역을 위로 당기고 기간 상위 5개 보조 설명을 제거해 PC 기준 한 화면에 더 가깝게 압축했습니다. 통계 계산 로직과 API, DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx

추가 파일 목록 :
- docs/admin-dashboard-compact-no-scroll-0.10.28.md

삭제 파일 목록 :
- 없음
