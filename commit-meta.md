Version : 0.14.7
Summary : A-TYPE 문서 세트 반영과 멤버 상태 타입 오류 수정
Description : WAFL A-TYPE v0.4 문서 세트를 docs/wafl-a-type에 추가하고, 멤버관리 상단 상태 카드 계산에서 rejected 상태 비교로 발생한 TypeScript 빌드 오류를 수정했습니다. MemberListPreview 상태 타입을 실제 AdminCompanyMemberRecord 상태와 일치시켜 approved, pending, rejected, suspended 상태를 모두 안전하게 처리하도록 정리했습니다.
수정 파일 목록 :
- lib/admin/members/memberManagementPresentation.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/01_wafl-a-type-source-audit.md
- docs/wafl-a-type/02_wafl-a-type-design-tokens.md
- docs/wafl-a-type/03_wafl-a-type-component-spec.md
- docs/wafl-a-type/04_wafl-a-type-device-layout-rules.md
- docs/wafl-a-type/05_wafl-a-type-page-templates.md
- docs/wafl-a-type/06_wafl-a-type-state-empty-error-rules.md
- docs/wafl-a-type/07_wafl-a-type-form-validation-rules.md
- docs/wafl-a-type/08_wafl-a-type-modal-drawer-sheet-rules.md
- docs/wafl-a-type/09_wafl-a-type-permission-ui-rules.md
- docs/wafl-a-type/10_wafl-a-type-i18n-copy-rules.md
- docs/wafl-a-type/11_wafl-a-type-implementation-architecture.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- docs/wafl-a-type/13_wafl-a-type-qa-checklist.md
- docs/wafl-a-type/14_wafl-a-type-share-pwa-app-strategy.md
삭제 파일 목록 :
- 없음
