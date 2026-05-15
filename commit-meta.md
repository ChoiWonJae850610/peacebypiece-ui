Version :
0.12.67

Summary :
고객관리자 메인과 협력업체 관리 소스 마감 정리

Description :
고객관리자 메인화면의 대기 현황 수량·납기·큐 선택 표시 로직을 프레젠테이션 유틸로 분리했다. 협력업체 관리 테이블 정렬 로직을 도메인 프레젠테이션 유틸로 이동하고, 외주 공정 표시가 문자열 split에 의존하지 않고 view model의 badge 데이터를 사용하도록 정리했다. /admin 및 /admin/partners 화면의 DB, R2, CRUD, workflow 동작은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminOperationsDashboard.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx
- lib/admin/partner/index.ts

추가 파일 목록 :
- lib/admin/adminOperations.presentation.ts
- lib/admin/partner/tablePresentation.ts

삭제 파일 목록 :
없음
