Version :
0.9.2221

Summary :
통계 화면 현재 요약과 기간별 분석 구조 재정의

Description :
고객관리자 통계 화면을 요금제 기준이 아니라 현재 시점 요약과 기간별 분석 기준으로 재정의했다. 상단 4개 카드는 누적 생산, 누적 납기 지연율, 누적 검수/불량률, 현재 저장소 사용량으로 정리하고 기간 필터는 작업흐름분석 이하에만 적용되도록 배치했다. 저장소 상세 요약과 저장소 카드 이동 기능은 통계 화면에서 제거했다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/admin/stats/types.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-current-period-0.9.2221.md

삭제 파일 목록 :
없음
