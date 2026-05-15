Version :
0.12.57

Summary :
고객관리자 메인 대기현황 필터와 i18n 정리

Description :
고객관리자 메인화면의 주요 대기 현황 카드를 클릭하면 검토 대기, 발주 대기, 검수 대기, 입고 지연 목록이 좌측에 표시되도록 정리했다. 대기 목록 제목과 빈 상태 문구를 i18n으로 분리하고, 대표 이미지가 있으면 미리보기 영역에 표시되는 기존 흐름을 유지했다. 우측 주요 대기 현황 영역은 스크롤 없이 4개 항목이 보이도록 상단 카드 높이를 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/adminOperations.types.ts
- lib/admin/adminOperations.repository.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- components/admin/dashboard/AdminOperationsDashboard.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
