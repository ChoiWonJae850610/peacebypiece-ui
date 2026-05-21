Version :
0.15.29

Summary :
빌드 타입 오류 수정과 코드 품질 도메인 구조 감사

Description :
환경설정 화면의 i18n key 불일치로 발생한 TypeScript 빌드 오류를 수정했다. ko/en settingsForm의 고객사 기본 표시명을 같은 key로 통일하고 화면 참조도 함께 정리했다. 문자열 기반 조건 비교, raw payload 저장 후보, 하드코딩, 중복 함수, any 사용 후보를 전수 조사한 코드 품질 감사 문서를 추가하고 문서 인덱스와 로드맵을 갱신했다.

수정 파일 목록 :
- components/admin/settings/AdminCompanySettingsForm.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/52_wafl-a-type-code-quality-domain-audit.md

삭제 파일 목록 :
없음
