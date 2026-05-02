Version : 0.9.92
Base Version : 0.9.91
Target Version : 0.9.92
Summary : 시스템관리자 통계 API DB 집계 연결
Description : /api/system/stats가 DB 기준으로 전체 고객사 수, 활성 고객사 수, 전체 저장공간 사용량, 요금제별 고객 수, 초대 상태별 수와 초대 수락률을 집계하도록 연결했습니다. 고객사별 저장공간 사용량 상위 series도 추가했으며 화면 차트 연결과 audit log 통계는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/stats/statsRepository.ts
추가 파일 목록 :
- docs/stats/system_stats_db_aggregation.md
삭제 파일 목록 :
- 없음
