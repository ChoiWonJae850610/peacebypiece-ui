Version: 0.9.26

Summary:
관리자 통계정보 화면에 기간 선택과 핵심 운영 지표 1차 구조를 반영했습니다.

Description:
- 통계정보 페이지에서 7일 / 15일 / 30일 / 월별 기간을 선택할 수 있도록 query 기반 기간 옵션을 연결했습니다.
- 선택한 기간 기준으로 작업지시서 현황, 완료 건수, 검토대기, 검수대기, 입고지연, 불량 지표가 계산되도록 DB 조회 범위를 정리했습니다.
- 핵심 지표를 검토대기 / 검수대기 / 입고지연 / 불량 4개로 정리하고 기존 공장별 통계 지표는 0.9.27 범위로 분리했습니다.
- 통계 카드의 완료 설명을 "이번달" 고정 표현에서 선택 기간 기준 표현으로 바꿨습니다.
- APP_VERSION을 0.9.26으로 동기화했습니다.

수정 파일 목록:
- app/admin/dashboard/page.tsx: searchParams의 period 값을 읽어 통계 repository에 전달하도록 변경.
- components/admin/dashboard/AdminStatsDashboard.tsx: 기간 옵션을 링크형 선택 UI로 변경하고 핵심 지표 카드 그리드를 4개 기준으로 정리.
- lib/admin/adminStats.repository.ts: 선택 기간별 DB 조회 조건을 적용하고 4개 핵심 지표 중심으로 snapshot 생성.
- lib/admin/stats/selectors.ts: 기간 정규화, 기간 옵션 생성, 완료/핵심 지표 selector 문구 구조 정리.
- lib/admin/stats/types.ts: 핵심 지표 타입을 검토대기/검수대기/입고지연/불량 기준으로 정리하고 selectedPeriod 추가.
- lib/constants/app.ts: APP_VERSION을 0.9.26으로 변경.
- lib/i18n/ko/admin.ts: 통계 요약/핵심 지표 한국어 문구를 선택 기간 기준으로 정리.
- lib/i18n/en/admin.ts: 통계 요약/핵심 지표 영어 문구를 선택 기간 기준으로 정리.

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

검증:
- npm run build 실행 시 현재 압축파일에 node_modules가 포함되어 있지 않아 next 명령을 찾지 못해 로컬 빌드 검증은 수행되지 않았습니다.
- package.json / package-lock.json은 수정하지 않았습니다.

다음 작업 권장 버전:
0.9.27 — 통계 구조 2차
- 공장별 통계
- 제작 단계 비율
- 도넛 그래프 구조 정리
