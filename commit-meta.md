Version : 0.10.36
Summary : 시스템관리자 외주공정 유형 관리 1차 화면 추가
Description : 시스템관리자 기준정보 관리 흐름에 외주공정 유형 원장 1차 화면을 추가했습니다. /system/standards/processes 경로를 만들고 공정명, 분류, 설명, 사용 예시, 정렬 순서, 상태 기준 필드를 화면에 배치했습니다. 실제 CRUD, DB schema, 고객사별 사용 여부 저장, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- components/system/standards/SystemStandardsDesignPage.tsx

추가 파일 목록 :
- app/system/standards/processes/page.tsx
- components/system/standards/SystemProcessStandardsPage.tsx
- lib/system/standards/systemProcessStandards.ts
- docs/system-process-standards-0.10.36.md

삭제 파일 목록 :
- 없음
