Version : 0.10.34
Summary : 시스템관리자 기준정보 관리 화면 설계
Description : 시스템관리자 기준정보 관리 설계 화면을 추가하고 시스템 콘솔에서 /system/standards로 진입할 수 있도록 연결했습니다. 단위 표준과 외주공정 유형은 시스템 표준 원장, 생산품 유형은 신규 고객사 기본 템플릿으로 분리하는 정책을 화면과 문서에 반영했습니다. 실제 CRUD, DB schema, 고객관리자 기준정보 저장 로직, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts

추가 파일 목록 :
- app/system/standards/page.tsx
- components/system/standards/SystemStandardsDesignPage.tsx
- lib/system/systemStandardsDesign.ts
- docs/system-standards-design-0.10.34.md

삭제 파일 목록 :
- 없음
