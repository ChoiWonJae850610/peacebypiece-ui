Version
0.9.28 → 0.9.29

Summary
관리자 대시보드를 오늘의 작업과 우선 처리 항목 중심으로 재구성

Description
관리자 메인 대시보드에서 기존 통계 중심 구성을 축소하고, 검토대기/검수대기 작업을 바로 확인할 수 있는 오늘의 작업 리스트와 우선 처리 카드 구조를 적용했습니다. DB 조회 snapshot에 오늘 표시용 작업 목록을 추가하고, 대시보드 문구를 i18n으로 정리했습니다.

수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.29로 갱신.
- lib/admin/adminOperations.types.ts: 대시보드 snapshot에 todayTasks 타입 추가.
- lib/admin/adminOperations.repository.ts: 작업지시서 제목과 납기 정보를 조회해 오늘의 작업 리스트, 검토대기/검수대기/입고지연 핵심 지표 생성.
- components/admin/dashboard/AdminOperationsDashboard.tsx: 기존 통계 중심 화면을 오늘의 작업 리스트, 우선 처리 카드, 축소형 상태 분포/흐름 구조로 재배치.
- lib/i18n/ko/admin.ts: 운영 대시보드 신규 문구와 상태/납기/우선 처리 라벨 추가.
- lib/i18n/en/admin.ts: 운영 대시보드 신규 영문 문구와 상태/납기/우선 처리 라벨 추가.
- commit-meta.md: 이번 작업 상세 기록 갱신.

작업 상세 내용
- 대시보드 기본 선택 기간을 오늘로 변경.
- 검토대기, 검수대기, 발주대기 작업을 오늘의 작업 리스트에 표시.
- 작업 카드에 상태, 우선 처리 라벨, 납기 표시를 추가.
- 기존 상태 흐름 그래프는 우측 하단 축소형으로 유지.
- 상태 분포는 보조 정보로 축소 유지.
- 관리자 메인 설명 문구를 운영 통계가 아닌 오늘의 작업 중심으로 변경.

검증
- 첨부 zip에 node_modules가 없어 npm run build는 즉시 실행되지 않았습니다.
- npm ci 설치를 시도했으나 실행 환경 시간 제한으로 완료하지 못했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.
