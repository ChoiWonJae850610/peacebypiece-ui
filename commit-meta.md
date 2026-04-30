Version: 0.9.14

Summary: 관리자 통계 구조 재설계

Description:
- 통계정보 화면에 기간 필터 표시, 핵심 지표 카드, 협력업체/파일 사용량 도넛형 표시, 첨부/휴지통 숫자 카드, 생산 단계/카테고리 분포 영역을 추가했습니다.
- 통계 데이터 조회 범위를 검토대기, 검수대기, 입고지연, 불량 발생, 공장 연결 수, 리오더 단계, 카테고리 분포까지 확장했습니다.
- 통계 selector/presentation 계층에서 계산과 표시 모델을 처리하도록 정리했습니다.
- lib/constants/app.ts는 APP_VERSION만 0.9.14로 변경하고 나머지 export는 유지했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION만 0.9.14로 갱신
- lib/admin/stats/types.ts: 통계 기간, 핵심 지표, 비율 포인트 타입 추가
- lib/admin/stats/selectors.ts: 통계 지표/기간/생산 단계/카테고리/첨부·휴지통 selector 추가
- lib/admin/stats/presentation.ts: 통계 화면 view model, 비율 계산, 도넛 segment 계산 추가
- lib/admin/adminStats.repository.ts: DB 통계 조회 범위 확장 및 snapshot 구성 확장
- components/admin/dashboard/AdminStatsDashboard.tsx: 통계정보 화면 레이아웃 재구성
- lib/i18n/ko/admin.ts: 통계정보 신규 문구 추가
- lib/i18n/en/admin.ts: 통계정보 신규 문구 추가
- commit-meta.md: 작업 메타 정보 갱신

작업 상세 내용:
- 기간 옵션은 7일/15일/30일/월별/직접 선택 구조로 표시되며 현재는 30일 기준 표시 상태입니다.
- 핵심 지표는 검토대기, 검수대기, 입고지연, 불량 발생, 공장별 통계로 구성했습니다.
- 협력업체 분포와 파일 사용량은 도넛형 요약 UI로 변경했습니다.
- 첨부파일/휴지통은 별도 숫자 카드로 분리했습니다.
- 생산 단계 비율은 reorder_round 기준으로 1차/2차/3차 이상을 표시합니다.
- 카테고리 분포는 payload의 categoryLabel/category/itemCategory 값을 우선 조회하고 없으면 분류 미지정으로 표시합니다.

검증:
- 현재 압축파일에는 node_modules가 없어 npm run build는 실행 불가했습니다. package.json/package-lock.json은 수정하지 않았습니다.
