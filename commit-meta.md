Version : 0.9.37

Summary : 대시보드 실무형 작업 카드 보강

Description :
- 운영 대시보드의 오늘의 작업 목록을 검토대기와 검수대기 중심 카드 구조로 보강
- 작업 카드에 첨부 미리보기, 첨부 개수, 공장, 수량, 최근 업데이트 정보를 추가
- 작업지시서 화면으로 이동하는 액션 버튼을 추가
- 대시보드 작업 카드에 필요한 한글/영문 i18n 문구를 추가
- APP_VERSION 값을 0.9.37로 동기화

수정 파일 목록 :
- components/admin/dashboard/AdminOperationsDashboard.tsx : 오늘의 작업 카드 UI에 미리보기, 첨부 수, 공장, 수량, 업데이트, 이동 버튼 추가
- lib/admin/adminOperations.repository.ts : 대시보드 작업 데이터에 공장명, 수량, 첨부 요약, 썸네일, 이동 링크, 업데이트 표시값 추가
- lib/admin/adminOperations.types.ts : 오늘의 작업 카드 표시 데이터 타입 확장
- lib/i18n/ko/admin.ts : 대시보드 작업 카드용 한글 문구 추가
- lib/i18n/en/admin.ts : 대시보드 작업 카드용 영문 문구 추가
- lib/constants/app.ts : APP_VERSION 0.9.37 반영
- commit-meta.md : 이번 작업 메타 정보 갱신

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 대시보드가 단순 숫자 중심으로 보이던 부분을 작업지시서 처리에 필요한 목록형 카드 중심으로 조정
- 각 작업 카드에서 상태, 우선 처리 사유, 첨부 현황, 공장, 수량, 납기 정보를 한 번에 확인할 수 있도록 정리
- 첨부 썸네일 또는 preview URL이 있으면 카드 좌측에 미리보기로 표시하고, 없으면 미리보기 placeholder를 표시
- 작업지시서 이동 링크는 workOrderId 쿼리 기준으로 생성해 이후 작업지시서 화면 연동 보강이 가능하도록 구성
- DB 미설정/조회 실패 상태에서는 기존처럼 빈 작업 목록과 0건 지표를 유지
