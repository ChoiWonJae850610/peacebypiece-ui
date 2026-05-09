Version :
0.9.22421

Summary :
i18n terms 도입 후 저장소 작업지시서 build 타입 오류 보정

Description :
저장소관리 작업지시서 목록에서 존재하지 않는 restorePolicy 속성을 참조하던 코드를 제거하고, 작업지시서 묶음 처리 정책 문구를 i18n key와 기존 fallback label 기준으로 표시하도록 수정했다.

수정 파일 목록 :
- components/admin/files/WorkOrderStorageSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/i18n-terms-build-type-fix-0.9.22421.md

삭제 파일 목록 :
없음
