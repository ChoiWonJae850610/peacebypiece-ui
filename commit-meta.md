Version : 0.16.8
Summary : 작업지시서 page 구조 분리 및 빌드 오류 보정
Description : 작업지시서 라우트 page.tsx를 URL 진입점만 담당하도록 얇게 정리하고 실제 작업지시서 화면 조립 로직을 features/workorders/page로 이동했습니다. 0.16.7 빌드 실패 원인이던 standards 화면의 nullable companyName 전달 타입 오류를 보정했습니다. 화면 동작, DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- app/(workspace)/workspace/workorders/page.tsx
- app/(workspace)/workspace/standards/page.tsx
- lib/constants/app.ts
추가 파일 목록 :
- features/workorders/page/WorkordersWorkspacePage.tsx
삭제 파일 목록 :
- 없음
