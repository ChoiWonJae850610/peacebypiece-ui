Version : 0.18.01
Summary : 관리자 UI 컴포넌트를 WAFL 공통 래퍼 기반으로 연결
Description : 기존 AdminButton/AdminCard/AdminSection API를 유지하면서 내부 구현을 AppButton/AppCard 계열 공통 UI 래퍼로 위임하여 관리자 화면의 독립 스타일 확장을 줄였습니다. AppButton에는 링크형 버튼과 className 생성 유틸을 추가하고, AppCard에는 section/article/header/div surface 지원을 추가했습니다. 기능 로직, DB, API, R2, 첨부/메모 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- components/common/ui/AppButton.tsx
- components/common/ui/AppCard.tsx
- components/common/ui/index.ts
- components/admin/common/AdminButton.tsx
- components/admin/layout/AdminCard.tsx
- components/admin/common/AdminSection.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/ui-admin-shim-0.18.01.md
삭제 파일 목록 :
