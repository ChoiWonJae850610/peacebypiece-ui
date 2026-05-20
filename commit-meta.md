Version : 0.15.4
Summary : Login Invite Error 화면 A-TYPE public frame 적용
Description : 공개 로그인, 초대, 초대 오류, 서비스 중지 화면을 A-TYPE public frame과 semantic token 기준으로 정리했다. 로그인 문구는 패션 생산 업무 흐름을 드러내는 방향으로 교체하고, 고객사/멤버 초대 화면은 같은 프레임과 상태 notice 구조를 공유하도록 공통 컴포넌트를 추가했다. DB/API/R2/권한/세션 로직은 변경하지 않았다.
수정 파일 목록 :
- docs/README.md
- lib/constants/app.ts
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- components/auth/WaflLoginPage.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- components/invitations/MemberInvitationJoinRequestPage.tsx
- app/(public)/service-paused/page.tsx
- app/(public)/invite/error/page.tsx
추가 파일 목록 :
- docs/wafl-a-type/25_wafl-a-type-login-invite-error-implementation.md
- components/public/ATypePublicFrame.tsx
삭제 파일 목록 :
없음
