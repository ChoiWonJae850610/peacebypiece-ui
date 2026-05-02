Version : 0.9.71
Base Version : 0.9.70
Target Version : 0.9.71
Summary : 시스템관리자 통계 항목 보완
Description : 시스템관리자 통계용 metric 정의, 고객사 수, 활성 고객사 수, 전체 저장용량, 고객사별 저장용량, 요금제별 고객 수, 초대 발송/수락 현황 skeleton을 stats repository에 추가하고 앱 버전을 0.9.71로 갱신했습니다. 실제 DB 통계 쿼리, 차트 UI, 결제 자동화 통계는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/stats/statsRepository.ts
- lib/stats/index.ts
추가 파일 목록 :
- lib/stats/systemStatsMetrics.ts
- docs/stats/system_stats_metrics.md
삭제 파일 목록 :
- 없음
