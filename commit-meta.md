Version : 0.15.75
Summary : 작업지시서 현재 사용자 권한 흐름 정리
Description : /api/auth/me 기반 작업지시서 세션 사용자 프로필 생성/병합 로직을 공통 유틸로 분리하고, 생성 버튼과 생성 액션이 동일한 derived 권한 기준을 사용하도록 정리했습니다. 담당자 목록 users는 병합 대상 목록으로만 유지하고 currentUser 권한 판단은 세션 프로필 기준으로 단일화했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/derived/buildWorkOrderDerivedState.ts
- lib/hooks/workorder/useWorkOrderSessionProfile.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
추가 파일 목록 :
- lib/workorder/sessionUserProfile.ts
삭제 파일 목록 :
- 없음
