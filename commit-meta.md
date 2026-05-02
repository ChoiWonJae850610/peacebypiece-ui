Version : 0.9.65
Base Version : 0.9.64
Target Version : 0.9.65
Summary : 요금제 용량 정책 타입 설계 추가
Description : plan, company plan assignment, storage/member limit, override, usage snapshot 타입과 기본 plan seed, 정책 계산 함수를 추가하고 앱 버전을 0.9.65로 갱신했습니다. 실제 결제 자동화, DB migration, R2 실시간 집계는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- lib/billing/planTypes.ts
- lib/billing/planPolicy.ts
- lib/billing/defaultPlans.ts
- lib/billing/index.ts
- docs/billing/plan_storage_policy_design.md
삭제 파일 목록 :
- 없음
