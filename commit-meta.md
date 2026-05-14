Version :
0.12.4

Summary :
공통 모달 theme 적용 구조 점검

Description :
공통 ModalShell/BaseModal 계열의 overlay, surface, body가 theme semantic token을 타도록 정리했다. AdminModal wrapper, section, 입력 필드와 footer action도 공통 modal/field/action token 기준으로 맞췄고, 개별 모달 내부 정리는 후속 회귀 대상으로 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/themes/defaultLight.ts
- lib/theme/semanticThemeTokens.ts
- components/common/modal/BaseModal.tsx
- components/common/modal/ModalBody.tsx
- components/admin/layout/AdminModal.tsx
- components/common/modal/modalFieldClassNames.ts
- components/common/modal/modalActions.tsx
- components/common/modal/modalPresets.ts

추가 파일 목록 :
- docs/common-modal-theme-structure-0.12.4.md

삭제 파일 목록 :
없음
