Version : 0.10.50
Summary : 기준정보 DB-only 회귀 점검 화면 추가
Description : 시스템관리자 기준정보 관리에 DB-only 회귀 점검 화면과 API를 추가했습니다. 단위 표준, 외주공정 유형, 기본 생산품 유형 템플릿, 템플릿 분류, 고객사별 사용 연결 무결성을 점검하며 fallback 혼입 없이 DB 결과만 사용하는 정책을 화면에서 확인할 수 있도록 했습니다. DB schema, 기준정보 CRUD, 고객관리자 저장 로직, 작업지시서 선택지, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- components/system/standards/SystemStandardsDesignPage.tsx
- components/system/standards/SystemStandardsSeedStatusPage.tsx

추가 파일 목록 :
- app/system/standards/regression/page.tsx
- app/api/system/standards/regression/route.ts
- components/system/standards/SystemStandardsRegressionPage.tsx
- lib/system/standards/regressionRepository.ts
- docs/admin-standards-db-only-regression-0.10.50.md

삭제 파일 목록 :
- 없음
