Version: 0.9.27

Summary: 관리자 통계 구조 2차 반영

Description:
- 관리자 통계 화면에 공장별 제작 통계 영역을 추가했다.
- 생산 단계 비율을 막대형 표시에서 도넛형 표시로 전환했다.
- 통계 조회 데이터에 orders 기준 공장별 제작 건수 집계를 추가했다.
- 통계 ViewModel에 공장별 제작 비율과 생산 단계 도넛 데이터를 연결했다.
- 관리자 통계 i18n 문구와 APP_VERSION을 0.9.27로 동기화했다.
- package.json / package-lock.json은 수정하지 않았다.
- 현재 실행 환경에 node_modules가 없어 로컬 build 검증은 완료하지 못했다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.27로 갱신
- lib/admin/stats/types.ts: 통계 스냅샷에 factoryProductionDistribution 추가
- lib/admin/stats/selectors.ts: 공장별 제작 통계 row 타입과 변환 selector 추가
- lib/admin/stats/presentation.ts: 생산 단계 도넛 및 공장별 제작 막대 ViewModel 추가
- lib/admin/adminStats.repository.ts: orders 기준 공장별 제작 통계 DB 조회 추가
- components/admin/dashboard/AdminStatsDashboard.tsx: 생산 단계 도넛 표시 및 공장별 제작 통계 카드 추가
- lib/i18n/ko/admin.ts: 관리자 통계 한국어 문구 추가
- lib/i18n/en/admin.ts: 관리자 통계 영어 문구 추가
- commit-meta.md: 이번 작업 메타데이터 갱신

작업 상세 내용:
1. 기존 0.9.26 통계 구조를 유지하면서 0.9.27 범위만 추가했다.
2. 공장별 제작 통계는 orders.factory_name을 기준으로 상위 6개를 집계한다.
3. 생산 단계 비율은 기존 productionRoundDistribution 데이터를 그대로 사용하되 도넛 컴포넌트로 표시한다.
4. DB 미설정/조회 실패 시에도 공장별 제작 통계가 빈 값으로 안정적으로 표시되도록 fallback을 추가했다.
5. i18n 문구는 dashboardPage 내부에 workorderCountSuffix, factoryProductionTitle을 추가했다.
