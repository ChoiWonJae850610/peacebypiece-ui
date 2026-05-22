Version : 0.15.79
Summary : 작업지시서 draft 병합 유틸 정리
Description : 작업지시서 상세 hydration과 저장 결과 병합에서 중복으로 처리하던 draft-only 필드 복원 로직을 공통 유틸로 분리하고, draft-only 필드 판정을 명시 목록 기준으로 정리했습니다. 기능 동작 변경 없이 0.15.74~0.15.78에서 추가된 draft 보존 흐름의 중복을 줄였습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/storagePolicy.ts
- lib/workorder/workOrderHydration.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
추가 파일 목록 :
- lib/workorder/workOrderDraftMerge.ts
삭제 파일 목록 :
- 없음
