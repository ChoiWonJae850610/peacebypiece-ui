Version : 0.16.52
Summary : 워크플로우 상태 상수화 2차 정리
Description : 워크플로우 상태 기본값과 상태 비교 문자열을 공통 상수 기반으로 정리하고, 권한 코드 반환도 기존 공통 permission code 상수를 사용하도록 보정했습니다. auth/session/멤버 role preset 정책은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/actionFlow/workflowResults.ts
- lib/workorder/detail/detailSanitizers.ts
- lib/workorder/draftRows.ts
- lib/workorder/presentation/workOrderPresentation.ts
- lib/workorder/repository/dbFactoryOrderRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/workflowActionGate.ts
- lib/workorder/workflowPermissionPolicy.ts
- lib/workorder/workOrderDataRules.ts

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음
