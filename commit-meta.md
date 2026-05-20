Version :
0.15.26

Summary :
public/auth 화면 사용자용 문구 정리 2차

Description :
로그인, 초대 오류, 고객사 관리자 초대, 멤버 초대, 서비스 제한 화면에 남은 개발자성 문구와 내부 용어를 사용자용 안내 문구로 정리했다. OAuth, 초대 검증, 승인 조회 API, DB/R2 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/auth/WaflLoginPage.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- components/invitations/MemberInvitationJoinRequestPage.tsx
- app/(public)/invite/error/page.tsx
- app/(public)/service-paused/page.tsx
- lib/invitations/invitationErrorPresentation.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/49_wafl-a-type-public-auth-copy-ux.md

삭제 파일 목록 :
없음
