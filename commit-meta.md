Version : 0.10.32
Summary : 환경설정 기준관리 모달 공통 프레임 정리
Description : 생산품 유형, 단위 표준, 외주공정 유형 기준관리 모달의 공통 프레임과 목록/버튼 스타일을 분리해 UI 통일성을 보정했습니다. 생산품 유형은 1차-2차-3차 계층 구조, 단위 표준은 한글명과 영문 코드 입력 구조, 외주공정 유형은 단순 목록 구조를 각각 유지했습니다. 기준정보 저장 로직, DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/standards/AdminItemCategoryManagementModal.tsx
- components/admin/standards/AdminUnitManagementModal.tsx
- components/admin/partnerMaster/PartnerProcessManagementModal.tsx

추가 파일 목록 :
- components/admin/standards/StandardManagementModalFrame.tsx
- docs/admin-standards-modal-frame-0.10.32.md

삭제 파일 목록 :
- 없음
