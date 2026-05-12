Version :
0.10.73

Summary :
고객별 요금제 변경 화면과 저장소 quota 타입 오류 수정

Description :
시스템관리자 요금제 화면에 고객별 요금제와 저장공간, 멤버, 가격 override 변경 preview를 추가했다. 0.10.72 빌드에서 발생한 저장소 snapshot quota 계산 타입 오류도 수정했다.

수정 파일 목록 :
- app/api/admin/files/snapshot/route.ts
- components/system/billing/SystemCompanyPlanSkeleton.tsx
- lib/system/systemCompanyPlanSkeleton.ts
- lib/billing/index.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/billing/companyPlanChangePolicy.ts
- docs/system-company-plan-change-screen-0.10.73.md

삭제 파일 목록 :
없음
