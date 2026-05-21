Version :
0.15.32

Summary :
시스템 고객사 승인 화면의 TSX 도메인 로직 분리

Description :
시스템 고객사 승인 화면에 있던 고객사 가입 신청 row 변환, 상태 표시, 필터 판정, 초대 링크 상태 표시 helper를 system presentation 계층으로 이동했다. 화면 컴포넌트는 fetch, 이벤트 처리, table과 modal 렌더링 중심으로 유지하고 DB/API/R2/권한/세션 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/55_wafl-a-type-tsx-domain-logic-separation.md
- lib/system/systemCompanyApprovalPresentation.ts

삭제 파일 목록 :
없음
